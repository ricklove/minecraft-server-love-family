import { X_OK } from "constants";
import { Vector3 } from "../utils/vector";
import { BlockCommandService } from "./blockService";
import { generatePattern_square, generatePattern_star } from "./patterns";

const structures = {
    clear: (commands: BlockCommandService, options: { origin: Vector3 }) => {

        const c = {
            x: Math.floor(options.origin.x),
            y: Math.floor(options.origin.y),
            z: Math.floor(options.origin.z),
        };

        for (let y = 0; y < 128; y++) {
            commands.fill({ x: c.x - 64, y: c.y + y, z: c.z - 64 }, { x: c.x + 64, y: c.y + y, z: c.z + 64 }, 'air');
        }

    },
    ironFarm: (commands: BlockCommandService, options: { origin: Vector3 }) => {

        const c = options.origin;
        generatePattern_star(commands, { center: { ...c, y: c.y + 22 }, radius: 12, blockName: 'iron_block' });
        generatePattern_star(commands, { center: { ...c, y: c.y + 25 }, radius: 12, blockName: 'iron_block' });
    },
    // mobFarm: (commands: BlockCommandService, options: { origin: Vector3 }) => {

    //     const c = {
    //         x: Math.floor(options.origin.x),
    //         y: Math.floor(options.origin.y),
    //         z: Math.floor(options.origin.z),
    //     };

    //     for (let y = 0; y < 64; y++) {
    //         commands.fill({ x: c.x - 32, y: c.y + y, z: c.z - 32 }, { x: c.x + 32, y: c.y + y, z: c.z + 32 }, 'air');
    //     }

    //     for (let y = 22; y < 64; y += 4) {
    //         generatePattern_star(commands, { center: { ...c, y: c.y + y - 2 }, radius: 23, blockName: 'stone' });
    //         generatePattern_star(commands, { center: { ...c, y: c.y + y - 2 }, radius: 15, blockName: 'air' });
    //         generatePattern_star(commands, { center: { ...c, y: c.y + y - 1 }, radius: 15, blockName: 'stone' });
    //         generatePattern_star(commands, { center: { ...c, y: c.y + y - 1 }, radius: 7, blockName: 'air' });
    //         generatePattern_star(commands, { center: { ...c, y: c.y + y + 0 }, radius: 7, blockName: 'stone' });
    //         commands.fill({ ...c, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 }, 'dispenser 0');
    //         commands.fill({ ...c, y: c.y + y + 1 }, { ...c, y: c.y + y + 1 }, 'observer 0');
    //     }

    // },
    mobFarmSquare: (commands: BlockCommandService, options: { origin: Vector3 }) => {

        const c = {
            x: Math.floor(options.origin.x),
            y: Math.floor(options.origin.y),
            z: Math.floor(options.origin.z) + 3,
        };

        for (let y = 0; y < 68; y++) {
            commands.fill({ x: c.x - 64, y: c.y + y, z: c.z - 64 }, { x: c.x + 64, y: c.y + y, z: c.z + 64 }, 'air');
        }

        // Kill box
        for (let y = 0; y < 22; y++) {
            generatePattern_square(commands, { center: { ...c, y: c.y + y }, radius: 2, blockName: 'glass' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y }, radius: 1, blockName: 'air' });
        }

        generatePattern_square(commands, { center: { ...c, y: c.y + 1 }, radius: 2, blockName: 'stone_slab' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 0 }, radius: 1, blockName: 'magma' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 1 }, radius: 1, blockName: 'air' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 2 }, radius: 1, blockName: 'air' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 3 }, radius: 1, blockName: 'air' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 4 }, radius: 1, blockName: 'air' });

        // Sun block
        generatePattern_square(commands, { center: { ...c, y: c.y + 67 }, radius: 26, blockName: 'stone_slab' });
        generatePattern_square(commands, { center: { ...c, y: c.y + 66 }, radius: 26, blockName: 'stone' });

        // Levels
        for (let y = 19; y < 64; y += 4) {
            // generatePattern_square(commands, { center: { ...c, y: c.y + y + 2 }, radius: 25, blockName: 'stone' });
            // generatePattern_square(commands, { center: { ...c, y: c.y + y + 2 }, radius: 17, blockName: 'air' });
            // generatePattern_square(commands, { center: { ...c, y: c.y + y + 1 }, radius: 17, blockName: 'stone' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y + 1 }, radius: 11, blockName: 'stone_slab' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y + 1 }, radius: 10, blockName: 'air' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y + 0 }, radius: 10, blockName: 'stone' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y + 0 }, radius: 1, blockName: 'air' });


            const createWaterDitch = (from: Vector3, to: Vector3) => {
                commands.fill(from, to, 'air');
                commands.setBlock(from, 'water');
                commands.fill({ ...from, y: from.y - 1 }, { ...to, y: to.y - 1 }, 'stone');
            };

            createWaterDitch({ x: c.x - 9, z: c.z + 1, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x - 9, z: c.z + 0, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x - 9, z: c.z - 1, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });

            createWaterDitch({ x: c.x + 9, z: c.z + 1, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x + 9, z: c.z + 0, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x + 9, z: c.z - 1, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });

            createWaterDitch({ x: c.x + 1, z: c.z - 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x + 0, z: c.z - 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x - 1, z: c.z - 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });

            createWaterDitch({ x: c.x + 1, z: c.z + 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x + 0, z: c.z + 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });
            createWaterDitch({ x: c.x - 1, z: c.z + 9, y: c.y + y + 0 }, { ...c, y: c.y + y + 0 });

            generatePattern_square(commands, { center: { ...c, y: c.y + y + 0 }, radius: 1, blockName: 'fence_gate 4' });
            generatePattern_square(commands, { center: { ...c, y: c.y + y - 1 }, radius: 1, blockName: 'air' });

            // commands.setBlock({ x: c.x + 8, z: c.z + 0, y: c.y + y + 1 }, 'water');
            // commands.setBlock({ x: c.x + 8, z: c.z + 0, y: c.y + y + 2 }, 'stone');
            // commands.setBlock({ x: c.x + 8, z: c.z + 0, y: c.y + y + 2 }, 'air');

            // commands.setBlock({ x: c.x + 0, z: c.z - 8, y: c.y + y + 1 }, 'water');
            // commands.setBlock({ x: c.x + 0, z: c.z - 8, y: c.y + y + 2 }, 'stone');
            // commands.setBlock({ x: c.x + 0, z: c.z - 8, y: c.y + y + 2 }, 'air');

            // commands.setBlock({ x: c.x + 0, z: c.z + 8, y: c.y + y + 1 }, 'water');
            // commands.setBlock({ x: c.x + 0, z: c.z + 8, y: c.y + y + 2 }, 'water');
            // commands.setBlock({ x: c.x + 0, z: c.z + 8, y: c.y + y + 2 }, 'water');
        }

    },
}

export const structureNames = Object.keys(structures) as (keyof typeof structures)[];
export const generateStructure = (commands: BlockCommandService, name: keyof typeof structures, options: { origin: Vector3 }) => {
    const s = structures[name];
    s(commands, options);
};