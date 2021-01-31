import { Vector3 } from "../utils/vector";
import { BlockCommandService } from "./blockService";
import { generatePattern_star } from "./patterns";


export const generateStructure_ironFarmV1 = (commands: BlockCommandService, options: { bottomCenter: Vector3 }) => {

    const c = options.bottomCenter;

    generatePattern_star(commands, { center: { ...c, y: c.y + 22 }, radius: 12, blockName: 'iron_block' });
};