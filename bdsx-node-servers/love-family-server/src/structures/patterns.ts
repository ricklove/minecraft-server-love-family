import { Vector3 } from "../utils/vector";
import { BlockCommandService } from "./blockService";


export const generatePattern_square = (commands: BlockCommandService, options: { center: Vector3, radius: number, blockName: string }) => {
    const { center, radius, blockName } = options;
    const o = center;

    for (let dz = -radius; dz <= radius; dz++) {
        const y = o.y;

        const dx = radius;
        commands.fill(
            { x: o.x - dx, y, z: o.z + dz },
            { x: o.x + dx, y, z: o.z + dz },
            blockName);
    }
};

export const generatePattern_star = (commands: BlockCommandService, options: { center: Vector3, radius: number, blockName: string }) => {
    const { center, radius, blockName } = options;
    const o = center;

    for (let dz = -radius; dz <= radius; dz++) {
        const y = o.y;

        // total length
        //     .    1
        //    ...   3
        //   .....  5
        //    ...   3
        //     .    1
        // const l = 1 + 2 * (radius - Math.abs(r));

        // length from center
        //      .     0
        //    . . .   1
        //   .. . ..  2
        //    . . .   1
        //      .     0
        const dx = radius - Math.abs(dz);

        commands.fill(
            { x: o.x - dx, y, z: o.z + dz },
            { x: o.x + dx, y, z: o.z + dz },
            blockName);
    }
};
