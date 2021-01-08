import { command } from "bdsx";

type CommandService = {
    executeCommand: (command: string) => void
};

export const performanceTestFill = (commands: CommandService) => {



};

const fillChunk = (commands: CommandService, containingPosition: { x: number, y: number, z: number }, blockName: string) => {

    let { x, y, z } = containingPosition;
    x = x % 16 * 16;
    z = z % 16 * 16;

    commands.executeCommand(`/fill ${x} ${1} ${z} ${x + 15} ${256} ${z + 15} ${blockName}`)
};