import { NetworkIdentifier } from "../types";
import { CommandsApiType } from "./commandsApi";
import { FormsApiType } from "./formsApi";

export const sendFormExample_simple = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string) => {
    console.log('sendFormExample_simple', { playerName });
    const response = await formsApi.sendSimpleForm({
        networkIdentifier,
        playerName,
        title: 'Example Modal Form',
        content: 'This is some content!',
        buttons: {
            buttonA: { text: 'Button A' },
            buttonB: { text: 'Image Button B', image: { type: 'url', data: 'https://raw.githubusercontent.com/karikera/bdsx/master/icon.png' } },
            buttonC: { text: 'Image C', image: { type: 'url', data: 'https://ricklove.me/blog-content/posts/2020-10-31-dork/dork-snake-mailbox.png' } },
        },
    });

    const { buttonClickedName } = response.formData;

    if (buttonClickedName === 'buttonA') {
        commandsApi.sendMessage(playerName, 'You clicked the plain button!');
    } else if (buttonClickedName === 'buttonB') {
        commandsApi.sendMessage(playerName, 'You clicked the Image button!');
    } else if (buttonClickedName === 'buttonC') {
        commandsApi.sendMessage(playerName, 'You clicked the Other Image button!');
    } else {
        commandsApi.sendMessage(playerName, 'You must have closed it!');
    }
};

export const sendFormExample_modal = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string) => {
    console.log('sendFormExample_modal', { playerName });
    const response = await formsApi.sendModalForm({
        networkIdentifier: networkIdentifier,
        playerName,
        title: 'Example Modal Form',
        content: 'This is some content!',
        button1: 'OK',
        button2: 'Cancel',
    });

    if (response.formData.wasButton1Clicked) {
        commandsApi.sendMessage(playerName, 'Yes!');
    } else {
        commandsApi.sendMessage(playerName, 'Fine, cancelling...');
    }
};

export const sendFormExample_custom = async (formsApi: FormsApiType, commandsApi: CommandsApiType, networkIdentifier: NetworkIdentifier, playerName: string) => {
    console.log('sendFormExample_custom', { playerName });
    const response = await formsApi.sendCustomForm({
        networkIdentifier,
        playerName,
        title: 'Example Modal Form',
        content: {
            label1: { type: 'label', text: 'Label A' },
            favoriteColor: { type: 'dropdown', text: 'What is your favorite color?', options: ['Red', 'Blue'] },
            inputMin: { type: 'input', text: 'Input minimal?' },
            inputPlace: { type: 'input', text: 'Input placeholder?', placeholder: 'Hold my place!' },
            inputDefault: { type: 'input', text: 'Input default?', default: 'Its a me!' },
            sliders: { type: 'slider', text: 'Sliders!', min: -10, max: 100, default: 42 },
            reaction: { type: 'step_slider', text: 'Your Reaction', steps: ['Wow', 'Awesome', 'Cool'] },
            compliment: { type: 'step_slider', text: 'Compliment', steps: ['Nice!', 'Great Job!', 'Do it again!'], default: 1 },
            leggoMyEggo: { type: 'toggle', text: 'Leggo my eggo?' },
        },
    });

    if (!response.formData) {
        commandsApi.sendMessage(playerName, `You did not responde`);
        return;
    }

    const { favoriteColor, compliment, leggoMyEggo } = response.formData;

    commandsApi.sendMessage(playerName, `Here is your results:

        Your favorite color is ${favoriteColor.value}.

        You told me, "${compliment.value}"...   Thanks! I appreciate it!

        You will${leggoMyEggo.value ? '' : ' NOT'} leggo my eggo.

    `.split('\n').map(x => x.trim()).join('\n'));
};