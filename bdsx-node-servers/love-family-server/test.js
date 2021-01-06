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
const bdsx_1 = require("bdsx");
const netevent_1 = require("bdsx/netevent");
function testWithModule(moduleName, cb, ...skipprefix) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[test] ${moduleName} module`);
        try {
            yield cb(require(moduleName));
        }
        catch (err) {
            if (err && err.message) {
                const msg = err.message + '';
                for (const [prefix, cb] of skipprefix) {
                    if (msg.startsWith(prefix)) {
                        console.log(`[test] ${moduleName}: skipped`);
                        return;
                    }
                }
                if (err && msg.startsWith('Cannot find module')) {
                    console.log(`[test] ${moduleName}: skipped`);
                }
                else {
                    console.error(`[test] ${moduleName}: failed`);
                    console.error(err.stack || msg);
                }
            }
            else {
                console.error(`[test] ${moduleName}: failed`);
                console.error(err);
            }
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise(resolve => setTimeout(resolve, 10)); // run after examples
    console.log('[test] JS Engine: ' + process['jsEngine']);
    console.log(`[test] node: ${process.versions.node}`);
    console.log(`[test] chakracore: ${process.versions.chakracore}`);
    console.log('[test] begin');
    console.log('[test] nextick');
    let nextTickPassed = false;
    nextTickPassed = yield Promise.race([
        new Promise(resolve => process.nextTick(() => resolve(true))),
        new Promise(resolve => setTimeout(() => {
            if (nextTickPassed)
                return;
            console.error(Error('[test] nexttick failed // I will fix it later').stack);
            resolve(false);
        }, 1000))
    ]);
    console.log('[test] net hook');
    let idcheck = 0;
    for (let i = 0; i < 255; i++) {
        bdsx_1.netevent.raw(i).on((ptr, size, ni, packetId) => {
            idcheck = packetId;
            console.assert(packetId === ptr.readUint8(), '[test] different packetId in buffer');
        });
        bdsx_1.netevent.after(i).on((ptr, ni, packetId) => {
            console.assert(packetId === idcheck, '[test] different packetId');
        });
        bdsx_1.netevent.before(i).on((ptr, ni, packetId) => {
            console.assert(packetId === idcheck, '[test] different packetId');
        });
    }
    const conns = new Set();
    bdsx_1.netevent.after(bdsx_1.PacketId.Login).on((ptr, ni) => {
        console.assert(!conns.has(ni), '[test] logined without connected');
        conns.add(ni);
    });
    netevent_1.close.on(ni => {
        console.assert(conns.delete(ni), '[test] disconnected without connected');
    });
    console.log('[test] bin');
    // bin
    {
        console.assert(bdsx_1.bin.fromNumber(1) === bdsx_1.bin.ONE, '[test] bin.fromNumber(1) failed');
        console.assert(bdsx_1.bin.fromNumber(0) === bdsx_1.bin.ZERO, '[test] bin.fromNumber(0) failed');
        console.assert(bdsx_1.bin.fromNumber(-1) === bdsx_1.bin.ZERO, '[test] bin.fromNumber(-1) failed');
        const small = bdsx_1.bin.fromNumber(0x100);
        console.assert(small === '\u0100', '[test] bin.fromNumber(0x100) failed');
        const big = bdsx_1.bin.fromNumber(0x10002);
        console.assert(big === '\u0002\u0001', '[test] bin.fromNumber(0x10002) failed');
        console.assert(bdsx_1.bin.sub(big, small) === '\uff02', '[test] bin.sub() failed');
        const big2 = bdsx_1.bin.add(big, bdsx_1.bin.add(big, small));
        console.assert(big2 === '\u0104\u0002', '[test] bin.add() failed');
        const bigbig = bdsx_1.bin.add(bdsx_1.bin.add(bdsx_1.bin.muln(big2, 0x100000000), small), bdsx_1.bin.ONE);
        console.assert(bigbig === '\u0101\u0000\u0104\u0002', '[test] bin.muln() failed');
        const dived = bdsx_1.bin.divn(bigbig, 2);
        console.assert(dived[0] === '\u0080\u0000\u0082\u0001', '[test] bin.divn() failed');
        console.assert(dived[1] === 1, '[test] bin.divn() failed');
        console.assert(bdsx_1.bin.toString(dived[0], 16) === '1008200000080', '[test] bin.toString() failed');
        try {
            const ptr = bdsx_1.native.malloc(10);
            try {
                const bignum = bdsx_1.bin.fromNumber(123456789012345);
                ptr.clone().writeVarBin(bignum);
                console.assert(ptr.clone().readVarBin() === bignum, '[test] writevarbin / readvarbin failed');
            }
            finally {
                bdsx_1.native.free(ptr);
            }
        }
        catch (err) {
            console.error(err.stack);
        }
    }
    // deprecated!! but for testing
    console.log('[test] bdsx fs');
    const fileiopath = __dirname + '\\test.txt';
    try {
        yield bdsx_1.fs.writeFile(fileiopath, 'test');
    }
    catch (err) {
        console.error(`[test] ${fileiopath}: File writing failed: ${err.message}`);
        console.error('[test] Is permission granted?');
    }
    try {
        console.assert((yield bdsx_1.fs.readFile(fileiopath)) === 'test', 'file reading failed');
    }
    catch (err) {
        console.error(`[test] ${fileiopath}: File reading failed`);
        console.error(err.stack);
    }
    try {
        console.assert(bdsx_1.fs.deleteFileSync(fileiopath), '[test] file deleting failed');
    }
    catch (err) {
        console.error(`[test] ${fileiopath}: File deleting failed`);
        console.error(err.stack);
    }
    console.log('[test] command hook');
    bdsx_1.command.hook.on((cmd, origin) => {
        console.log({ cmd, origin });
        if (cmd === '/test') {
            console.log('> tested');
            return 0;
        }
    });
    bdsx_1.command.net.on((ev) => {
        console.log('[test] cmd/net: ' + ev.command);
    });
    console.log('[test] bdsx mariadb');
    try {
        const mariadb = new bdsx_1.MariaDB('localhost', 'test', '1234', 'test');
        yield mariadb.execute('create table test(a int)');
        yield mariadb.execute('insert into test values(1)');
        const v = yield mariadb.execute('select * from test');
        yield mariadb.execute('drop table test');
        console.assert(v[0][0] === '1', '[test] bdsx mariadb: select 1 failed');
    }
    catch (err) {
        const msg = (err.message) + '';
        if (msg.startsWith("Can't connect to MySQL server on ") ||
            msg.startsWith('Access denied for user ')) {
            console.log("[test] bdsx mariadb: skipped");
        }
        else {
            console.error(`[test] bdsx mariadb: failed`);
            console.error(err.stack);
        }
    }
    // npm module check
    if (nextTickPassed) {
        yield testWithModule('mariadb', (db) => __awaiter(void 0, void 0, void 0, function* () {
            const pool = db.createPool({ user: 'test', password: '1234', database: 'test', acquireTimeout: 1000, connectTimeout: 1000 });
            try {
                const conn = yield pool.getConnection();
                try {
                    yield conn.query('create table test(a int)');
                    yield conn.query('insert into test values(1)');
                    const v = yield conn.query('select * from test');
                    yield conn.query('drop table test');
                    console.assert(v[0].a === 1, '[test] mariadb: select 1 failed');
                }
                finally {
                    conn.end();
                }
            }
            finally {
                pool.end();
            }
        }), '(conn=-1, no: 45012, SQLState: 08S01) Connection timeout: failed to create socket after ', 'retrieve connection from pool timeout after');
    }
    yield testWithModule('discord.js', (Discord) => __awaiter(void 0, void 0, void 0, function* () {
        const client = new Discord.Client();
        let token;
        try {
            token = yield bdsx_1.fs.readFile(__dirname + '\\discord.bot.token.txt');
        }
        catch (err) {
            console.log('[test] discord.js: no token for testing, skipped');
            return;
        }
        yield new Promise((resolve, reject) => {
            client.on('ready', () => {
                if (client.user.tag === '루아ai#8755')
                    resolve();
                else
                    reject(Error('[test] who are you?'));
                client.destroy();
            });
            client.login(token);
        });
    }));
    // native.forceRuntimeError();
    console.log('[test] done');
}))().catch(console.error);
let connectedNi;
let counter = 0;
bdsx_1.chat.on(ev => {
    if (ev.message == "t") {
        console.assert(connectedNi === ev.networkIdentifier, 'the network identifier does not matched');
        counter++;
        console.log(`test: ${counter}/5`);
        if (counter >= 5) {
            console.log('> tested and stopping...');
            setTimeout(() => bdsx_1.serverControl.stop(), 1000);
        }
        return bdsx_1.CANCEL;
    }
});
bdsx_1.netevent.raw(bdsx_1.PacketId.Login).on((ptr, size, ni) => {
    connectedNi = ni;
});
const system = server.registerSystem(0, 0);
system.listenForEvent("minecraft:entity_created" /* EntityCreated */, ev => {
    try {
        const uniqueId = ev.data.entity.__unique_id__;
        const actor2 = bdsx_1.Actor.fromUniqueId(uniqueId["64bit_low"], uniqueId["64bit_high"]);
        const actor = bdsx_1.Actor.fromEntity(ev.data.entity);
        console.assert(actor === actor2, 'Actor.fromEntity is not matched');
        if (actor !== null) {
            const actualId = actor.getUniqueIdLow() + ':' + actor.getUniqueIdHigh();
            const expectedId = uniqueId["64bit_low"] + ':' + uniqueId["64bit_high"];
            console.assert(actualId === expectedId, `Actor uniqueId is not matched (actual=${actualId}, expected=${expectedId})`);
            if (ev.__identifier__ === 'minecraft:player') {
                counter = 0;
                console.assert(actor.getTypeId() == 0x13f, 'player type is not matched');
                console.assert(actor.isPlayer(), 'a player is not the player');
                console.assert(connectedNi === actor.getNetworkIdentifier(), 'the network identifier does not matched');
            }
            else {
                console.assert(!actor.isPlayer(), `a not player is the player(identifier:${ev.__identifier__})`);
            }
        }
    }
    catch (err) {
        console.error(err.stack);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQSwrQkFBb0k7QUFDcEksNENBQXNDO0FBRXRDLFNBQWUsY0FBYyxDQUN6QixVQUFpQixFQUNqQixFQUE4QixFQUM5QixHQUFHLFVBQW1COztRQUV0QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsVUFBVSxTQUFTLENBQUMsQ0FBQztRQUMzQyxJQUNBO1lBQ0ksTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLEdBQUcsRUFDVjtZQUNJLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQ3RCO2dCQUNJLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEdBQUMsRUFBRSxDQUFDO2dCQUMzQixLQUFLLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksVUFBVSxFQUNyQztvQkFDSSxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQzFCO3dCQUNJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxVQUFVLFdBQVcsQ0FBQyxDQUFDO3dCQUM3QyxPQUFPO3FCQUNWO2lCQUNKO2dCQUNELElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsRUFDL0M7b0JBQ0ksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsV0FBVyxDQUFDLENBQUM7aUJBQ2hEO3FCQUVEO29CQUNJLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxVQUFVLFVBQVUsQ0FBQyxDQUFDO29CQUM5QyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLENBQUM7aUJBQ25DO2FBQ0o7aUJBRUQ7Z0JBQ0ksT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLFVBQVUsVUFBVSxDQUFDLENBQUM7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