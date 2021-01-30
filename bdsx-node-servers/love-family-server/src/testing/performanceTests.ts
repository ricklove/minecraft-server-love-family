type CommandService = {
    executeCommand: (command: string) => void
};

export const performanceTestFill = (commands: CommandService, chunkWidth: number, blockName: string) => {

    for (let x = 1024; x < 1024 + 16 * chunkWidth; x += 16) {
        for (let z = 1024; z < 1024 + 16 * chunkWidth; z += 16) {
            fillChunk(commands, { x, y: 1, z }, blockName);
        }
    }

};

const fillChunk = (commands: CommandService, containingPosition: Vector3, blockName: string) => {

    let { x, y, z } = containingPosition;
    x = Math.floor(x / 16) * 16;
    z = Math.floor(z / 16) * 16;

    commands.executeCommand(`/fill ${x} ${0} ${z} ${x + 15} ${127} ${z + 15} ${blockName}`)
};

export const testFillcheckerBoard = (commands: CommandService, chunkWidth: number) => {

    for (let x = 1024; x < 1024 + 16 * chunkWidth; x++) {
        for (let z = 1024; z < 1024 + 16 * chunkWidth; z++) {
            const blockName = (x + z) % 2 === 0 ? 'air' : 'bedrock';
            commands.executeCommand(`/setblock ${x} ${0} ${z} ${blockName}`)
        }
    }
};

export const testFillSinCurve = (commands: CommandService, chunkWidth: number, offset: number, blockName: string) => {

    commands.executeCommand(`/fill ${1024} ${0} ${1024} ${1024 + 16 * chunkWidth - 1} ${0} ${1024 + 16 * chunkWidth - 1} ${'air'}`)

    for (let x = 1024; x < 1024 + 16 * chunkWidth; x++) {
        const z = Math.floor((Math.sin(x / (16 * chunkWidth - 1) * 2 * Math.PI + offset) * 0.5 + 0.5) * 16 * chunkWidth);
        commands.executeCommand(`/fill ${x} ${0} ${1024} ${x} ${0} ${1024 + z} ${blockName}`)
    }
};

export const testFillSinCurve_vertical = (commands: CommandService, chunkWidth: number, offset: number, blockName: string) => {

    //commands.executeCommand(`/fill ${1024} ${0} ${1024} ${1024 + 16 * chunkWidth - 1} ${0} ${1024 + 16 * chunkWidth - 1} ${'air'}`)

    const amplitudeRatio = 2 / (16 * chunkWidth);

    for (let x = 1024; x < 1024 + 16 * chunkWidth; x++) {
        const h = Math.floor((Math.sin(x / (16 * chunkWidth - 1) * 2 * Math.PI + offset) * amplitudeRatio + (1 - amplitudeRatio)) * 16 * chunkWidth);
        commands.executeCommand(`/fill ${x} ${0} ${1024} ${x} ${16 * chunkWidth - 1} ${1024 + 16 * chunkWidth - 1} ${'air'}`)
        commands.executeCommand(`/fill ${x} ${0} ${1024} ${x} ${h} ${1024 + 16 * chunkWidth - 1} ${blockName}`)
    }
};

export const testFillSinCurve_verticalThin = (commands: CommandService, chunkWidth: number, offset: number, blockName: string) => {

    //commands.executeCommand(`/fill ${1024} ${0} ${1024} ${1024 + 16 * chunkWidth - 1} ${0} ${1024 + 16 * chunkWidth - 1} ${'air'}`)

    const amplitudeRatio = 8 / (16 * chunkWidth);

    for (let x = 1024; x < 1024 + 16 * chunkWidth; x++) {
        const h = Math.floor((Math.sin(x / (16 * chunkWidth - 1) * 2 * Math.PI + offset) * amplitudeRatio + (1 - amplitudeRatio)) * 16 * chunkWidth);
        commands.executeCommand(`/fill ${x} ${h} ${1024} ${x} ${16 * chunkWidth - 1} ${1024} ${'air'}`)
        commands.executeCommand(`/fill ${x} ${0} ${1024} ${x} ${h} ${1024} ${blockName}`)
    }
};