import { Vector3 } from "../utils/vector";

export const calculateMapPosition = (containingPosition: Vector3): { topLeft: Vector3, bottomRight: Vector3 } => {
    // TODO: Zoom level > 0

    // Assumes Zoom level 0: 0,0 at center of origin map (block aligned 0-15)
    const size = 128;
    const offset = 64;

    const y = containingPosition.y;

    const x = Math.floor((containingPosition.x - offset) / size) * size + offset;
    const z = Math.floor((containingPosition.z - offset) / size) * size + offset;

    const topLeft = {
        x,
        y,
        z,
    };
    const bottomRight = {
        x: x + size - 1,
        y,
        z: z + size - 1,
    };

    console.log('calculateMapPosition', { containingPosition, topLeft, bottomRight });
    return { topLeft, bottomRight };
};