import { Entity, NetworkIdentifier } from "bdsx";
import { CommandsApiType } from "./tools/commandsApi";
import { FormsApiType } from "./tools/formsApi";
import { testRandomDistribution } from "./utils/random";

const MAX = 12;

type MathFormResult = {
    wasCorrect: boolean,
    answer: number,
    answerRaw: string | null,
    problem: { a: number, b: number, correctAnswer: number },
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
        if (playerState.wrongAnswers.length < 3 && Math.random() > 0.5) { return; }

        const r = playerState.wrongAnswers[Math.floor(playerState.wrongAnswers.length * Math.random())];

        // Add to queue and run queue
        if (r.b > -MAX) { playerState.problemQueue.push({ a: r.a, b: r.b - 1, correctAnswer: r.a * (r.b - 1) }); }
        playerState.problemQueue.push({ a: r.a, b: r.b + 0, correctAnswer: r.a * (r.b + 0) });
        if (r.b < MAX) { playerState.problemQueue.push({ a: r.a, b: r.b + 1, correctAnswer: r.a * (r.b + 1) }); }

        // Run as queued problem
        return getQueuedProblem();
    };

    const getProblem = () => {

        const qProblem = getQueuedProblem();
        if (qProblem) { return qProblem; }

        const wProblem = getWrongAnswerProblem();
        if (wProblem) { return wProblem; }

        const a = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
        const b = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
        const correctAnswer = a * b;

        return { a, b, correctAnswer };
    };

    const { a, b, correctAnswer } = getProblem();

    const sendProblemForm = async () => {
        const formType = 'choices';
        if (formType === 'choices') {

            const wrongChoices = new Set([...new Array(7)].map(() => Math.floor(a + (3 - Math.random() * 5)) * Math.floor(b + ((3 - Math.random() * 5)))));
            const choices = [correctAnswer, ...[...wrongChoices.values()]
                .filter(x => x !== correctAnswer)
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x)
                .slice(0, 3)];
            const choicesRandomized = choices
                .map(x => ({ x, rand: Math.random() })).sort((a, b) => a.rand - b.rand).map(x => x.x);
            const buttons = choicesRandomized.map(x => x + '');

            const response = await formsApi.sendSimpleButtonsForm({
                networkIdentifier,
                playerName,
                title: `Multiplication`,
                content: `What is ${a} * ${b}`,
                buttons,
            });
            return response.formData.buttonClickedName;
        }

        const response = await formsApi.sendCustomForm({
            networkIdentifier,
            playerName,
            title: `Multiplication`,
            content: {
                questionLabel: { type: 'label', text: `What is ${a} * ${b}` },
                answerRaw: { type: 'input', text: `Answer` },
            },
        });
        return response.formData?.answerRaw.value ?? null;
    };

    const answerRaw = await sendProblemForm();
    const answer = parseInt(answerRaw + '');
    const problem = { a, b, correctAnswer };

    return {
        wasCorrect: answer === correctAnswer,
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
        return;
    }

    playerState.answerHistory.push({ ...result, time: Date.now() });

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

const sendMathFormWithConsequence = async (formsApi: FormsApiType, commandsApi: CommandsApiType, system: IVanillaServerSystem, networkIdentifier: NetworkIdentifier, playerName: string, playerEntity: IEntity) => {
    const result = await mathGame.sendMathForm(formsApi, commandsApi, networkIdentifier, playerName);

    const playerState = mathState.playerStates.get(playerName);
    if (!playerState) {
        return;
    }

    sendAnswerResponse(commandsApi, result, playerName);

    if (result.wasCorrect) {
        // Remove correct answers
        playerState.wrongAnswers = playerState.wrongAnswers.filter(x => !(x.a === result.problem.a && x.b === result.problem.b));
        return;
    }

    console.log(`Wrong Answer`, {
        playerName,
        result,
        wrongHistory: playerState.answerHistory.filter(x => !x.wasCorrect).map(x => `${x.time - playerState.timeStart} ${x.problem.a}*${x.problem.b}!=${x.answerRaw}`)
    });

    playerState.wrongAnswers.push(result.problem);

    const pos = system.getComponent(playerEntity, MinecraftComponent.Position);
    if (!pos) { return; }

    system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
    system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
    system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
    system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
};

type PlayerInfo = { networkIdentifier: NetworkIdentifier, playerName: string, entity: IEntity };
const continueMathGame = (
    formsApi: FormsApiType, commandsApi: CommandsApiType, system: IVanillaServerSystem,
    options: {
        players: PlayerInfo[],
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
            sendMathFormWithConsequence(formsApi, commandsApi, system, p.networkIdentifier, p.playerName, p.entity);
        });

        // Report
        const report = [...mathState.playerStates.values()].map(p => `${p.playerName} ${getPlayerScoreReport(p)}`).join('\n');
        console.log('report', { report });
        commandsApi.sendMessage('@a', report);

        // Loop
        continueMathGame(formsApi, commandsApi, system, options);
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
        problemQueue: { a: number, b: number, correctAnswer: number }[],
        wrongAnswers: { a: number, b: number, correctAnswer: number }[],
        answerHistory: { time: number, wasCorrect: boolean, answer: number, answerRaw: unknown, problem: { a: number, b: number, correctAnswer: number } }[],
    }>(),
};

export const mathGame = {
    sendMathForm,
    sendMathFormWithResult: sendMathFormWithConsequence,
    startMathGame: continueMathGame,
    stopMathGame,
    isRunning: () => !!mathState.timeoutId,
};