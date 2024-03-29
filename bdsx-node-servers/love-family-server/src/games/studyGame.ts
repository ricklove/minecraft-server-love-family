import { NetworkIdentifier } from "../types";
import { CommandsApiType } from "../tools/commandsApi";
import { FormsApiType } from "../tools/formsApi";
import { delay } from "../utils/delay";
import { FileWriterServiceType } from "../utils/fileWriter";
import { GameConsequenceType, GamePlayerInfo } from "./gameConsequences";
import { progressReport, RunningAverageEntry } from "./progressReport";
import { allSubjects, getSubject, StudyProblemAnswer, StudyProblemReviewState, StudyProblemType, StudySubject } from "./types";

const REVIEW_RATIO = 0.9;

const sendProblemForm = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string, timeoutMs = 20 * 1000): Promise<null | StudyProblemAnswer> => {
    console.log('sendProblemForm', { playerName });

    // Improve distribution
    // testRandomDistribution();

    const playerState = gameState.playerStates.get(playerName);
    if (!playerState) {
        console.log('sendProblemForm playerState is null', { playerName });
        return null;
    }

    const getQueuedProblem = () => {
        // return playerState.problemQueue.shift();

        if (playerState.problemQueue.length <= 0) { return; }

        console.log('getQueuedProblem', { playerName: playerState.playerName, problemQueue: playerState.problemQueue });

        // Don't remove from queue
        return playerState.problemQueue[0];
    };

    const getReviewProblem = () => {

        // Remove reviews that are at mastery level
        playerState.reviewProblems = playerState.reviewProblems.filter(x => x.reviewLevel < 3);

        if (playerState.reviewProblems.length <= 0) { return; }
        // Chance for new problem
        if (playerState.reviewProblems.length < 3 && Math.random() > REVIEW_RATIO) { return; }

        const lowestReviewLevel = Math.min(...playerState.reviewProblems.map(x => x.reviewLevel));
        const w = playerState.reviewProblems.filter(x => x.reviewLevel === lowestReviewLevel);
        const reviewProblem = w[0];
        if (!reviewProblem) { return; }

        // Add to queue and run queue
        const reviewSubject = getSubject(reviewProblem.problem.subjectKey);
        const reviewSequence = reviewSubject.getReviewProblemSequence(reviewProblem.problem, reviewProblem.reviewLevel);

        // Increase review level (it will reset on wrong answer)
        reviewProblem.reviewLevel++;

        // Mark sequence as review problems
        reviewSequence.forEach(x => x._isReviewProblem = true);
        playerState.problemQueue.push(...reviewSequence);

        console.log('getReviewProblem - sequence added', {
            playerName: playerState.playerName,
            reviewSequence,
            reviewProblems: playerState.reviewProblems.map(x => ({ reviewLevel: x.reviewLevel, ...x.problem })),
            // problemQueue: playerState.problemQueue,
        });

        // Run as queued problem
        return getQueuedProblem();
    };

    const getProblem = () => {

        const qProblem = getQueuedProblem();
        if (qProblem) { return qProblem; }

        const wProblem = getReviewProblem();
        if (wProblem) { return wProblem; }

        const includedSubjects = allSubjects.filter(x => playerState.selectedSubjectCategories.some(s => s.subjectKey === x.subjectKey));
        const randomSubject = includedSubjects[Math.floor(Math.random() * includedSubjects.length)] ?? allSubjects[0];
        const problem = randomSubject.getNewProblem(playerState.selectedSubjectCategories.filter(x => x.subjectKey === randomSubject.subjectKey));

        // Add to problem queue
        playerState.problemQueue.push(problem);

        // Run as queued problem (so it will auto-repeat if skipped)
        return getQueuedProblem() ?? problem;
    };

    const problem = getProblem();
    const problemSubject = getSubject(problem.subjectKey);

    const sendProblemForm = async () => {
        const formType = problem.isTyping ? 'input' : 'choices';
        if (formType === 'choices') {

            const wrongChoicesSet = problemSubject.getWrongChoices(problem);
            const wrongChoices = [...wrongChoicesSet.values()]
                .filter(x => x !== problem.correctAnswer)
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x)
                .slice(0, 3);
            const choices = [problem.correctAnswer, ...wrongChoices];
            const choicesRandomized = choices
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x);
            const buttons = choicesRandomized.map(x => x + '');

            const response = await formsApi.sendSimpleButtonsForm({
                networkIdentifier,
                playerName,
                title: problem.formTitle,
                content: problem.question,
                buttons,
                timeoutMs,
            });
            return response.formData.buttonClickedName;
        }

        const response = await formsApi.sendCustomForm({
            networkIdentifier,
            playerName,
            title: problem.formTitle,
            content: {
                questionLabel: { type: 'label', text: problem.question },
                answerRaw: { type: 'input', text: `Answer` },
            },
            timeoutMs,
        });
        return response.formData?.answerRaw.value ?? null;
    };

    // For Text to speech
    let textToSpeechRepeaterId = null as null | ReturnType<typeof setInterval>;
    if (problem.questionPreviewChat) {

        const chatTts = problem.questionPreviewChat;
        commandsApi.sendMessage(playerName, chatTts);
        await delay(problem.questionPreviewChatTimeMs ?? 0);

        let repeatCount = 0;
        textToSpeechRepeaterId = setInterval(() => {
            if (repeatCount > 5) {
                clearInterval(textToSpeechRepeaterId!);
                return;
            }
            commandsApi.sendMessage(playerName, chatTts);
            repeatCount++;
        }, 3000);
    }

    // Title Display
    if (problem.questionPreview && problem.questionPreviewTimeMs) {
        commandsApi.showTitle(playerName, problem.questionPreview, { fadeInTimeSec: 0, stayTimeSec: problem.questionPreviewTimeMs / 1000, fadeOutTimeSec: 0 });
        await delay(problem.questionPreviewTimeMs);
    }

    const sendProblemFormWithReissueOnAccidentalAnswer = async (): Promise<StudyProblemAnswer> => {

        const timeSent = Date.now();
        const answerRaw = await sendProblemForm();
        const time = new Date();
        const timeToAnswerMs = Date.now() - timeSent;
        const { isCorrect, responseMessage } = problemSubject.evaluateAnswer(problem, answerRaw?.trim());

        // Re-issue question on accidental tap
        if (answerRaw == null) {
            return await sendProblemFormWithReissueOnAccidentalAnswer();
        }
        if (timeToAnswerMs < 500) {
            return await sendProblemFormWithReissueOnAccidentalAnswer();
        }
        if (timeToAnswerMs < 1000 && !isCorrect) {
            return await sendProblemFormWithReissueOnAccidentalAnswer();
        }

        return {
            wasCorrect: isCorrect,
            responseMessage,
            answerRaw,
            problem,
            time,
            timeToAnswerMs,
        };
    };

    const result = await sendProblemFormWithReissueOnAccidentalAnswer();

    if (textToSpeechRepeaterId) { clearInterval(textToSpeechRepeaterId); }
    return result;
};

