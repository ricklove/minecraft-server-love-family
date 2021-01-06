import { startPacketLogger } from "./tools/packetLogger";
import { chat, CANCEL } from 'bdsx';
import { createCommandsApi } from "./tools/commands";
import { createFormsApi } from "./tools/formsApi";
import { sendFormExample_simple, sendFormExample_modal, sendFormExample_custom } from "./tools/formsApi.tests";

const system = server.registerSystem(0, 0);
const commandsApi = createCommandsApi(system);
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

        // TODO: Force Close Chat, so timeout is not needed here
        commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

        setTimeout(async () => {
            await sendFormExample_modal(formsApi, ev.networkIdentifier, playerName, commandsApi);
        }, 3000);
        return;
    }
    if (ev.message.toLowerCase().startsWith('form simple')) {

        // TODO: Force Close Chat, so timeout is not needed here
        commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

        setTimeout(async () => {
            await sendFormExample_simple(formsApi, ev.networkIdentifier, playerName, commandsApi);
        }, 3000);

        return;
    }
    if (ev.message.toLowerCase().startsWith('form custom')) {

        // TODO: Force Close Chat, so timeout is not needed here
        commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

        setTimeout(async () => {
            await sendFormExample_custom(formsApi, ev.networkIdentifier, playerName, commandsApi);
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
