import { startPacketLogger } from "./tools/packetLogger";
import { chat, CANCEL } from 'bdsx';
import { FormsApi } from "./tools/formsApi";

const system = server.registerSystem(0, 0);
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

    if (ev.message.toLowerCase().startsWith('form modal')) {

        console.log('sendModalForm sending');
        setTimeout(async () => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            const response = await FormsApi.sendModalForm({
                networkIdentifier: ev.networkIdentifier,
                title: 'Example Modal Form',
                content: 'This is some content!',
                leftButton: 'Cancel',
                rightButton: 'OK',
            });

        }, 3000);
        return;
    }

    // if (ev.message.toLowerCase().startsWith('form custom')) {

    //     const message = `Sending a form!`;
    //     system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

    //     setTimeout(() => {
    //         console.log('sendExampleForm', { n: ev.networkIdentifier });
    //         sendExampleForm_Custom(ev.networkIdentifier);
    //     }, 3000);
    //     return;
    // }

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