const getRunningAverageReport = (playerState: null | PlayerState) => {
    if (!playerState) {
        return null;
    }

    const RUN_COUNT = 25;

    const allHistory = playerState.answerHistory;
    if (allHistory.length <= 0) { return null; }

    const lastProblem = allHistory[allHistory.length - 1].problem;
    const lastSubjectKey = lastProblem.subjectKey;
    const lastCategoryKey = lastProblem.categoryKey;

    const h = allHistory.filter(x => x.problem.subjectKey === lastSubjectKey && x.problem.categoryKey === lastCategoryKey);
    const lastNItems = h.length <= RUN_COUNT ? h : h.slice(h.length - RUN_COUNT, h.length);
    const count = lastNItems.length;
    const countCorrect = lastNItems.filter(x => x.wasCorrect).length;
    const totalTimeMs = lastNItems.map(x => x.timeToAnswerMs).reduce((out, x) => { out += x; return out; }, 0);
    const aveTimeMs = totalTimeMs / count;

    if (count <= 0) { return null; }

    return {
        summary: progressReport.toString_runningAverage({ subjectKey: lastSubjectKey, categoryKey: lastCategoryKey, countCorrect, countTotal: count, averageTimeMs: aveTimeMs }),
        summary_short: progressReport.toString_runningAverage_short({ subjectKey: lastSubjectKey, categoryKey: lastCategoryKey, countCorrect, countTotal: count, averageTimeMs: aveTimeMs }),
        averageTimeMs: aveTimeMs,
        countCorrect,
        countTotal: count,
        subjectKey: lastSubjectKey,
        categoryKey: lastCategoryKey,
    };
};

