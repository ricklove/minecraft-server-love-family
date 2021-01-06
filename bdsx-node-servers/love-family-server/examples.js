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
    ev.setMessage(ev.message.toUpperCase() + " YEY!");
});
// Network Hooking: Get login IP and XUID
const bdsx_4 = require("bdsx");
const connectionList = new Map();
bdsx_4.netevent.after(bdsx_4.PacketId.Login).on((ptr, networkIdentifier, packetId) => {
    const ip = networkIdentifier.getAddress();
    const [xuid, username] = bdsx_4.netevent.readLoginPacket(ptr);
    console.log(`${username}> IP=${ip}, XUID=${xuid}`);
    if (username)
        connectionList.set(networkIdentifier, username);
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
    bdsx_4.PacketId.UpdateBlock,
    bdsx_4.PacketId.ClientCacheBlobStatus,
    bdsx_4.PacketId.NetworkStackLatencyPacket,
    bdsx_4.PacketId.LevelChunk,
    bdsx_4.PacketId.ClientCacheMissResponse,
    bdsx_4.PacketId.MoveEntityDelta,
    bdsx_4.PacketId.SetEntityMotion,
    bdsx_4.PacketId.SetEntityData,
    bdsx_4.PacketId.NetworkChunkPublisherUpdate,
]);
for (let i = 2; i <= 136; i++) {
    if (tooLoudFilter.has(i))
        continue;
    bdsx_4.netevent.raw(i).on((ptr, size, networkIdentifier, packetId) => {
        console.assert(size !== 0, 'invalid packet size');
        console.log('RECV ' + bdsx_4.PacketId[packetId] + ': ' + ptr.readHex(Math.min(16, size)));
    });
    bdsx_4.netevent.send(i).on((ptr, networkIdentifier, packetId) => {
        console.log('SEND ' + bdsx_4.PacketId[packetId] + ': ' + ptr.readHex(16));
    });
}
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
console.log('\nerror handling>');
bdsx_6.setOnErrorListener(err => {
    console.log('ERRMSG Example> ' + err.message);
    // return false; // Suppress default error outputs
});
console.log(eval("undefined_identifier")); // Make the error for this example
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJleGFtcGxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsMERBQTBEOztBQUUxRCxpQkFBaUI7QUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRTFDLGVBQWU7QUFDZiwrQkFBNkI7QUFDN0Isd0NBQXVEO0FBQ3ZELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sQ0FBQyxjQUFjLGlEQUEyQyxFQUFFLENBQUMsRUFBRTtJQUNqRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRWhFLHFDQUFxQztJQUNyQyxNQUFNLEtBQUssR0FBRyxZQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLEVBQ1Q7UUFDSSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixHQUFHLG9CQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLG9CQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUV0QyxJQUFJLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFDcEI7WUFDSSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUM5QztLQUNKO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxpQkFB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