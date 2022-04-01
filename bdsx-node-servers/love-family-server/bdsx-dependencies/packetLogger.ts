import { nethook } from "bdsx/nethook";
import { MinecraftPacketIds as PacketId } from "bdsx/bds/packetids";
import { hex } from "bdsx/util";

// Network Hooking: Print all packets
const tooLoudFilter = new Set([
    PacketId.ClientCacheBlobStatus,
    PacketId.UpdateBlock,
    // PacketId.NetworkStackLatencyPacket,
    PacketId.LevelChunk,
    PacketId.ClientCacheMissResponse,
    // PacketId.MoveEntityDelta,
    // PacketId.SetEntityMotion,
    // PacketId.SetEntityData,
    PacketId.NetworkChunkPublisherUpdate,
]);

export const startPacketLogger = () => {
    // for (let i = 2; i <= 136; i++) {
    //     if (tooLoudFilter.has(i)) continue;
    //     nethook.raw(i).on((ptr, size, networkIdentifier, packetId) => {
    //         console.assert(size !== 0, 'invalid packet size');
    //         //console.log('RECV ' + PacketId[packetId] + ': ' + ptr.readHex(Math.min(16, size)));
    //         const lines = [] as string[];
    //         let s = size;
    //         while (s > 0) {
    //             const h = hex(ptr.readBuffer(Math.min(16, s)).trim() + [...new Array(Math.max(0, 16 - s))].map(x => ' __').join(''));
    //             const dec = (h.split(' ').map(x => getDecimalValueFromHex(x)).join(''));
    //             const ascii = (h.split(' ').map(x => getAsciiValueFromHex(x)).join(''));
    //             const asciiHex = (h.split(' ').map(x => getAsciiHexValueFromHex(x)).join(''));
    //             lines.push(h.replace(/__/g, '  ') + ' | ' + dec + ' | ' + ascii + ' | ' + asciiHex);
    //             s -= 16;
    //         }
    //         console.log('RECV ' + PacketId[packetId] + ': ', [size, ...lines]);
    //     });
    //     nethook.send(i).on((ptr, networkIdentifier, packetId) => {
    //         console.log('SEND ' + PacketId[packetId] + ': ' + ptr.readHex(16));
    //     });
    // }
};

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