const getPlayerScoreReport = (playerState: null | PlayerState) => {
    if (!playerState) {
        return;
    }

    const score = {
        answeredCount: playerState?.answerHistory.length || 1,
        correctCount: playerState?.answerHistory.filter(x => x.wasCorrect).length || 1,
    };
    const scoreReport = `${score.correctCount}/${score.answeredCount} ${(Math.floor(100 * (score.correctCount / score.answeredCount)) + '').padStart(2, ' ')}% ${getRunningAverageReport(playerState)?.summary ?? ''}`;
    return scoreReport;
};

const getPlayerShortScoreReport = (playerState: null | PlayerState) => {
    if (!playerState) {
        return;
    }

    const scoreReport = `${getRunningAverageReport(playerState)?.summary_short ?? ''}`;
    return scoreReport;
};

const sendAnswerResponse = (commandsApi: CommandsApiType, result: StudyProblemAnswer, playerName: string) => {
    const playerState = gameState.playerStates.get(playerName);
    if (!playerState) {
        console.warn('playerState not found', { playerName });
        return;
    }

    const { wasCorrect, answerRaw, problem, responseMessage } = result;
    const { correctAnswer } = problem;

    if (wasCorrect) {
        const scoreReport = getPlayerShortScoreReport(playerState);
        //commandsApi.sendMessage(playerName, responseMessage ?? `Excellent! ${scoreReport}`);
        commandsApi.showTitle(playerName, responseMessage ?? `Excellent!`, { subTitle: scoreReport, fadeInTimeSec: 0, stayTimeSec: 1, fadeOutTimeSec: 0 });

        return;
    }

    if (answerRaw === null) {
        // commandsApi.sendMessage(playerName, responseMessage ?? `You didn't even answer the question!`);
        commandsApi.showTitle(playerName, `Oops!`, { subTitle: responseMessage ?? `You didn't even answer the question!`, fadeInTimeSec: 0, stayTimeSec: 3, fadeOutTimeSec: 0 });

        return;
    }

    // commandsApi.sendMessage(playerName, responseMessage ?? `Incorrect! The answer is ${correctAnswer}!`);
    commandsApi.showTitle(playerName, `Incorrect!`, { subTitle: responseMessage ?? `The answer is ${correctAnswer}!`, fadeInTimeSec: 0, stayTimeSec: 3, fadeOutTimeSec: 0 });
    return;
};

const sendStudyFormWithResult = async (formsApi: FormsApiType, commandsApi: CommandsApiType, player: GamePlayerInfo, gameConsequences: GameConsequenceType) => {
    console.warn('sendStudyFormWithResult', { time: new Date() });


    const playerState = gameState.playerStates.get(player.playerName);
    if (!playerState) {
        console.warn('playerState not found', { playerName: player.playerName });
        return;
    }

    const result = await sendProblemForm(formsApi, commandsApi, player.networkIdentifier, player.playerName);
    if (!result) { return; }

    playerState.answerHistory.push(result);

    // Write to file
    await playerState.writeAnswerToFile?.(result);

    sendAnswerResponse(commandsApi, result, player.playerName);

    // If Correct
    if (result.wasCorrect) {
        // Leave wrong answers (remove on create review problem)
        const newReviewProblems = playerState.reviewProblems;

        // Remove correct answers
        //const newReviewProblems = playerState.reviewProblems.filter(x => x.key !== result.problem.key);
        const newProblemQueue = playerState.problemQueue.filter(x => x.key !== result.problem.key);

        // if (playerState.reviewProblems.length - newReviewProblems.length > 1
        //     || playerState.problemQueue.length - newProblemQueue.length > 1) {
        //     console.log(`✅ Answer correct - Removed multiple items from review`, {
        //         newReviewProblems,
        //         oldReviewProblems: playerState.reviewProblems,
        //         newProblemQueue,
        //         oldProblemQueue: playerState.problemQueue,
        //     });
        // }

        playerState.reviewProblems = newReviewProblems;
        playerState.problemQueue = newProblemQueue;


        gameConsequences.onCorrect(player);

        console.log(`Right Answer`, {
            playerName: player.playerName,
            result,
            wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time} ${x.timeToAnswerMs} ${x.problem.key}!=${x.answerRaw}`),
            reviewProblems: playerState.reviewProblems,
            problemQueue: playerState.problemQueue,
        });

        if (result.problem._isReviewProblem) {
            return {
                nextTimeMs: 10 * 1000,
            };
        }

        return;
    }

    // If Wrong
    const problemToReview = result.problem._reviewProblemSource ?? result.problem;
    const inReview = playerState.reviewProblems.find(x => x.problem.key === problemToReview.key);
    if (inReview) {
        // If wrong again, go back to level 0
        inReview.reviewLevel = 0;
    } else {
        // On first review, start with level 1
        playerState.reviewProblems.push({ problem: problemToReview, reviewLevel: 1 });
    }

    gameConsequences.onWrong(player);

    console.log(`Wrong Answer`, {
        playerName: player.playerName,
        result,
        wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time} ${x.timeToAnswerMs} ${x.problem.key} != ${x.answerRaw}`),
        reviewProblems: playerState.reviewProblems,
        problemQueue: playerState.problemQueue,
    });

    return {
        nextTimeMs: 5 * 1000,
    };
};

