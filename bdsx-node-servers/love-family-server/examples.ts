/// <reference types="minecraft-scripting-types-server" />

// Console Output
console.log("From Script> Hello, World!");

// Addon Script
import { Actor } from "bdsx";
import { DimensionId, AttributeId } from "bdsx/common";
const system = server.registerSystem(0, 0);
system.listenForEvent(ReceiveFromMinecraftServer.EntityCreated, ev => {
    console.log('entity created: ' + ev.data.entity.__identifier__);

    // Get extra informations from entity
    const actor = Actor.fromEntity(ev.data.entity);
    if (actor) {
        console.log('entity dimension: ' + DimensionId[actor.getDimension()]);
        const level = actor.getAttribute(AttributeId.PlayerLevel);
        console.log('entity level: ' + level);

        if (actor.isPlayer()) {
            const ni = actor.getNetworkIdentifier();
            console.log('player IP: ' + ni.getAddress());


        }
    }
});

system.listenForEvent(ReceiveFromMinecraftServer.PlayerAttackedEntity, ev => {
    console.log('PlayerAttackedEntity: ', { player: ev.data.player, attacked_entity: ev.data.attacked_entity });

    // Get extra informations from entity
    const actor = Actor.fromEntity(ev.data.player);
    if (actor) {
        console.log('entity dimension: ' + DimensionId[actor.getDimension()]);
        const level = actor.getAttribute(AttributeId.PlayerLevel);
        console.log('entity level: ' + level);

        if (actor.isPlayer()) {
            const ni1 = actor.getNetworkIdentifier();
            const name = system.getComponent(ev.data.player, MinecraftComponent.Nameable)?.data.name;
            const ni2 = connectionList_reverse.get(name ?? '');

            console.log('player IP: ', {
                name,
                ni1Address: ni1.getAddress(),
                ni2Address: ni2?.getAddress(),
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
function sendWarningForm(networkIdentifier: NetworkIdentifier) {
    let worldSelectForm = new SimpleForm("§lDamage Warning", "§l§o§ePlease do not damage the zombie horses!");
    worldSelectForm.addButton("§l§bOK, I won't");

    console.log('sendExampleForm', { worldSelectForm });
    sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {

        console.log("formResponse=", { data });

        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    })

}

// system.listenForEvent(ReceiveFromMinecraftServer.Item)

// Custom Command
import { command, serverControl } from "bdsx";
// this hooks all commands, but it cannot be executed by command blocks
command.hook.on((command, originName) => {
    if (command === '/close') {
        serverControl.stop(); // same with the stop command
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
import { chat, CANCEL } from 'bdsx';
chat.on(ev => {
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

    const name = system.getComponent(entity, MinecraftComponent.Nameable);
    if (!name) {
        console.warn(`missing name`);
        return;
    }

    if (ev.message.toLowerCase().startsWith('inv')) {

        const dumpInventory = (entity: IEntity) => {
            const inv = system.getComponent(entity, MinecraftComponent.InventoryContainer);
            if (inv === null) throw Error(`${entity.id} has no inventory`);

            console.log(`[${entity.id}'s inventory]`);
            inv.data.forEach((x, i) => {
                if (x.__identifier__ === 'minecraft:undefined') { return; }

                const getSlotName = () => {
                    if (i <= 8) { return `inv-top(${i - 0})`; }
                    if (i <= 17) { return `inv-mid(${i - 9})`; }
                    return `inv-bot(${i - 9 * 2})`;
                };
                console.log(`inv-item ${i}`, { i, slot: getSlotName(), x });
            });

            const hotbar = system.getComponent(entity, MinecraftComponent.HotbarContainer);
            if (hotbar === null) throw Error(`${entity.id} has no hotbar`);
            console.log(`[${entity.id}'s hotbar]`);
            hotbar.data.forEach((x, i) => {
                if (x.__identifier__ === 'minecraft:undefined') { return; }

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
        }
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
            sendExampleForm_Modal(ev.networkIdentifier);
        }, 3000);
        return;
    }

    if (ev.message.toLowerCase().startsWith('form custom')) {

        const message = `Sending a form!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

        setTimeout(() => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            sendExampleForm_Custom(ev.networkIdentifier);
        }, 3000);
        return;
    }

    if (ev.message.toLowerCase().startsWith('form')) {

        const message = `Sending a form!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

        setTimeout(() => {
            console.log('sendExampleForm', { n: ev.networkIdentifier });
            sendExampleForm(ev.networkIdentifier);
        }, 3000);
        return;
    }

    if (ev.message.toLowerCase().startsWith('math')) {

        const count = parseInt(ev.message.replace('math', '').trim(), 10) || 1;
        const message = `${ev.message}: Sending ${count}(${ev.message.replace('math', '').trim()})(${parseInt(ev.message.replace('math', '').trim(), 10)}) math forms!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

        const pos = system.getComponent(entity, MinecraftComponent.Position);

        setTimeout(() => {

            let i = 0;
            const askMath = () => {
                i++;

                console.log('sendExampleForm', { n: ev.networkIdentifier });
                sendExampleForm_Math(ev.networkIdentifier, (isCorrect) => {
                    const message = `You answered ${!isCorrect ? 'POORLY' : 'correctly'}!`;
                    system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });

                    if (!isCorrect) {
                        system.executeCommand(`/summon lightning_bolt ${pos?.data.x || 0} ${pos?.data.y || 0} ${pos?.data.z || 0}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) + 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) + 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) + 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) - 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) - 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) + 1}`, () => { });
                        system.executeCommand(`/summon lightning_bolt ${(pos?.data.x || 0) - 1} ${(pos?.data.y || 0) + 0} ${(pos?.data.z || 0) - 1}`, () => { });
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

        const pos = system.getComponent(entity, MinecraftComponent.Position);

        const message = `You are here: ${JSON.stringify(pos?.data)}!`;
        system.executeCommand(`/tellraw ${name.data.name} ${JSON.stringify({ rawtext: [{ text: message }] })}`, () => { });
        return;
    }
});

// Network Hooking: Get login IP and XUID
import { netevent, PacketId, createPacket, sendPacket } from "bdsx";
const connectionList = new Map<NetworkIdentifier, string>();
const connectionList_reverse = new Map<string, NetworkIdentifier>();

// const players = [] as {}[];

netevent.after(PacketId.Login).on((ptr, networkIdentifier, packetId) => {
    const ip = networkIdentifier.getAddress();
    const [xuid, username] = netevent.readLoginPacket(ptr);
    console.log(`${username}> IP=${ip}, XUID=${xuid}`);
    if (username) {
        connectionList.set(networkIdentifier, username);
        connectionList_reverse.set(username, networkIdentifier);
    }

    // sendPacket
    setTimeout(() => {
        console.log('packet sended');

        // It uses C++ class packets. and they are not specified everywhere.
        const textPacket = createPacket(PacketId.Text);
        textPacket.setCxxString('[message packet from bdsx]', 0x50);
        sendPacket(networkIdentifier, textPacket);
        textPacket.dispose(); // need to delete it. or It will make memory lyrics
    }, 10000);
});

// Network Hooking: Print all packets
const tooLoudFilter = new Set([
    // PacketId.UpdateBlock,
    PacketId.ClientCacheBlobStatus,
    // PacketId.NetworkStackLatencyPacket,
    // PacketId.LevelChunk,
    // PacketId.ClientCacheMissResponse,
    // PacketId.MoveEntityDelta,
    // PacketId.SetEntityMotion,
    // PacketId.SetEntityData,
    // PacketId.NetworkChunkPublisherUpdate,
]);
for (let i = 2; i <= 136; i++) {
    if (tooLoudFilter.has(i)) continue;
    netevent.raw(i).on((ptr, size, networkIdentifier, packetId) => {
        console.assert(size !== 0, 'invalid packet size');
        //console.log('RECV ' + PacketId[packetId] + ': ' + ptr.readHex(Math.min(16, size)));
        const lines = [] as string[];
        let s = size;
        while (s > 0) {
            const hex = (ptr.readHex(Math.min(16, s)).trim() + [...new Array(Math.max(0, 16 - s))].map(x => ' __').join(''));
            const dec = (hex.split(' ').map(x => getDecimalValueFromHex(x)).join(''));
            const ascii = (hex.split(' ').map(x => getAsciiValueFromHex(x)).join(''));
            const asciiHex = (hex.split(' ').map(x => getAsciiHexValueFromHex(x)).join(''));
            lines.push(hex.replace(/__/g, '  ') + ' | ' + dec + ' | ' + ascii + ' | ' + asciiHex);
            s -= 16;
        }
        console.log('RECV ' + PacketId[packetId] + ': ', [size, ...lines]);
    });
    netevent.send(i).on((ptr, networkIdentifier, packetId) => {
        console.log('SEND ' + PacketId[packetId] + ': ' + ptr.readHex(16));
    });
}

const getDecimalValueFromHex = (x: string) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) { return '  ' + '  ' };
    return (byte + '').padStart(3, '_') + ' ';
}

const getAsciiValueFromHex = (x: string) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) { return ' ' };

    if (byte > 32 && byte < 127) {
        return String.fromCharCode(byte);
    }
    return String.fromCharCode((byte || 0) + 0x2200);
}

const getAsciiHexValueFromHex = (x: string) => {
    const byte = parseInt(x, 16);
    if (isNaN(byte)) { return '  ' };

    if (byte >= 65 && byte <= 90) {
        return ' ' + String.fromCharCode(byte);
    }
    if (byte >= 97 && byte <= 122) {
        return ' ' + String.fromCharCode(byte);
    }

    // return String.fromCharCode((byte || 0) + 0x2200);
    return x.trim().split('').map(x => parseInt(x, 16)).map(h => h < 10 ? String.fromCharCode(h + 0x2080) : String.fromCharCode(h + 0x24B6)).join('');
}

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
netevent.close.on(networkIdentifier => {
    const id = connectionList.get(networkIdentifier);
    connectionList.delete(networkIdentifier);
    console.log(`${id}> disconnected`);
});

// Call Native Functions
import { bin, NativeModule } from "bdsx";
const kernel32 = new NativeModule("Kernel32.dll");
const user32 = new NativeModule("User32.dll");
const GetConsoleWindow = kernel32.get("GetConsoleWindow")!;
const SetWindowText = user32.get("SetWindowTextW")!;
const wnd = GetConsoleWindow();
SetWindowText(wnd, "BDSX Window!!!");



// Parse raw packet
// referenced from https://github.com/pmmp/PocketMine-MP/blob/stable/src/pocketmine/network/mcpe/protocol/MovePlayerPacket.php
netevent.raw(PacketId.MovePlayer).on((ptr, size, ni) => {
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
    console.log(`move: ${bin.toString(runtimeId, 16)} ${x.toFixed(1)} ${y.toFixed(1)} ${z.toFixed(1)} ${pitch.toFixed(1)} ${yaw.toFixed(1)} ${headYaw.toFixed(1)} ${mode} ${onGround}`);
});
// referenced from https://github.com/pmmp/PocketMine-MP/blob/stable/src/pocketmine/network/mcpe/protocol/CraftingEventPacket.php
netevent.raw(PacketId.CraftingEvent).on((ptr, size, ni) => {
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
import { setOnErrorListener, NetworkIdentifier } from "bdsx";
import { eventNames } from "process";
import { sendExampleForm, sendExampleForm_Custom, sendExampleForm_Math, sendExampleForm_Modal } from "./tests/form-example";
import { sendModalForm, SimpleForm } from "./tests/formsapi";
console.log('\nerror handling>');
setOnErrorListener(err => {
    console.log('ERRMSG Example> ' + err.message);
    // return false; // Suppress default error outputs
});
console.log(eval("undefined_identifier")); // Make the error for this example
