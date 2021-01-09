import path from 'path';
import { startPacketLogger } from "./tools/packetLogger";
import { command, chat, CANCEL, netevent, NetworkIdentifier, PacketId, createPacket, sendPacket } from 'bdsx';
import { createCommandsApi } from "./tools/commandsApi";
import { createFormsApi } from "./tools/formsApi";
import { sendFormExample_simple, sendFormExample_modal, sendFormExample_custom } from "./tools/formsApi.tests";
import { mathGame } from "./games/mathGame";
import { connectionsApi } from "./tools/playerConnections";
import { start } from "repl";
import { testRandomDistribution } from "./utils/random";
import { createGameConsequences } from "./games/gameConsequences";
import { createFileWriterService } from "./utils/fileWriter";
import { checkerBoardBedrock, performanceTestFill, testFillSinCurve, testFillSinCurve_vertical } from './testing/performanceTests';

const system = server.registerSystem(0, 0);
const commandsApi = createCommandsApi(system);
const formsApi = createFormsApi();

startPacketLogger();
connectionsApi.startConnectionTracking();

// Command Handler
command.net.on((ev) => {

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

    if (ev.command.toLowerCase().startsWith('/form modal')) {
        (async () => {
            await sendFormExample_modal(formsApi, commandsApi, ev.networkIdentifier, playerName);
        })();
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/form simple')) {
        (async () => {
            await sendFormExample_simple(formsApi, commandsApi, ev.networkIdentifier, playerName);
        })();
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/form custom')) {
        (async () => {
            await sendFormExample_custom(formsApi, commandsApi, ev.networkIdentifier, playerName);
        })();
        return CANCEL;
    }

    if (ev.command.toLowerCase().startsWith('/test random')) {
        // Test random distribution
        testRandomDistribution();
        return CANCEL;
    }

    if (ev.command.toLowerCase().startsWith('/math test')) {
        (async () => {
            await mathGame.test_sendMathFormWithResult(formsApi, commandsApi, { networkIdentifier: ev.networkIdentifier, playerName, entity }, gameConsequences);
        })();
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/math start')) {
        startMathGame();
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/math stop')) {
        mathGame.stopMathGame();
        return CANCEL;
    }

    if (ev.command.toLowerCase().startsWith('/test fill chunks')) {

        const commadExample = `/test fill chunks [chunkWidth] [blockName]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);
        const blockName = parts[4];

        if (!chunkWidth || !blockName) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}' or blockName '${blockName}'. Example: ${commadExample}`);
            return CANCEL;
        }

        performanceTestFill({
            executeCommand: x => system.executeCommand(x, () => { }),
        }, chunkWidth, blockName);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test fill checkerboard')) {
        const commadExample = `/test fill checkerboard [chunkWidth]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);

        if (!chunkWidth) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}'. Example: ${commadExample}`);
            return CANCEL;
        }

        checkerBoardBedrock({
            executeCommand: x => system.executeCommand(x, () => { }),
        }, chunkWidth);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test fill animate')) {
        const commadExample = `/test fill checkerboard [chunkWidth]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);

        if (!chunkWidth) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}'. Example: ${commadExample}`);
            return CANCEL;
        }

        let i = 0;
        clearInterval(animateIntervalId);
        animateIntervalId = setInterval(() => {
            if (i > 100) {
                clearInterval(animateIntervalId);
                return;
            }

            testFillSinCurve_vertical({
                executeCommand: x => system.executeCommand(x, () => { }),
            }, chunkWidth, i / 10 * 2 * Math.PI);
            i++;
        }, 250);
        return CANCEL;
    }
});

let animateIntervalId = setInterval(() => { }, 1000);
clearInterval(animateIntervalId);

// console.log('process.execPath', process.execPath);
const fileWriterService = createFileWriterService(path.join(path.dirname(process.execPath), '_data'));
const gameConsequences = createGameConsequences(system);
const startMathGame = () => {
    console.log('startMathGame');
    mathGame.startMathGame(formsApi, commandsApi, gameConsequences, {
        intervalTimeMs: 20 * 1000,
        players: connectionsApi.getPlayerConnections(),
        fileWriterService,
    });
};
// startMathGame();

connectionsApi.onPlayersChange(({ action }) => {
    // if (action === 'dropped') { return; }

    // Restart math game if running and new player joined
    console.log('Restart math game if running');
    if (mathGame.isRunning()) {
        startMathGame();
    }
});

command.hook.on((command) => {
    // Make sure math game is shutdown
    if (command === '/stop') {
        mathGame.stopMathGame();
    }
});


// // Chat Handler
// chat.on(ev => {

//     const actor = ev.networkIdentifier.getActor();
//     if (!actor) {
//         console.warn(`missing actor`);
//         return;
//     }

//     const isPlayer = actor.isPlayer();
//     const entity = actor.getEntity();
//     if (!entity || !isPlayer) {
//         console.warn(`missing entity or not player`);
//         return;
//     }

//     const name = system.getComponent(entity, MinecraftComponent.Nameable);
//     if (!name) {
//         console.warn(`missing name`);
//         return;
//     }
//     const playerName = name.data.name;

//     if (ev.message.toLowerCase().startsWith('form modal')) {

//         // TODO: Force Close Chat, so timeout is not needed here
//         commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

//         setTimeout(async () => {
//             await sendFormExample_modal(formsApi, ev.networkIdentifier, playerName, commandsApi);
//         }, 3000);
//         return;
//     }
//     if (ev.message.toLowerCase().startsWith('form simple')) {

//         // TODO: Force Close Chat, so timeout is not needed here
//         commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

//         setTimeout(async () => {
//             await sendFormExample_simple(formsApi, ev.networkIdentifier, playerName, commandsApi);
//         }, 3000);

//         return;
//     }
//     if (ev.message.toLowerCase().startsWith('form custom')) {

//         // TODO: Force Close Chat, so timeout is not needed here
//         commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

//         setTimeout(async () => {
//             await sendFormExample_custom(formsApi, ev.networkIdentifier, playerName, commandsApi);
//         }, 3000);

//         return;
//     }
// });
