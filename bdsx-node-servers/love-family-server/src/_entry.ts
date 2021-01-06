import { startPacketLogger } from "./tools/packetLogger";
import { chat, CANCEL } from 'bdsx';
import { createCommands } from "./tools/commands";
import { createFormsApi } from "./tools/formsApi";

const system = server.registerSystem(0, 0);
const commands = createCommands(system);
const formsApi = createFormsApi();

startPacketLogger();

// Chat Handler
chat.on(ev => {

    const actor = ev.networkIdentifier.getActor();
    if (!actor) {
        console.warn(`missing actor`);
        return;
    }

    const isPlayer = actor.isPlayer();
    const entity = actor.getEntity();
    if (!entity || !isPlayer) {
        console.warn(`missing entity or not player`);
        return;
    }

    const name = system.getComponent(entity, MinecraftComponent.Nameable);
    if (!name) {
        console.warn(`missing name`);
        return;
    }
    const playerName = name.data.name;

    if (ev.message.toLowerCase().startsWith('form modal')) {

        console.log('sendModalForm sending in 3000ms');
        setTimeout(async () => {
            console.log('sendModalForm sending', { n: ev.networkIdentifier });
            const response = await formsApi.sendModalForm({
                networkIdentifier: ev.networkIdentifier,
                playerName,
                title: 'Example Modal Form',
                content: 'This is some content!',
                buttonOK: 'OK',
                buttonCancel: 'Cancel',
            });

            if (response.data.isOk) {
                commands.sendMessage(playerName, 'Yes!');
            } else {
                commands.sendMessage(playerName, 'Ok, then...');
            }

        }, 3000);
        return;
    }

    if (ev.message.toLowerCase().startsWith('form simple')) {

        console.log('sendSimpleForm sending in 3000ms');
        setTimeout(async () => {
            console.log('sendSimpleForm', { n: ev.networkIdentifier });
            const response = await formsApi.sendSimpleForm({
                networkIdentifier: ev.networkIdentifier,
                playerName,
                title: 'Example Modal Form',
                content: 'This is some content!',
                buttons: [
                    { text: 'Button A' },
                    { text: 'Image Button B', image: { type: 'url', data: 'https://raw.githubusercontent.com/karikera/bdsx/master/icon.png' } },
                    { text: 'Image C', image: { type: 'url', data: 'https://ricklove.me/blog-content/posts/2020-10-31-dork/dork-snake-mailbox.png' } },
                ],

            });
        }, 3000);
        return;
    }

    if (ev.message.toLowerCase().startsWith('form custom')) {

        console.log('sendCustomForm sending in 3000ms');
        setTimeout(async () => {
            console.log('sendCustomForm', { n: ev.networkIdentifier });
            const response = await formsApi.sendCustomForm({
                networkIdentifier: ev.networkIdentifier,
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

            const { favoriteColor, compliment, leggoMyEggo } = response.data;

            commands.sendMessage(playerName, `Here is your results: 
                Your favorite color is ${favoriteColor}.
                You told me, "${compliment}". I appreciate it!
                You will${leggoMyEggo ? '' : ' NOT'} leggo my eggo.
            `.split('/n').map(x => x.trim()).join('/n'));
        }, 3000);
        return;
    }

    // if (ev.message.toLowerCase().startsWith('form')) {

    //     const message = `Sending a form!`;
    //     system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

    //     setTimeout(() => {
    //         console.log('sendExampleForm', { n: ev.networkIdentifier });
    //         sendExampleForm(ev.networkIdentifier);
    //     }, 3000);
    //     return;
    // }

    // if (ev.message.toLowerCase().startsWith('math')) {

    //     const count = parseInt(ev.message.replace('math', '').trim(), 10) || 1;
    //     const message = `${ev.message}: Sending ${count}(${ev.message.replace('math', '').trim()})(${parseInt(ev.message.replace('math', '').trim(), 10)}) math forms!`;
    //     system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

    //     const pos = system.getComponent(entity, MinecraftComponent.Position);

    //     setTimeout(() => {

    //         let i = 0;
    //         const askMath = () => {
    //             i++;

    //             console.log('sendExampleForm', { n: ev.networkIdentifier });
    //             sendExampleForm_Math(ev.networkIdentifier, (isCorrect) => {
    //                 const message = `You answered ${!isCorrect ? 'POORLY' : 'correctly'}!`;
    //                 system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

    //                 if (!isCorrect) {
    //                     system.executeCommand(`/summon lightning_bolt ${pos?.data.x || 0} ${pos?.data.y || 0} ${pos?.data.z || 0}`, () => { });
    //                     system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) + 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) + 1}`, () => { });
    //                     system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) + 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) - 1}`, () => { });
    //                     system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) - 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) + 1}`, () => { });
    //                     system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) - 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) - 1}`, () => { });
    //                     i--;
    //                 }

    //                 if (i < count) {
    //                     askMath();
    //                 }
    //             });
    //         };

    //         askMath();

    //     }, 3000);
    //     return;
    // }

    // if (ev.message.toLowerCase().startsWith('where')) {

    //     const pos = system.getComponent(entity, MinecraftComponent.Position);

    //     const message = `You are here: ${JSON.stringify(pos?.data)}!`;
    //     system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
    //     return;
    // }
});
