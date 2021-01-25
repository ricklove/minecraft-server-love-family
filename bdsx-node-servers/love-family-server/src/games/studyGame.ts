import { NetworkIdentifier } from "bdsx";
import { CommandsApiType } from "../tools/commandsApi";
import { FormsApiType } from "../tools/formsApi";
import { delay } from "../utils/delay";
import { FileWriterServiceType } from "../utils/fileWriter";
import { testRandomDistribution } from "../utils/random";
import { GameConsequenceType, GamePlayerInfo } from "./gameConsequences";
import { createMathSubject, MathProblemType } from "./subjects/mathProblems";
import { createSpellingSubject, SpellingProblemType } from "./subjects/spellingProblems";
import { StudySubject } from "./types";

const subjects = [
    createMathSubject(),
    createSpellingSubject(),
];

type StudyProblemType = MathProblemType | SpellingProblemType;
const getSubject = (subjectKey: StudyProblemType['subjectKey']): StudySubject<StudyProblemType, typeof subjectKey> => {
    return subjects.find(s => s.subjectKey === subjectKey) ?? subjects[0];
};

type StudyProblemAnswer = {
    wasCorrect: boolean,
    answerRaw: string | null,
    responseMessage?: string | null,
    problem: StudyProblemType,
    time: Date,
    timeToAnswerMs: number,
};

const REVIEW_RATIO = 0.9;

const sendProblemForm = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string): Promise<null | StudyProblemAnswer> => {
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

        if (playerState.wrongAnswers.length <= 0) { return; }
        // Chance for new problem
        if (playerState.wrongAnswers.length < 3 && Math.random() > REVIEW_RATIO) { return; }

        const w = playerState.wrongAnswers;
        const recent = w.slice(w.length - 5, w.length);
        const review = recent[Math.floor(recent.length * Math.random())];
        if (!review) { return; }

        // Add to queue and run queue
        const reviewSubject = getSubject(review.subjectKey);

        const reviewSequence = reviewSubject.getReviewProblemSequence(review);
        playerState.problemQueue.push(...reviewSequence);

        console.log('getReviewProblem - added to start of problemQueue', { playerName: playerState.playerName, reviewSequence, problemQueue: playerState.problemQueue });

        // Run as queued problem
        return getQueuedProblem();
    };

    const getProblem = () => {

        const qProblem = getQueuedProblem();
        if (qProblem) { return qProblem; }

        const wProblem = getReviewProblem();
        if (wProblem) { return wProblem; }

        const includedSubjects = subjects.filter(x => playerState.selectedSubjectCategories.some(s => s.subjectKey === x.subjectKey));
        const randomSubject = includedSubjects[Math.floor(Math.random() * includedSubjects.length)] ?? subjects[0];
        const problem = randomSubject.getNewProblem(playerState.selectedSubjectCategories);
        return problem;
    };

    const problem = getProblem();
    const problemSubject = getSubject(problem.subjectKey);

    const sendProblemForm = async () => {
        const formType = 'choices';
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
        });
        return response.formData?.answerRaw.value ?? null;
    };

    // Text to speech
    if (problem.questionPreviewChat) {
        commandsApi.sendMessage(playerName, problem.questionPreviewChat);
    }

    commandsApi.showTitle(playerName, problem.questionPreview, { fadeInTimeSec: 0, stayTimeSec: problem.questionPreviewTimeMs / 1000, fadeOutTimeSec: 0 });
    await delay(problem.questionPreviewTimeMs);


    const sendProblemFormWithReissueOnAccidentalAnswer = async () => {

        const timeSent = Date.now();
        const answerRaw = await sendProblemForm();
        const time = new Date();
        const timeToAnswerMs = Date.now() - timeSent;
        const { isCorrect, responseMessage } = problemSubject.evaluateAnswer(problem, answerRaw);

        // Re-issue question on accidental tap
        if (answerRaw == null) {
            return await sendProblemFormWithReissueOnAccidentalAnswer();
        }
        if (timeToAnswerMs < 1000) {
            return await sendProblemFormWithReissueOnAccidentalAnswer();
        }
        if (timeToAnswerMs < 3000 && !isCorrect) {
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

    return sendProblemFormWithReissueOnAccidentalAnswer();
};

const getRunningAverageReport = (playerState: null | PlayerState) => {
    if (!playerState) {
        return null;
    }

    const RUN_COUNT = 25;

    const allHistory = playerState.answerHistory;
    if (allHistory.length <= 0) { return null; }

    const lastSubjectKey = allHistory[allHistory.length - 1].problem.subjectKey;

    const h = allHistory.filter(x => x.problem.subjectKey === lastSubjectKey);
    const lastNItems = h.length <= RUN_COUNT ? h : h.slice(h.length - RUN_COUNT, h.length);
    const count = lastNItems.length;
    const countCorrect = lastNItems.filter(x => x.wasCorrect).length;
    const totalTimeMs = lastNItems.map(x => x.timeToAnswerMs).reduce((out, x) => { out += x; return out; }, 0);
    const aveTimeMs = totalTimeMs / count;

    if (count <= 0) { return null; }

    return {
        summary: `runAve ${lastSubjectKey}: ${countCorrect}/${count} ${(Math.floor(100 * (countCorrect / count)) + '').padStart(2, ' ')}% ${(aveTimeMs / 1000).toFixed(1)}secs`,
        summary_short: `${lastSubjectKey}: ${countCorrect}/${count} ${(Math.floor(100 * (countCorrect / count)) + '').padStart(2, ' ')}%`,
        averageTimeMs: aveTimeMs,
        countCorrect,
        countScope: count,
        lastSubjectKey,
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
        commandsApi.showTitle(playerName, responseMessage ?? `Excellent!`, { subTitle: scoreReport, fadeInTimeSec: 0, stayTimeSec: 3, fadeOutTimeSec: 0 });

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
        // Remove correct answers
        playerState.wrongAnswers = playerState.wrongAnswers.filter(x => x.key !== result.problem.key);
        playerState.problemQueue = playerState.problemQueue.filter(x => x.key !== result.problem.key);

        gameConsequences.onCorrect(player);

        console.log(`Right Answer`, {
            playerName: player.playerName,
            result,
            wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time} ${x.timeToAnswerMs} ${x.problem.key}!=${x.answerRaw}`),
            wrongAnswers: playerState.wrongAnswers,
            problemQueue: playerState.problemQueue,
        });

        return;
    }

    // If Wrong
    playerState.wrongAnswers.push(result.problem);
    gameConsequences.onWrong(player);

    console.log(`Wrong Answer`, {
        playerName: player.playerName,
        result,
        wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time} ${x.timeToAnswerMs} ${x.problem.key} != ${x.answerRaw}`),
        wrongAnswers: playerState.wrongAnswers,
        problemQueue: playerState.problemQueue,
    });
};

