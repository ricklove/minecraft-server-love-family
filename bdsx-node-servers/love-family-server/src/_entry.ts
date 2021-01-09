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
import { testFillcheckerBoard, performanceTestFill, testFillSinCurve, testFillSinCurve_vertical, testFillSinCurve_verticalThin } from './testing/performanceTests';
import { graphSinCurve } from './graphing/graph';
import { runBubbleSort } from './sorting/bubbleSort';
import { runBubbleSort2 } from './sorting/bubbleSort2';
import { calculateMapPosition } from './graphing/map';

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

        const commandExample = `/test fill chunks [chunkWidth] [blockName]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);
        const blockName = parts[4];

        if (!chunkWidth || !blockName) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}' or blockName '${blockName}'. Example: ${commandExample}`);
            return CANCEL;
        }

        performanceTestFill({
            executeCommand: x => system.executeCommand(x, () => { }),
        }, chunkWidth, blockName);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test fill checkerboard')) {
        const commandExample = `/test fill checkerboard [chunkWidth]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);

        if (!chunkWidth) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}'. Example: ${commandExample}`);
            return CANCEL;
        }

        testFillcheckerBoard({
            executeCommand: x => system.executeCommand(x, () => { }),
        }, chunkWidth);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test fill animate')) {
        const commandExample = `/test fill checkerboard [chunkWidth] [blockName]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const chunkWidth = parseInt(parts[3]);
        const blockName = parts[4];

        if (!chunkWidth || !blockName) {
            commandsApi.sendMessage(playerName, `Missing width '${chunkWidth}' or blockName '${blockName}'. Example: ${commandExample}`);
            return CANCEL;
        }


        let i = 0;
        const animateIntervalId = setInterval(() => {
            if (i > 100) {
                clearInterval(animateIntervalId);
                return;
            }

            //testFillSinCurve_verticalThin({
            testFillSinCurve({
                executeCommand: x => system.executeCommand(x, () => { }),
            }, chunkWidth, i / 10 * 2 * Math.PI, blockName);
            i++;
        }, 250);

        setActiveAnimation({ stop: () => clearInterval(animateIntervalId) });

        return CANCEL;
    }

    if (ev.command.toLowerCase().startsWith('/test map fill')) {
        const commandExample = `/test map fill [blockName]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const blockName = parts[3];

        if (!blockName) {
            commandsApi.sendMessage(playerName, `Missing blockName '${blockName}'. Example: ${commandExample}`);
            return CANCEL;
        }

        const playerPosition = system.getComponent(entity, MinecraftComponent.Position);
        if (!playerPosition) {
            console.warn(`missing playerPosition`);
            return CANCEL;
        }

        const pos = playerPosition.data;
        const mapPosition = calculateMapPosition({ ...pos, y: pos.y - 1 });
        const { topLeft: tl, bottomRight: br } = mapPosition;

        system.executeCommand(`/fill ${tl.x} ${tl.y} ${tl.z} ${br.x} ${br.y} ${br.z} ${blockName}`, () => { });
        return CANCEL;
    }

    if (ev.command.toLowerCase().startsWith('/test graph')) {
        const commandExample = `/test graph [chunkWidth]`;

        const parts = ev.command.split(' ').map(x => x.trim()).filter(x => x);
        const blockName = parts[2];

        if (!blockName) {
            commandsApi.sendMessage(playerName, `Missing blockName '${blockName}'. Example: ${commandExample}`);
            return CANCEL;
        }

        graphSinCurve({
            executeCommand: x => system.executeCommand(x, () => { }),
        }, blockName);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test sort bubble1')) {
        const animation = runBubbleSort({
            executeCommand: x => system.executeCommand(x, () => { }),
        });
        setActiveAnimation(animation);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test sort bubble2')) {
        const animation = runBubbleSort2({
            executeCommand: x => system.executeCommand(x, () => { }),
        });
        setActiveAnimation(animation);
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test stop')) {
        stopActiveAnimation();
        return CANCEL;
    }
    if (ev.command.toLowerCase().startsWith('/test continue')) {
        continueActiveAnimation();
        return CANCEL;
    }
});

let activeAnimation = null as null | ({ stop: () => void, continue?: () => void });
const setActiveAnimation = (animation: { stop: () => void, continue?: () => void }) => {
    stopActiveAnimation();
    activeAnimation = animation;
};
const stopActiveAnimation = () => {
    activeAnimation?.stop();
};
const continueActiveAnimation = () => {
    activeAnimation?.continue?.();
};

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
    if (command === '/stop') {
        // Stop everything
        stopActiveAnimation();

        // Make sure math game is shutdown
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
