"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bdsx_1 = require("bdsx");
const netevent_1 = require("bdsx/netevent");
async function testWithModule(moduleName, cb, ...skipprefix) {
    console.log(`[test] ${moduleName} module`);
    try {
        await cb(require(moduleName));
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
}
(async () => {
    await new Promise(resolve => setTimeout(resolve, 10)); // run after examples
    console.log('[test] JS Engine: ' + process['jsEngine']);
    console.log(`[test] node: ${process.versions.node}`);
    console.log(`[test] chakracore: ${process.versions.chakracore}`);
    console.log('[test] begin');
    console.log('[test] nextick');
    let nextTickPassed = false;
    nextTickPassed = await Promise.race([
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
        await bdsx_1.fs.writeFile(fileiopath, 'test');
    }
    catch (err) {
        console.error(`[test] ${fileiopath}: File writing failed: ${err.message}`);
        console.error('[test] Is permission granted?');
    }
    try {
        console.assert(await bdsx_1.fs.readFile(fileiopath) === 'test', 'file reading failed');
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
        await mariadb.execute('create table test(a int)');
        await mariadb.execute('insert into test values(1)');
        const v = await mariadb.execute('select * from test');
        await mariadb.execute('drop table test');
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
        await testWithModule('mariadb', async (db) => {
            const pool = db.createPool({ user: 'test', password: '1234', database: 'test', acquireTimeout: 1000, connectTimeout: 1000 });
            try {
                const conn = await pool.getConnection();
                try {
                    await conn.query('create table test(a int)');
                    await conn.query('insert into test values(1)');
                    const v = await conn.query('select * from test');
                    await conn.query('drop table test');
                    console.assert(v[0].a === 1, '[test] mariadb: select 1 failed');
                }
                finally {
                    conn.end();
                }
            }
            finally {
                pool.end();
            }
        }, '(conn=-1, no: 45012, SQLState: 08S01) Connection timeout: failed to create socket after ', 'retrieve connection from pool timeout after');
    }
    await testWithModule('discord.js', async (Discord) => {
        const client = new Discord.Client();
        let token;
        try {
            token = await bdsx_1.fs.readFile(__dirname + '\\discord.bot.token.txt');
        }
        catch (err) {
            console.log('[test] discord.js: no token for testing, skipped');
            return;
        }
        await new Promise((resolve, reject) => {
            client.on('ready', () => {
                if (client.user.tag === '루아ai#8755')
                    resolve();
                else
                    reject(Error('[test] who are you?'));
                client.destroy();
            });
            client.login(token);
        });
    });
    // native.forceRuntimeError();
    console.log('[test] done');
})().catch(console.error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQkFBb0k7QUFDcEksNENBQXNDO0FBRXRDLEtBQUssVUFBVSxjQUFjLENBQ3pCLFVBQWlCLEVBQ2pCLEVBQThCLEVBQzlCLEdBQUcsVUFBbUI7SUFFdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsU0FBUyxDQUFDLENBQUM7SUFDM0MsSUFDQTtRQUNJLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0tBQ2pDO0lBQ0QsT0FBTyxHQUFHLEVBQ1Y7UUFDSSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUN0QjtZQUNJLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEdBQUMsRUFBRSxDQUFDO1lBQzNCLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQ3JDO2dCQUNJLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFDMUI7b0JBQ0ksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsV0FBVyxDQUFDLENBQUM7b0JBQzdDLE9BQU87aUJBQ1Y7YUFDSjtZQUNELElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsRUFDL0M7Z0JBQ0ksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsV0FBVyxDQUFDLENBQUM7YUFDaEQ7aUJBRUQ7Z0JBQ0ksT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLFVBQVUsVUFBVSxDQUFDLENBQUM7Z0JBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQzthQUNuQztTQUNKO2FBRUQ7WUFDSSxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsVUFBVSxVQUFVLENBQUMsQ0FBQztZQUM5QyxPQUFPLENB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