const createPlayerFileWriter = (fileWriterService: FileWriterServiceType, playerName: string, getRunningAverage: () => string) => {
    const playerFileWriter = fileWriterService.createPlayerAppendFileWriter(playerName, 'problemHistory.tsv');
    return async (a: StudyProblemAnswer) => await playerFileWriter.appendToFile(
        `${a.wasCorrect ? 'correct' : 'wrong'} \t${a.problem.subjectKey} \t${(a.timeToAnswerMs / 1000).toFixed(1)}secs \t${a.problem.key} \t${a.problem.question} \t${a.wasCorrect ? '==' : '!='} \t${a.answerRaw} \tRunAve=${getRunningAverage()} \t${a.time}\n`);
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
            playerName: x.playerName,
            timeStart: new Date(),
            problemQueue: [],
            wrongAnswers: [],
            answerHistory: [],
            selectedSubjectCategories: [],
            writeAnswerToFile: options.fileWriterService ? createPlayerFileWriter(options.fileWriterService, x.playerName, () => getRunningAverageReport(playerState)?.summary ?? '') : undefined,
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

            const subjectCategories = [
                ...subjects.reduce((out, s) => [
                    ...out,
                    ...s.getCategories().map(x => ({ subjectKey: s.subjectKey, subjectTitle: s.subjectTitle, ...x })),
                ], []),
            ];
            const catObj = {} as { [categoryKey: string]: { type: 'toggle', text: string } };
            subjectCategories.forEach(x => catObj[x.categoryKey] = { type: 'toggle', text: `${x.subjectTitle}: ${x.categoryTitle}` });
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

            const formDataResult = response.formData as { [categoryKey: string]: { value: boolean } };
            const selectedSubjectCategories = subjectCategories.filter(x => formDataResult[x.categoryKey].value);
            playerState.selectedSubjectCategories = selectedSubjectCategories;

            playerState.isReady = true;

            console.log('Player Ready', {
                subjectCategories,
                playerState,
            });
            commandsApi.sendMessage(playerState.playerName, `You are now playing the Study Game!!!`);
        });

    gameState.timeoutId = setTimeout(() => {
        options.players.forEach(p => {
            const playerState = gameState.playerStates.get(p.playerName);
            if (!playerState || !playerState.isReady) { return; }

            sendStudyFormWithResult(formsApi, commandsApi, p, gameConsequences);
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
};

type PlayerState = {
    isReady: boolean,
    playerName: string,
    timeStart: Date,
    problemQueue: StudyProblemType[],
    wrongAnswers: StudyProblemType[],
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
    stopStudyGame: stopStudyGame,
    isRunning: () => !!gameState.timeoutId,
};