import { Entity, NetworkIdentifier } from "bdsx";
import { CommandsApiType } from "../tools/commandsApi";
import { FormsApiType } from "../tools/formsApi";
import { delay } from "../utils/delay";
import { FileWriterServiceType } from "../utils/fileWriter";
import { testRandomDistribution } from "../utils/random";
import { GameConsequenceType, GamePlayerInfo } from "./gameConsequences";

const MAX = 12;
const REVIEW_RATIO = 0.9;

// TODO: 
// Record to File
// Decrease Review Problem Repeat Interval?
// Other Math Problem Types:
// Double digit addition/subtraction
// Powers & Roots
// Reduce Fractions
// Prime Factors

/** For division, question: product / a = b */
type MathProblemType = {
    key: string,
    question: string,
    a: number,
    b: number,
    operator: '*' | '+' | '-' | '/';
    correctAnswer: number
};

const calculateProblem = ({ a, b, operator }: Pick<MathProblemType, 'operator' | 'a' | 'b'>): MathProblemType => {
    const calculateAnswer = ({ a, b, operator }: Pick<MathProblemType, 'operator' | 'a' | 'b'>): number => {
        switch (operator) {
            case '*': return a * b;
            case '/': return a / b;
            case '-': return a - b;
            case '+': return a + b;
            default: return 0;
        }
    };

    if (operator === '/') {
        // product / a = b

        if (a === 0) { a = 1; }
        const product = calculateAnswer({ a, b, operator: '*' });

        const question = `What is ${product} ${operator} ${a}?`;
        const correctAnswer = calculateAnswer({ a: product, b: a, operator });

        return { key: question, question, a, b, operator, correctAnswer };
    }

    const question = `What is ${a} ${operator} ${b}?`;
    const correctAnswer = calculateAnswer({ a, b, operator });
    return { key: question, question, a, b, operator, correctAnswer };
};

const createRandomProblem = () => {
    const a = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
    const b = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
    const operator =
        Math.random() < 0.1 ? '/'
            : Math.random() < 0.1 ? '-'
                : Math.random() < 0.3 ? '+'
                    : '*';

    const problem = calculateProblem({ a, b, operator });
    return problem;
};