const DEFAULT_PROBLEM_TIME = 20 * 1000;
const MAX_ANSWER_TIME = DEFAULT_PROBLEM_TIME;

export const sendStudyFormWithResult_afterTime = (formsApi: FormsApiType, commandsApi: CommandsApiType, player: GamePlayerInfo, gameConsequences: GameConsequenceType, timeMs = DEFAULT_PROBLEM_TIME) => {
    console.log('sendStudyFormWithResult_afterTime', { time: new Date() });

    const playerState = gameState.playerStates.get(player.playerName);
    if (!playerState) {
        console.warn('playerState not found', { playerName: player.playerName });
        return;
    }

    // Skip is already pending
    if (playerState.nextProblemTimerId) { return; }

    playerState.nextProblemTimerId = setTimeout(async () => {
        try {
            const result = await sendStudyFormWithResult(formsApi, commandsApi, player, gameConsequences);
            const { nextTimeMs = DEFAULT_PROBLEM_TIME } = result ?? {};

            // Reset to enable next call
            playerState.nextProblemTimerId = null;

            // Next call
            sendStudyFormWithResult_afterTime(formsApi, commandsApi, player, gameConsequences, nextTimeMs);
        } catch (err) {
            // This could occur on form timeout
            console.warn('form error - timeout?', { playerName: player.playerName });

            // Reset to enable next call
            playerState.nextProblemTimerId = null;
        }
    }, timeMs);
};

export const playerDataFileName = 'problemHistory.tsv';

const createPlayerFileWriter = (fileWriterService: FileWriterServiceType, playerName: string, getRunningAverage: () => RunningAverageEntry) => {
    const playerFileWriter = fileWriterService.createPlayerAppendFileWriter(playerName, playerDataFileName);
    return async (a: StudyProblemAnswer) => await playerFileWriter.appendToFile(
        progressReport.toString_answerLine({ ...a, runningAverage: getRunningAverage() }));
};

