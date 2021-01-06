"use strict";
/// <reference types="minecraft-scripting-types-server" />
Object.defineProperty(exports, "__esModule", { value: true });
// Console Output
console.log("From Script> Hello, World!");
// Addon Script
const bdsx_1 = require("bdsx");
const common_1 = require("bdsx/common");
const system = server.registerSystem(0, 0);
system.listenForEvent("minecraft:entity_created" /* EntityCreated */, ev => {
    console.log('entity created: ' + ev.data.entity.__identifier__);
    // Get extra informations from entity
    const actor = bdsx_1.Actor.fromEntity(ev.data.entity);
    if (actor) {
        console.log('entity dimension: ' + common_1.DimensionId[actor.getDimension()]);
        const level = actor.getAttribute(common_1.AttributeId.PlayerLevel);
        console.log('entity level: ' + level);
        if (actor.isPlayer()) {
            const ni = actor.getNetworkIdentifier();
            console.log('player IP: ' + ni.getAddress());
        }
    }
});
system.listenForEvent("minecraft:player_attacked_entity" /* PlayerAttackedEntity */, ev => {
    var _a;
    console.log('PlayerAttackedEntity: ', { player: ev.data.player, attacked_entity: ev.data.attacked_entity });
    // Get extra informations from entity
    const actor = bdsx_1.Actor.fromEntity(ev.data.player);
    if (actor) {
        console.log('entity dimension: ' + common_1.DimensionId[actor.getDimension()]);
        const level = actor.getAttribute(common_1.AttributeId.PlayerLevel);
        console.log('entity level: ' + level);
        if (actor.isPlayer()) {
            const ni1 = actor.getNetworkIdentifier();
            const name = (_a = system.getComponent(ev.data.player, "minecraft:nameable" /* Nameable */)) === null || _a === void 0 ? void 0 : _a.data.name;
            const ni2 = connectionList_reverse.get(name !== null && name !== void 0 ? name : '');
            console.log('player IP: ', {
                name,
                ni1Address: ni1.getAddress(),
                ni2Address: ni2 === null || ni2 === void 0 ? void 0 : ni2.getAddress(),
                ni1,
                ni2,
            });
            if (ni2) {
                sendWarningForm(ni2);
            }
        }
    }
});
// Form test
function sendWarningForm(networkIdentifier) {
    let worldSelectForm = new formsapi_1.SimpleForm("§lDamage Warning", "§l§o§ePlease do not damage the zombie horses!");
    worldSelectForm.addButton("§l§bOK, I won't");
    console.log('sendExampleForm', { worldSelectForm });
    formsapi_1.sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {
        console.log("formResponse=", { data });
        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    });
}
// system.listenForEvent(ReceiveFromMinecraftServer.Item)
// Custom Command
const bdsx_2 = require("bdsx");
// this hooks all commands, but it cannot be executed by command blocks
bdsx_2.command.hook.on((command, originName) => {
    if (command === '/close') {
        bdsx_2.serverControl.stop(); // same with the stop command
        return 0;
    }
    if (command.startsWith('/>')) {
        try {
            console.log(eval(command.substr(2)));
            // run javacript
        }
        catch (err) {
            console.error(err.stack);
        }
        return 0;
    }
});
// Chat Listening
const bdsx_3 = require("bdsx");
bdsx_3.chat.on(ev => {
    //ev.setMessage(ev.message.toUpperCase() + " YEY 10!");
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
    if (ev.message.toLowerCase().startsWith('inv')) {
        const dumpInventory = (entity) => {
            const inv = system.getComponent(entity, "minecraft:inventory_container" /* InventoryContainer */);
            if (inv === null)
                throw Error(`${entity.id} has no inventory`);
            console.log(`[${entity.id}'s inventory]`);
            inv.data.forEach((x, i) => {
                if (x.__identifier__ === 'minecraft:undefined') {
                    return;
                }
                const getSlotName = () => {
                    if (i <= 8) {
                        return `inv-top(${i - 0})`;
                    }
                    if (i <= 17) {
                        return `inv-mid(${i - 9})`;
                    }
                    return `inv-bot(${i - 9 * 2})`;
                };
                console.log(`inv-item ${i}`, { i, slot: getSlotName(), x });
            });
            const hotbar = system.getComponent(entity, "minecraft:hotbar_container" /* HotbarContainer */);
            if (hotbar === null)
                throw Error(`${entity.id} has no hotbar`);
            console.log(`[${entity.id}'s hotbar]`);
            hotbar.data.forEach((x, i) => {
                if (x.__identifier__ === 'minecraft:undefined') {
                    return;
                }
                console.log(`hotbar-item ${i}`, { i, x });
            });
            const message = [
                ...inv.data.map((x, i) => x.__identifier__ !== 'minecraft:undefined' ? `inv[${i}] ${x.item} * ${x.count}` : ``),
                ...hotbar.data.map((x, i) => x.__identifier__ !== 'minecraft:undefined' ? `hotbar[${i}] ${x.item} * ${x.count}` : ``),
            ]
                .filter(x => x)
                .join('\n');
            const messageJson = JSON.stringify({ rawtext: [{ text: message }] });
            system.executeCommand(`/tellraw ${name.data.name} ${messageJson}`, () => { });
            // command.
        };
        dumpInventory(entity);
        // command.hook.
        // ev.networkIdentifier.getActor().
        return;
    }
    if (ev.message.toLowerCase().startsWith('cheat')) {
        system.executeCommand(`/gamemode creative ${name.data.name}`, () => { });
        system.executeCommand(`/op ${name.data.name}`, () => { });
        // command.hook.
        // ev.networkIdentifier.getActor().
        const message = `You are creative!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        return;
    }
    if (ev.message.toLowerCase().startsWith('form modal')) {
        const message = `Sending a form!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        setTimeout(() => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            form_example_1.sendExampleForm_Modal(ev.networkIdentifier);
        }, 3000);
        return;
    }
    if (ev.message.toLowerCase().startsWith('form custom')) {
        const message = `Sending a form!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        setTimeout(() => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            form_example_1.sendExampleForm_Custom(ev.networkIdentifier);
        }, 3000);
        return;
    }
    if (ev.message.toLowerCase().startsWith('form')) {
        const message = `Sending a form!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        setTimeout(() => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            form_example_1.sendExampleForm(ev.networkIdentifier);
        }, 3000);
        return;
    }
    if (ev.message.toLowerCase().startsWith('math')) {
        const count = parseInt(ev.message.replace('math', '').trim(), 10) || 1;
        const message = `${ev.message}: Sending ${count}(${ev.message.replace('math', '').trim()})(${parseInt(ev.message.replace('math', '').trim(), 10)}) math forms!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        const pos = system.getComponent(entity, "minecraft:position" /* Position */);
        setTimeout(() => {
            let i = 0;
            const askMath = () => {
                i++;
                console.log('sendExampleForm', { n: ev.networkIdentifier });
                form_example_1.sendExampleForm_Math(ev.networkIdentifier, (isCorrect) => {
                    const message = `You answered ${!isCorrect ? 'POORLY' : 'correctly'}!`;
                    system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
                    if (!isCorrect) {
                        system.executeCommand(`/summon lightning_bolt ${(pos === null || pos === void 0 ? void 0 : pos.data.x) || 0} ${(pos === null || pos === void 0 ? void 0 : pos.data.y) || 0} ${(pos === null || pos === void 0 ? void 0 : pos.data.z) || 0}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${((pos === null || pos === void 0 ? void 0 : pos.data.x) || 0) + 1} ${((pos === null || pos === void 0 ? void 0 : pos.data.y) || 0) + 0} ${((pos === null || pos === void 0 ? void 0 : pos.data.z) || 0) + 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${((pos === null || pos === void 0 ? void 0 : pos.data.x) || 0) + 1} ${((pos === null || pos === void 0 ? void 0 : pos.data.y) || 0) + 0} ${((pos === null || pos === void 0 ? void 0 : pos.data.z) || 0) - 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${((pos === null || pos === void 0 ? void 0 : pos.data.x) || 0) - 1} ${((pos === null || pos === void 0 ? void 0 : pos.data.y) || 0) + 0} ${((pos === null || pos === void 0 ? void 0 : pos.data.z) || 0) + 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${((pos === null || pos === void 0 ? void 0 : pos.data.x) || 0) - 1} ${((pos === null || pos === void 0 ? void 0 : pos.data.y) || 0) + 0} ${((pos === null || pos === void 0 ? void 0 : pos.data.z) || 0) - 1}`, () => { });
                        i--;
                    }
                    if (i < count) {
                        askMath();
                    }
                });
            };
            askMath();
        }, 3000);
        return;
    }
    if (ev.message.toLowerCase().startsWith('where')) {
        const pos = system.getComponent(entity, "minecraft:position" /* Position */);
        const message = `You are here: ${JSON.stringify(pos === null || pos === void 0 ? void 0 : pos.data)}!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        return;
    }
});
// Network Hooking: Get login IP and XUID
const bdsx_4 = require("bdsx");
const connectionList = new Map();
const connectionList_reverse = new Map();
// const players = [] as {}[];
bdsx_4.netevent.after(bdsx_4.PacketId.Login).on((ptr, networkIdentifier, packetId) => {
    const ip = networkIdentifier.getAddress();
    const [xuid, username] = bdsx_4.netevent.readLoginPacket(ptr);
    console.log(`${username}> IP=${ip}, XUID=${xuid}`);
    if (username) {
        connectionList.set(networkIdentifier, username);
        connectionList_reverse.set(username, networkIdentifier);
    }
    // sendPacket
    setTimeout(() => {
        console.log('packet sended');
        // It uses C++ class packets. and they are not specified everywhere.
        const textPacket = bdsx_4.createPacket(bdsx_4.PacketId.Text);
        textPacket.setCxxString('[message packet from bdsx]', 0x50);
        bdsx_4.sendPacket(networkIdentifier, textPacket);
        textPacket.dispose(); // need to delete it. or It will make memory lyrics
    }, 10000);
});
// Network Hooking: Print all packets
const tooLoudFilter = new Set([
    // PacketId.UpdateBlock,
    bdsx_4.PacketId.ClientCacheBlobStatus,
]);
for (let i = 2; i <= 136; i++) {
    if (tooLoudFilter.has(i))
        continue;
    bdsx_4.netevent.raw(i).on((ptr, size, networkIdentifier, packetId) => {
        console.assert(size !== 0, 'invalid packet size');
        //console.log('RECV ' + PacketId[packetId] + ': ' + ptr.readHex(Math.min(16, size)));
        const lines = [];
        let s = size;
        while (s > 0) {
            const hex = (ptr.readHex(Math.min(16, s)).trim() + [...new Array(Math.max(0, 16 - s))].map(x => ' __').join(''));
            const dec = (hex.split(' ').map(x => getDecimalValueFromHex(x)).join(''));
            const ascii = (hex.split(' ').map(x => getAsciiValueFromHex(x)).join(''));
            const asciiHex = (hex.split(' ').map(x => getAsciiHexValueFromHex(x)).join(''));
            lines.push(hex.replace(/__/g, '  ') + ' | ' + dec + ' | ' + ascii + ' | ' + asciiHex);
            s -= 16;
        }
        console.log('RECV ' + bdsx_4.PacketId[packetId] + ': ', [size, ...lines]);
    });
    bdsx_4.netevent.send(i).on((ptr, networkIdentifier, packetId) => {
        console.log('SEND ' + bdsx_4.PacketId[packetId] + ': ' + ptr.readHex(16));
    });
}
const getDecimalValueFromHex = (x) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) {
        return '  ' + '  ';
    }
    ;
    return (byte + '').padStart(3, '_') + ' ';
};
const getAsciiValueFromHex = (x) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) {
        return ' ';
    }
    ;
    if (byte > 32 && byte < 127) {
        return String.fromCharCode(byte);
    }
    return String.fromCharCode((byte || 0) + 0x2200);
};
const getAsciiHexValueFromHex = (x) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) {
        return '  ';
    }
    ;
    if (byte >= 65 && byte <= 90) {
        return ' ' + String.fromCharCode(byte);
    }
    if (byte >= 97 && byte <= 122) {
        return ' ' + String.fromCharCode(byte);
    }
    // return String.fromCharCode((byte || 0) + 0x2200);
    return x.trim().split('').map(x => parseInt(x, 16)).map(h => h < 10 ? String.fromCharCode(h + 0x2080) : String.fromCharCode(h + 0x24B6)).join('');
};
// netevent.raw(PacketId.Text).on((ptr, size, networkIdentifier)=>{
//     ptr.move(1); // the first byte is the packet id
//     console.log(ptr.readUint8()); // type
//     console.log(ptr.readUint8()); // needsTranslation 
//     console.log(ptr.readVarString()); // sourceName
//     console.log(ptr.readVarString()); // message
//     console.log(ptr.readVarString()); // xboxUserId
//     console.log(ptr.readVarString()); // platformChatId
// });
// Network Hooking: disconnected
bdsx_4.netevent.close.on(networkIdentifier => {
    const id = connectionList.get(networkIdentifier);
    connectionList.delete(networkIdentifier);
    console.log(`${id}> disconnected`);
});
// Call Native Functions
const bdsx_5 = require("bdsx");
const kernel32 = new bdsx_5.NativeModule("Kernel32.dll");
const user32 = new bdsx_5.NativeModule("User32.dll");
const GetConsoleWindow = kernel32.get("GetConsoleWindow");
const SetWindowText = user32.get("SetWindowTextW");
const wnd = GetConsoleWindow();
SetWindowText(wnd, "BDSX Window!!!");
// Parse raw packet
// referenced from https://github.com/pmmp/PocketMine-MP/blob/stable/src/pocketmine/network/mcpe/protocol/MovePlayerPacket.php
bdsx_4.netevent.raw(bdsx_4.PacketId.MovePlayer).on((ptr, size, ni) => {
    console.log(`Packet Id: ${ptr.readUint8()}`);
    const runtimeId = ptr.readVarBin();
    const x = ptr.readFloat32();
    const y = ptr.readFloat32();
    const z = ptr.readFloat32();
    const pitch = ptr.readFloat32();
    const yaw = ptr.readFloat32();
    const headYaw = ptr.readFloat32();
    const mode = ptr.readUint8();
    const onGround = ptr.readUint8() !== 0;
    console.log(`move: ${bdsx_5.bin.toString(runtimeId, 16)} ${x.toFixed(1)} ${y.toFixed(1)} ${z.toFixed(1)} ${pitch.toFixed(1)} ${yaw.toFixed(1)} ${headYaw.toFixed(1)} ${mode} ${onGround}`);
});
// referenced from https://github.com/pmmp/PocketMine-MP/blob/stable/src/pocketmine/network/mcpe/protocol/CraftingEventPacket.php
bdsx_4.netevent.raw(bdsx_4.PacketId.CraftingEvent).on((ptr, size, ni) => {
    console.log(`Packet Id: ${ptr.readUint8()}`);
    const windowId = ptr.readUint8();
    const type = ptr.readVarInt();
    const uuid1 = ptr.readUint32();
    const uuid2 = ptr.readUint32();
    const uuid3 = ptr.readUint32();
    const uuid4 = ptr.readUint32();
    console.log(`crafting: ${windowId} ${type} ${uuid1} ${uuid2} ${uuid3} ${uuid4}`);
    const size1 = ptr.readVarUint();
    // need to parse more
});
// Global Error Listener
const bdsx_6 = require("bdsx");
const form_example_1 = require("./tests/form-example");
const formsapi_1 = require("./tests/formsapi");
console.log('\nerror handling>');
bdsx_6.setOnErrorListener(err => {
    console.log('ERRMSG Example> ' + err.message);
    // return false; // Suppress default error outputs
});
console.log(eval("undefined_identifier")); // Make the error for this example
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleGFtcGxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMERBQTBEOztBQUUxRCxpQkFBaUI7QUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRTFDLGVBQWU7QUFDZiwrQkFBNkI7QUFDN0Isd0NBQXVEO0FBQ3ZELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sQ0FBQyxjQUFjLGlEQUEyQyxFQUFFLENBQUMsRUFBRTtJQUNqRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRWhFLHFDQUFxQztJQUNyQyxNQUFNLEtBQUssR0FBRyxZQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLEVBQUU7UUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUFHLG9CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLG9CQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUV0QyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUNsQixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUdoRDtLQUNKO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxNQUFN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QUFILEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLElBQUksQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDekksTUFBTSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLElBQUksQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDekksTUFBTSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxJQUFJLENBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLElBQUksQ0FBQyxDQUFDLEtBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQSxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUs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