type MathProblemAnswer = {
    wasCorrect: boolean,
    answer: number,
    answerRaw: string | null,
    problem: MathProblemType,
    time: Date,
    timeToAnswerMs: number,
};
const sendMathForm = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string): Promise<MathProblemAnswer> => {
    console.log('sendMathForm', { playerName });

    // Improve distribution
    testRandomDistribution();

    const getQueuedProblem = () => {
        const playerState = mathState.playerStates.get(playerName);
        if (!playerState || playerState.problemQueue.length <= 0) { return; }

        return playerState.problemQueue.shift();
    };


    const getWrongAnswerProblem = () => {

        const playerState = mathState.playerStates.get(playerName);
        if (!playerState || playerState.wrongAnswers.length <= 0) { return; }

        // Chance for new problem
        if (playerState.wrongAnswers.length < 3 && Math.random() > REVIEW_RATIO) { return; }

        const w = playerState.wrongAnswers;
        const wWithCounts = new Map(w.map(x => [`${x.a}*${x.b}`, x]));
        const recent = w.slice(w.length - 5, w.length);
        const review = recent[Math.floor(recent.length * Math.random())];
        if (!review) { return; }


        // Add to queue and run queue
        const r = review;
        if (r.operator === '/') {
            playerState.problemQueue.push(calculateProblem({ a: r.a, b: r.b, operator: '*' }));
            playerState.problemQueue.push(calculateProblem({ b: r.a, a: r.b, operator: '*' }));
            playerState.problemQueue.push(calculateProblem({ a: r.a, b: r.b, operator: '/' }));
            playerState.problemQueue.push(calculateProblem({ b: r.a, a: r.b, operator: '/' }));
        } else {
            for (let i = r.b - 2; i <= r.b; i++) {
                if (i < -MAX) { continue; }
                if (i > MAX) { continue; }

                playerState.problemQueue.push(calculateProblem({ a: r.a, b: i, operator: r.operator }));
            }
        }

        // Run as queued problem
        return getQueuedProblem();
    };

    const getProblem = (): MathProblemType => {

        const qProblem = getQueuedProblem();
        if (qProblem) { return qProblem; }

        const wProblem = getWrongAnswerProblem();
        if (wProblem) { return wProblem; }

        const problem = createRandomProblem();
        return problem;
    };

    const problem = getProblem();

    const sendProblemForm = async () => {
        const formType = 'choices';
        if (formType === 'choices') {

            const { a, b, operator } = problem;
            const wrongChoices = new Set([...new Array(7)].map(() => Math.floor(calculateProblem({
                a: Math.floor(a + (3 - Math.random() * 5)),
                b: Math.floor(b + (3 - Math.random() * 5)),
                operator,
            }).correctAnswer)).filter(x => isFinite(x))
            );

            const choices = [problem.correctAnswer, ...[...wrongChoices.values()]
                .filter(x => x !== problem.correctAnswer)
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x)
                .slice(0, 3)];
            const choicesRandomized = choices
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x);
            const buttons = choicesRandomized.map(x => x + '');

            const response = await formsApi.sendSimpleButtonsForm({
                networkIdentifier,
                playerName,
                title: `Math Problem`,
                content: problem.question,
                buttons,
            });
            return response.formData.buttonClickedName;
        }

        const response = await formsApi.sendCustomForm({
            networkIdentifier,
            playerName,
            title: `Math Problem`,
            content: {
                questionLabel: { type: 'label', text: problem.question },
                answerRaw: { type: 'input', text: `Answer` },
            },
        });
        return response.formData?.answerRaw.value ?? null;
    };

    commandsApi.showTitle(playerName, problem.question, { fadeInTimeSec: 0, stayTimeSec: 1, fadeOutTimeSec: 0 });
    await delay(1000);

    const timeSent = Date.now();
    const answerRaw = await sendProblemForm();
    const answer = parseInt(answerRaw + '');

    const time = new Date();
    const timeToAnswerMs = Date.now() - timeSent;

    return {
        wasCorrect: answer === problem.correctAnswer,
        answer,
        answerRaw,
        problem,
        time,
        timeToAnswerMs,
    };
};

const getRunningAverage = (playerState: null | PlayerState) => {
    if (!playerState) {
        return '';
    }
    const h = playerState.answerHistory;
    const lastNItems = h.slice(h.length - 25, h.length);
    const count = lastNItems.length;
    const countCorrect = lastNItems.filter(x => x.wasCorrect).length;
    if (count <= 0) { return ''; }

    return `runAve: ${countCorrect}/${count} ${(Math.floor(100 * (countCorrect / count)) + '').padStart(2, ' ')}%`;
};

const getPlayerScoreReport = (playerState: null | PlayerState) => {
    if (!playerState) {
        return;
    }

    const score = {
        answeredCount: playerState?.answerHistory.length || 1,
        correctCount: playerState?.answerHistory.filter(x => x.wasCorrect).length || 1,
    };
    const scoreReport = `${score.correctCount}/${score.answeredCount} ${(Math.floor(100 * (score.correctCount / score.answeredCount)) + '').padStart(2, ' ')}% ${getRunningAverage(playerState)}`;
    return scoreReport;
};

const sendAnswerResponse = (commandsApi: CommandsApiType, result: MathProblemAnswer, playerName: string) => {
    const playerState = mathState.playerStates.get(playerName);
    if (!playerState) {
        console.warn('playerState not found', { playerName });
        return;
    }

    const { wasCorrect, answerRaw, answer, problem } = result;
    const { a, b, correctAnswer } = problem;

    if (wasCorrect) {
        const scoreReport = getPlayerScoreReport(playerState);
        commandsApi.sendMessage(playerName, `Excellent! ${scoreReport}`);
        return;
    }

    if (answerRaw === null) {
        commandsApi.sendMessage(playerName, `You didn't even answer the question!`);
        return;
    }

    if (isNaN(answer)) {
        commandsApi.sendMessage(playerName, `That's not even a number!`);
        return;
    }

    commandsApi.sendMessage(playerName, `Incorrect ${answer}! ${a} * ${b} = ${correctAnswer}`);
    return;
};

