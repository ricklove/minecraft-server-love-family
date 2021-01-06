"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const packetLogger_1 = require("./tools/packetLogger");
const bdsx_1 = require("bdsx");
const formsApi_1 = require("./tools/formsApi");
const system = server.registerSystem(0, 0);
packetLogger_1.startPacketLogger();
// Chat Handler
bdsx_1.chat.on(ev => {
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
    const name = system.getComponent(entity, "minecraft:nameable" /* Nameable */);
    if (!name) {
        console.warn(`missing name`);
        return;
    }
    if (ev.message.toLowerCase().startsWith('form modal')) {
        console.log('sendModalForm sending');
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            const response = yield formsApi_1.FormsApi.sendModalForm({
                networkIdentifier: ev.networkIdentifier,
                title: 'Example Modal Form',
                content: 'This is some content!',
                leftButton: 'Cancel',
                rightButton: 'OK',
            });
        }), 3000);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2VudHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX2VudHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlEO0FBQ3pELCtCQUFvQztBQUNwQywrQ0FBNEM7QUFFNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsZ0NBQWlCLEVBQUUsQ0FBQztBQUVwQixlQUFlO0FBQ2YsV0FBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUVULE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM5QyxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM5QixPQUFPO0tBQ1Y7SUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ2pDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDdEIsT0FBTyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzdDLE9BQU87S0FDVjtJQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxzQ0FBOEIsQ0FBQztJQUN0RSxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1AsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM3QixPQUFPO0tBQ1Y7SUFFRCxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO1FBRW5ELE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUNyQyxVQUFVLENBQUMsR0FBUyxFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztZQUM1RCxNQUFNLFFBQVEsR0FBRyxNQUFNLG1CQUFRLENBQUMsYUFBYSxDQUFDO2dCQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCO2dCQUN2QyxLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixPQUFPLEVBQUUsdUJBQXVCO2dCQUNoQyxVQUFVLEVBQUUsUUFBUTtnQkFDcEIsV0FBVyxFQUFFLElBQUk7YUFDcEIsQ0FBQyxDQUFDO1FBRVAsQ0FBQyxDQUFBLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDVCxPQUFPO0tBQ1Y7SUFFRCw0REFBNEQ7SUFFNUQseUNBQXlDO0lBQ3pDLDBIQUEwSDtJQUUxSCx5QkFBeUI7SUFDekIsdUVBQXVFO0lBQ3ZFLHdEQUF3RDtJQUN4RCxnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLElBQUk7SUFFSixxREFBcUQ7SUFFckQseUNBQXlDO0lBQ3pDLDBIQUEwSDtJQUUxSCx5QkFBeUI7SUFDekIsdUVBQXVFO0lBQ3ZFLGlEQUFpRDtJQUNqRCxnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLElBQUk7SUFFSixxREFBcUQ7SUFFckQsOEVBQThFO0lBQzlFLHVLQUF1SztJQUN2SywwSEFBMEg7SUFFMUgsNEVBQTRFO0lBRTVFLHlCQUF5QjtJQUV6QixxQkFBcUI7SUFDckIsa0NBQWtDO0lBQ2xDLG1CQUFtQjtJQUVuQiwyRUFBMkU7SUFDM0UsMEVBQTBFO0lBQzFFLDBGQUEwRjtJQUMxRixzSUFBc0k7SUFFdEksb0NBQW9DO0lBQ3BDLDhJQUE4STtJQUM5SSxnS0FBZ0s7SUFDaEssZ0tBQWdLO0lBQ2hLLGdLQUFnSztJQUNoSyxnS0FBZ0s7SUFDaEssMkJBQTJCO0lBQzNCLG9CQUFvQjtJQUVwQixtQ0FBbUM7SUFDbkMsaUNBQWlDO0lBQ2pDLG9CQUFvQjtJQUNwQixrQkFBa0I7SUFDbEIsYUFBYTtJQUViLHFCQUFxQjtJQUVyQixnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLElBQUk7SUFFSixzREFBc0Q7SUFFdEQsNEVBQTRFO0lBRTVFLHFFQUFxRTtJQUNyRSwwSEFBMEg7SUFDMUgsY0FBYztJQUNkLElBQUk7QUFDUixDQUFDLENBQUMsQ0FBQyJ9