const continueStudyGame = (
    formsApi: FormsApiType, commandsApi: CommandsApiType, gameConsequences: GameConsequenceType,
    options: {
        players: GamePlayerInfo[],
        intervalTimeMs: number,
        fileWriterService?: FileWriterServiceType,
    }
) => {
    console.log('continueStudyGame', { players: options.players.map(x => x.playerName) });

    if (gameState.timeoutId) { clearTimeout(gameState.timeoutId); }

    const newPlayers = options.players.filter(x => !gameState.playerStates.has(x.playerName));
    // const droppedPlayerNames = [...gameState.players.keys()].filter(playerName => !options.players.some(p => p.playerName === playerName));
    newPlayers.forEach(async x => {
        const playerState: PlayerState = {
            isReady: false,
            nextProblemTimerId: null,
            playerName: x.playerName,
            timeStart: new Date(),
            problemQueue: [],
            reviewProblems: [],
            answerHistory: [],
            selectedSubjectCategories: [],
            writeAnswerToFile: options.fileWriterService ? createPlayerFileWriter(options.fileWriterService, x.playerName, () => getRunningAverageReport(playerState)!) : undefined,
        };
        gameState.playerStates.set(x.playerName, playerState);
    });

    // Non ready players
    options.players.map(x => ({ x, playerState: gameState.playerStates.get(x.playerName)! }))
        .filter(p =>
            // If not ready
            !p.playerState.isReady
            // Or if not selected a subject
            || p.playerState.selectedSubjectCategories.length <= 0
            // TODO: Or change subject after a while
            // || p.playerState.answerHistory.length % 60 === 59
        )
        .forEach(async ({ x, playerState }) => {

            // For each selected subject, show a category selection
            const subjectObj = {} as { [subjectKey: string]: { type: 'toggle', text: string } };
            allSubjects.forEach(x => subjectObj[x.subjectKey] = { type: 'toggle', text: `${x.subjectTitle}` });

            const subjectResponse = await formsApi.sendCustomForm({
                networkIdentifier: x.networkIdentifier,
                playerName: playerState.playerName,
                title: 'Choose Subjects',
                content: {
                    questionLabel: { type: 'label', text: 'Select your subjects below:' },
                    // a: { type: 'toggle', text: '' },
                    ...subjectObj
                },
            });

            const subjectFormDataResult = subjectResponse.formData as null | { [subjectKey: string]: { value: boolean } };
            if(!subjectFormDataResult){ return; }

            const enabledSubjects = allSubjects.filter(x => subjectFormDataResult[x.subjectKey].value);

            // Get the selected categories for each enabled subject
            const allSelectedSubjectCategories = [] as {
                subjectKey: string;
                categoryKey: string;
            }[];
            for (const s of enabledSubjects) {

                const catObj = {} as { [categoryKey: string]: { type: 'toggle', text: string } };
                const subjectCategories = s.getCategories();
                subjectCategories.forEach(x => catObj[x.categoryKey] = { type: 'toggle', text: `${s.subjectTitle}: ${x.categoryTitle}` });

                const response = await formsApi.sendCustomForm({
                    networkIdentifier: x.networkIdentifier,
                    playerName: playerState.playerName,
                    title: 'Choose Subjects',
                    content: {
                        questionLabel: { type: 'label', text: 'Select your subjects below:' },
                        // a: { type: 'toggle', text: '' },
                        ...catObj
                    },
                });

                const formDataResult = response.formData as null | { [categoryKey: string]: { value: boolean } };
                if(!formDataResult){ return; }

                const selectedSubjectCategories = subjectCategories.filter(x => formDataResult[x.categoryKey].value);
                allSelectedSubjectCategories.push(...selectedSubjectCategories.map(x => ({ subjectKey: s.subjectKey, categoryKey: x.categoryKey })));
            }

            playerState.selectedSubjectCategories = allSelectedSubjectCategories;
            playerState.isReady = true;

            console.log('Player Ready', {
                playerState,
            });
            commandsApi.sendMessage(playerState.playerName, `You are now playing the Study Game!!!`);
        });

    gameState.timeoutId = setTimeout(() => {

        // Ensure player timers are going
        options.players.forEach(p => {
            const playerState = gameState.playerStates.get(p.playerName);
            if (!playerState || !playerState.isReady) { return; }
            if (playerState.nextProblemTimerId) { return; }

            sendStudyFormWithResult_afterTime(formsApi, commandsApi, p, gameConsequences);
        });

        // Report
        const report = [...gameState.playerStates.values()].map(p => `${p.playerName} ${getPlayerScoreReport(p)}`).join('\n');
        console.log('report', { report });
        // commandsApi.sendMessage('@a', report);

        // Loop
        continueStudyGame(formsApi, commandsApi, gameConsequences, options);
    }, options.intervalTimeMs);
};

const stopStudyGame = () => {
    if (!gameState.timeoutId) { return; }

    console.log('stopStudyGame');
    clearTimeout(gameState.timeoutId);
    gameState.timeoutId = null;

    for (const p of gameState.playerStates.values()) {
        if (!p.nextProblemTimerId) { continue; }

        clearTimeout(p.nextProblemTimerId);
        p.nextProblemTimerId = null;

        resetSubjects(p.playerName);
    }
};

const resetSubjects = (playerName: string) => {
    console.log('resetSubjects', { playerName });
    const p = gameState.playerStates.get(playerName);
    if(!p){ return; }
    p.selectedSubjectCategories = [];
    p.problemQueue = [];
    p.reviewProblems = [];
    p.isReady = false;
}

type PlayerState = {
    nextProblemTimerId: null | ReturnType<typeof setTimeout>,
    isReady: boolean,
    playerName: string,
    timeStart: Date,
    problemQueue: StudyProblemType[],
    reviewProblems: StudyProblemReviewState[],
    answerHistory: StudyProblemAnswer[],
    selectedSubjectCategories: {
        subjectKey: string,
        categoryKey: string,
    }[],
    writeAnswerToFile?: (answer: StudyProblemAnswer) => Promise<void>,
};

const gameState = {
    timeoutId: null as null | ReturnType<typeof setTimeout>,
    playerStates: new Map<string, PlayerState>(),
};

export const studyGame = {
    test_sendStudyFormWithResult: sendStudyFormWithResult,
    startStudyGame: continueStudyGame,
    resetSubjects,
    stopStudyGame: stopStudyGame,
    isRunning: () => !!gameState.timeoutId,
};