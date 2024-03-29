import path from 'path';
import { createCommandsApi } from "./tools/commandsApi";
import { sendFormExample_simple, sendFormExample_modal, sendFormExample_custom } from "./tools/formsApi.tests";
import { playerDataFileName, studyGame } from "./games/studyGame";
import { testRandomDistribution } from "./utils/random";
import { createGameConsequences } from "./games/gameConsequences";
import { createFileWriterService } from "./utils/fileWriter";
import { testFillcheckerBoard, performanceTestFill, testFillSinCurve, testFillSinCurve_vertical, testFillSinCurve_verticalThin } from './testing/performanceTests';
import { graphSinCurve } from './graphing/graph';
import { runBubbleSort } from './sorting/bubbleSort';
import { runBubbleSort2 } from './sorting/bubbleSort2';
import { calculateMapPosition } from './graphing/map';
import { showEntityDiffReport, showEntityPositionReport } from './tools/findMobs';
import { test_graphProgressReport } from './games/progressReport';
import { loadAtRuntime } from './testing/dynamicScripting';
import clearModule from 'clear-module';
import { createBlockService } from './structures/blockService';
import { ServicesType } from './tools/services';

export const setup = (services: ServicesType) => {

    const system = server.registerSystem(0, 0);
    const commandsApi = createCommandsApi(system);
    const formsApi = services.formsService;
    const connectionsApi = services.connectionsService;
    connectionsApi.startConnectionTracking();

    const CANCEL = 0;

    // Command Handler
    services.commandService.onPlayerCommand(({ command: cmd, networkIdentifier }) => {

        const actor = networkIdentifier.getActor();
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
        console.log(`onPlayerCommand`, { playerName, cmd });

        if (cmd.toLowerCase().startsWith('/form modal')) {
            (async () => {
                await sendFormExample_modal(formsApi, commandsApi, networkIdentifier, playerName);
            })();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/form simple')) {
            (async () => {
                await sendFormExample_simple(formsApi, commandsApi, networkIdentifier, playerName);
            })();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/form custom')) {
            (async () => {
                await sendFormExample_custom(formsApi, commandsApi, networkIdentifier, playerName);
            })();
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test random')) {
            // Test random distribution
            testRandomDistribution();
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/study test')) {
            (async () => {
                await studyGame.test_sendStudyFormWithResult(formsApi, commandsApi, { networkIdentifier: networkIdentifier, playerName, entity }, gameConsequences);
            })();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/study start')) {
            startStudyGame();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/study stop')) {
            studyGame.stopStudyGame();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/study change')) {
            studyGame.resetSubjects(playerName);
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test fill chunks')) {

            const commandExample = `/test fill chunks [chunkWidth] [blockName]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
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
        if (cmd.toLowerCase().startsWith('/test fill checkerboard')) {
            const commandExample = `/test fill checkerboard [chunkWidth]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
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
        if (cmd.toLowerCase().startsWith('/test fill animate')) {
            const commandExample = `/test fill checkerboard [chunkWidth] [blockName]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
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

        if (cmd.toLowerCase().startsWith('/test map fill')) {
            const commandExample = `/test map fill [blockName]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
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

        if (cmd.toLowerCase().startsWith('/test map animate')) {
            const commandExample = `/test map animate [frameCount]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
            const frameCount = parseInt(parts[3]) ?? 10;

            const playerPosition = system.getComponent(entity, MinecraftComponent.Position);
            if (!playerPosition) {
                console.warn(`missing playerPosition`);
                return CANCEL;
            }

            const pos = playerPosition.data;
            const mapPosition = calculateMapPosition({ ...pos, y: pos.y - 1 });
            const { topLeft: tl, bottomRight: br } = mapPosition;

            let i = 0;
            const animateIntervalId = setInterval(() => {
                if (i >= frameCount) {
                    clearInterval(animateIntervalId);
                    return;
                }

                system.executeCommand(`/fill ${tl.x} ${tl.y} ${tl.z} ${br.x} ${br.y} ${br.z} ${'glass'}`, () => { });

                for (let x = tl.x; x <= br.x; x++) {
                    for (let z = tl.z; z <= br.z; z++) {
                        const p = { x, y: tl.y, z };

                        if ((x + z + i) % 1 !== 0) { continue; }

                        const blockName = (x + z + i) % 3 == 0 ? 'snow'
                            : (x + z + i) % 3 == 1 ? 'gold_block'
                                : 'dirt';
                        system.executeCommand(`/setblock ${p.x} ${p.y} ${p.z} ${blockName}`, () => { });
                    }
                }

                i++;
            }, 250);

            setActiveAnimation({ stop: () => clearInterval(animateIntervalId) });

            // system.executeCommand(`/fill ${tl.x} ${tl.y} ${tl.z} ${br.x} ${br.y} ${br.z} ${blockName}`, () => { });
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test graph')) {
            const commandExample = `/test graph [chunkWidth]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
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
        if (cmd.toLowerCase().startsWith('/test sort bubble1')) {
            const animation = runBubbleSort({
                executeCommand: x => system.executeCommand(x, () => { }),
            });
            setActiveAnimation(animation);
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/test sort bubble2')) {
            const animation = runBubbleSort2({
                executeCommand: x => system.executeCommand(x, () => { }),
            });
            setActiveAnimation(animation);
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test progress')) {

            const playerPosition = system.getComponent(entity, MinecraftComponent.Position);
            if (!playerPosition) {
                console.warn(`missing playerPosition`);
                return CANCEL;
            }

            const pos = playerPosition.data;

            const filePath = fileWriterService.getPlayerFilePath(playerName, playerDataFileName);
            const animation = test_graphProgressReport({
                executeCommand: x => system.executeCommand(x, () => { }),
            }, { ...pos, y: pos.y - 2 }, filePath);
            //  setActiveAnimation(animation);
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test stop')) {
            stopActiveAnimation();
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/test continue')) {
            continueActiveAnimation();
            return CANCEL;
        }


        if (cmd.toLowerCase().startsWith('/report diff')) {
            showEntityDiffReport(system);
            return CANCEL;
        }
        if (cmd.toLowerCase().startsWith('/report')) {
            showEntityPositionReport(system);
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/test dynamic')) {
            loadAtRuntime();
            return CANCEL;
        }

        if (cmd.toLowerCase().startsWith('/generate')) {
            const commandExample = `/generate [structureName]`;

            const parts = cmd.split(' ').map(x => x.trim()).filter(x => x);
            const structureName = parts[1];

            if (!structureName) {
                commandsApi.sendMessage(playerName, `Missing structureName '${structureName}'. Example: ${commandExample}`);
                return CANCEL;
            }

            const playerPosition = system.getComponent(entity, MinecraftComponent.Position);
            if (!playerPosition) {
                console.warn(`missing playerPosition`);
                return CANCEL;
            }

            const pos = playerPosition.data;
            const blockService = createBlockService({ executeCommand: x => system.executeCommand(x, () => { }) });

            (async () => {
                clearModule('./structures/structures');
                const { generateStructure, structureNames } = await import('./structures/structures')
                const sName = structureName as typeof structureNames[0];
                if (!structureNames.includes(sName)) {
                    commandsApi.sendMessage(playerName, `Unknown structureName '${structureName}'. StructureNames: ${structureNames.join(',')}`);
                    return CANCEL;
                }

                generateStructure(blockService, sName, { origin: pos });
            })();

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
    const fileWriterService = createFileWriterService(path.join(path.dirname(process.execPath), '../../_data'));
    const gameConsequences = createGameConsequences(system);
    const startStudyGame = () => {
        console.log('startStudyGame');
        studyGame.startStudyGame(formsApi, commandsApi, gameConsequences, {
            intervalTimeMs: 20 * 1000,
            players: connectionsApi.getPlayerConnections(),
            fileWriterService,
        });
    };

    startStudyGame();

    connectionsApi.onPlayersChange(({ action }) => {
        // if (action === 'dropped') { return; }

        // Restart study game if running and new player joined
        console.log('Restart math game if running');
        if (studyGame.isRunning()) {
            startStudyGame();
        }
    });

    services.commandService.onServerCommand(({ command }) => {
        if (command === '/stop') {
            // Stop everything
            stopActiveAnimation();

            // Stop Form Timeout timers
            formsApi.stop();

            // Make sure study game is shutdown
            studyGame.stopStudyGame();
        }
    })


    // // Chat Handler
    // chat.on(ev => {

    //     const actor = networkIdentifier.getActor();
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
    //             await sendFormExample_modal(formsApi, networkIdentifier, playerName, commandsApi);
    //         }, 3000);
    //         return;
    //     }
    //     if (ev.message.toLowerCase().startsWith('form simple')) {

    //         // TODO: Force Close Chat, so timeout is not needed here
    //         commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

    //         setTimeout(async () => {
    //             await sendFormExample_simple(formsApi, networkIdentifier, playerName, commandsApi);
    //         }, 3000);

    //         return;
    //     }
    //     if (ev.message.toLowerCase().startsWith('form custom')) {

    //         // TODO: Force Close Chat, so timeout is not needed here
    //         commandsApi.sendMessage(playerName, 'Close the chat to get the form in 3 secs');

    //         setTimeout(async () => {
    //             await sendFormExample_custom(formsApi, networkIdentifier, playerName, commandsApi);
    //         }, 3000);

    //         return;
    //     }
    // });
};

// setup();