const sendMathFormWithResult = async (formsApi: FormsApiType, commandsApi: CommandsApiType, player: GamePlayerInfo, gameConsequences: GameConsequenceType) => {
    const result = await sendMathForm(formsApi, commandsApi, player.networkIdentifier, player.playerName);

    const playerState = mathState.playerStates.get(player.playerName);
    if (!playerState) {
        console.warn('playerState not found', { playerName: player.playerName });
        return;
    }

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
    const playerFileWriter = fileWriterService.createPlayerAppendFileWriter(playerName, 'mathProblemHistory.tsv');
    return async (a: MathProblemAnswer) => await playerFileWriter.appendToFile(
        `${a.wasCorrect ? 'correct' : 'wrong'} \t${(a.timeToAnswerMs / 1000).toFixed(1)}secs \t${a.problem.key} \t${a.wasCorrect ? '==' : '!='} \t${a.answerRaw} \tRunAve=${getRunningAverage()} \t${a.time}\n`);
};

const continueMathGame = (
    formsApi: FormsApiType, commandsApi: CommandsApiType, gameConsequences: GameConsequenceType,
    options: {
        players: GamePlayerInfo[],
        intervalTimeMs: number,
        fileWriterService?: FileWriterServiceType,
    }
) => {
    console.log('continueMathGame', { players: options.players.map(x => x.playerName) });

    if (mathState.timeoutId) { clearTimeout(mathState.timeoutId); }

    const newPlayers = options.players.filter(x => !mathState.playerStates.has(x.playerName));
    // const droppedPlayerNames = [...mathState.players.keys()].filter(playerName => !options.players.some(p => p.playerName === playerName));
    newPlayers.forEach(x => {


        const playerState: PlayerState = {
            playerName: x.playerName,
            timeStart: new Date(),
            problemQueue: [],
            wrongAnswers: [],
            answerHistory: [],
            writeAnswerToFile: options.fileWriterService ? createPlayerFileWriter(options.fileWriterService, x.playerName, () => getRunningAverage(playerState)) : undefined,
        };
        mathState.playerStates.set(x.playerName, playerState);
        commandsApi.sendMessage(x.playerName, `You are now playing the Math Game!!!`);
    });

    mathState.timeoutId = setTimeout(() => {
        options.players.forEach(p => {
            sendMathFormWithResult(formsApi, commandsApi, p, gameConsequences);
        });

        // Report
        const report = [...mathState.playerStates.values()].map(p => `${p.playerName} ${getPlayerScoreReport(p)}`).join('\n');
        console.log('report', { report });
        commandsApi.sendMessage('@a', report);

        // Loop
        continueMathGame(formsApi, commandsApi, gameConsequences, options);
    }, options.intervalTimeMs);
};

const stopMathGame = () => {
    if (!mathState.timeoutId) { return; }

    console.log('stopMathGame');
    clearTimeout(mathState.timeoutId);
    mathState.timeoutId = null;
};

type PlayerState = {
    playerName: string,
    timeStart: Date,
    problemQueue: MathProblemType[],
    wrongAnswers: MathProblemType[],
    answerHistory: MathProblemAnswer[],
    writeAnswerToFile?: (answer: MathProblemAnswer) => Promise<void>,
};

const mathState = {
    timeoutId: null as null | ReturnType<typeof setTimeout>,
    playerStates: new Map<string, PlayerState>(),
};

export const mathGame = {
    //  sendMathForm,
    test_sendMathFormWithResult: sendMathFormWithResult,
    startMathGame: continueMathGame,
    stopMathGame,
    isRunning: () => !!mathState.timeoutId,
};