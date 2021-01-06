import { NetworkIdentifier } from "bdsx";
import { CommandsApiType } from "./tools/commandsApi";
import { FormsApiType } from "./tools/formsApi";

const sendMathForm = async (formsApi: FormsApiType, networkIdentifier: NetworkIdentifier, playerName: string, commandsApi: CommandsApiType) => {
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

export const mathGame = {
    sendMathForm,
};