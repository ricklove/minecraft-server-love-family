import { Vector3 } from "../utils/vector";

type CommandService = {
    executeCommand: (command: string) => void
};

export type BlockCommandService = {
    fill: (from: Vector3, to: Vector3, blockName: string) => void;
};

export const createBlockService = (commands: CommandService) => {
    return {
        fill: (from: Vector3, to: Vector3, blockName: string) =>
            commands.executeCommand(`/fill ${from.x} ${from.y} ${from.z} ${to.x} ${to.y} ${to.z} ${blockName}`),
    };
}