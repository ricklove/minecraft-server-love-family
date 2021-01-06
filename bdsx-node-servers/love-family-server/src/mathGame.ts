import { Entity, NetworkIdentifier } from "bdsx";
import { clear } from "console";
import { CommandsApiType } from "./tools/commandsApi";
import { FormsApiType } from "./tools/formsApi";

const sendMathForm = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string) => {
    console.log('sendMathForm', { playerName });

    const a = Math.floor(Math.random() * 13);
    const b = Math.floor(Math.random() * 13);
    const correctAnswer = a * b;

    const response = await formsApi.sendCustomForm({
        networkIdentifier,
        playerName,
        title: `Multiplication`,
        content: {
            questionLabel: { type: 'label', text: `What is ${a} * ${b}` },
            answerRaw: { type: 'input', text: `Answer` },
        },
    });

    const { answerRaw } = response.formData;
    const answer = parseInt(answerRaw + '');

    if (answer === correctAnswer) {
        commandsApi.sendMessage(playerName, 'Excellent!');
        return { wasCorrect: true };
    }

    if (answerRaw === null) {
        commandsApi.sendMessage(playerName, `You didn't even answer the question!`);
        return { wasCorrect: false };
    }

    if (isNaN(answer)) {
        commandsApi.sendMessage(playerName, `That's not even a number!`);
        return { wasCorrect: false };
    }

    commandsApi.sendMessage(playerName, `Incorrect ${answer}! ${a} * ${b} = ${correctAnswer}`);
    return { wasCorrect: false };
};

const sendMathFormWithResult = async (formsApi: FormsApiType, commandsApi: CommandsApiType, system: IVanillaServerSystem, networkIdentifier: NetworkIdentifier, playerName: string, playerEntity: IEntity) => {
    const result = await mathGame.sendMathForm(formsApi, commandsApi, networkIdentifier, playerName);
    if (!result.wasCorrect) {
        const pos = system.getComponent(playerEntity, MinecraftComponent.Position);
        if (!pos) { return; }

        system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
        system.executeCommand(`/summon lightning_bolt ${pos.data.x + 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
        system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z + 1}`, () => { });
        system.executeCommand(`/summon lightning_bolt ${pos.data.x - 1} ${pos.data.y + 0} ${pos.data.z - 1}`, () => { });
    }
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

    const newPlayers = options.players.filter(x => !mathState.players.has(x.playerName));
    // const droppedPlayerNames = [...mathState.players.keys()].filter(playerName => !options.players.some(p => p.playerName === playerName));
    newPlayers.forEach(x => {
        mathState.players.set(x.playerName, {});
        commandsApi.sendMessage(x.playerName, `You are now playing the Math Game!!!`);
    });

    mathState.timeoutId = setTimeout(() => {
        options.players.forEach(p => {
            sendMathFormWithResult(formsApi, commandsApi, system, p.networkIdentifier, p.playerName, p.entity);
        });

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
    players: new Map<string, {}>(),
};

export const mathGame = {
    sendMathForm,
    sendMathFormWithResult,
    startMathGame: continueMathGame,
    stopMathGame,
    isRunning: () => !!mathState.timeoutId,
};