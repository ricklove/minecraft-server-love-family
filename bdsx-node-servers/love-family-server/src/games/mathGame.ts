import { Entity, NetworkIdentifier } from "bdsx";
import { CommandsApiType } from "../tools/commandsApi";
import { FormsApiType } from "../tools/formsApi";
import { testRandomDistribution } from "../utils/random";
import { GameConsequenceType, GamePlayerInfo } from "./gameConsequences";

const MAX = 12;
const REVIEW_RATIO = 0.9;

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

type MathFormResult = {
    wasCorrect: boolean,
    answer: number,
    answerRaw: string | null,
    problem: MathProblemType,
};
const sendMathForm = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string): Promise<MathFormResult> => {
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

    const answerRaw = await sendProblemForm();
    const answer = parseInt(answerRaw + '');

    return {
        wasCorrect: answer === problem.correctAnswer,
        answer,
        answerRaw,
        problem,
    };
};

const getPlayerScoreReport = (playerState: null | ReturnType<typeof mathState.playerStates.get>) => {
    if (!playerState) {
        return;
    }

    const score = {
        answeredCount: playerState?.answerHistory.length || 1,
        correctCount: playerState?.answerHistory.filter(x => x.wasCorrect).length || 1,
    };
    const scoreReport = `${score.correctCount}/${score.answeredCount} ${(Math.floor(100 * (score.correctCount / score.answeredCount)) + '').padStart(2, ' ')}%`;
    return scoreReport;
};

const sendAnswerResponse = (commandsApi: CommandsApiType, result: MathFormResult, playerName: string) => {
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

    playerState.answerHistory.push({ ...result, time: Date.now() });
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
            wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time - playerState.timeStart} ${x.problem.key}!=${x.answerRaw}`),
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
        wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time - playerState.timeStart} ${x.problem.key}!=${x.answerRaw}`),
        wrongAnswers: playerState.wrongAnswers,
        problemQueue: playerState.problemQueue,
    });
};


const continueMathGame = (
    formsApi: FormsApiType, commandsApi: CommandsApiType, gameConsequences: GameConsequenceType,
    options: {
        players: GamePlayerInfo[],
        intervalTimeMs: number
    }
) => {
    console.log('continueMathGame', { players: options.players.map(x => x.playerName) });

    if (mathState.timeoutId) { clearTimeout(mathState.timeoutId); }

    const newPlayers = options.players.filter(x => !mathState.playerStates.has(x.playerName));
    // const droppedPlayerNames = [...mathState.players.keys()].filter(playerName => !options.players.some(p => p.playerName === playerName));
    newPlayers.forEach(x => {
        mathState.playerStates.set(x.playerName, {
            playerName: x.playerName,
            timeStart: Date.now(),
            problemQueue: [],
            wrongAnswers: [],
            answerHistory: [],
        });
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


const mathState = {
    timeoutId: null as null | ReturnType<typeof setTimeout>,
    playerStates: new Map<string, {
        playerName: string,
        timeStart: number,
        problemQueue: MathProblemType[],
        wrongAnswers: MathProblemType[],
        answerHistory: { time: number, wasCorrect: boolean, answer: number, answerRaw: unknown, problem: MathProblemType }[],
    }>(),
};

export const mathGame = {
    //  sendMathForm,
    test_sendMathFormWithResult: sendMathFormWithResult,
    startMathGame: continueMathGame,
    stopMathGame,
    isRunning: () => !!mathState.timeoutId,
};