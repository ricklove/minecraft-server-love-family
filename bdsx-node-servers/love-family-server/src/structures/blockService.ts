import { Vector3 } from "../utils/vector";

type CommandService = {
    executeCommand: (command: string) => void
};

export type BlockCommandService = {
    fill: (from: Vector3, to: Vector3, blockName: string) => void;
    setBlock: (to: Vector3, blockName: string) => void;
};

export const createBlockService = (commands: CommandService) => {
    return {
        fill: (from: Vector3, to: Vector3, blockName: string) =>
            commands.executeCommand(`/fill ${Math.floor(from.x)} ${Math.floor(from.y)} ${Math.floor(from.z)} ${Math.floor(to.x)} ${Math.floor(to.y)} ${Math.floor(to.z)} ${blockName}`),
        setBlock: (to: Vector3, blockName: string) =>
            commands.executeCommand(`/setblock ${Math.floor(to.x)} ${Math.floor(to.y)} ${Math.floor(to.z)} ${blockName}`),
    };
}