type CommandService = {
    executeCommand: (command: string) => void
};

export const graph = (commands: CommandService, getYRatio: (xRatio: number) => number, options: {
    origin: { x: number, y: number, z: number },
    width: number,
    height: number,
    blockName: string,
}) => {

    const o = options.origin;
    const blockName = options.blockName;
    const w = options.width;
    const h = options.height;

    for (let x = 0; x < w; x++) {

        const xRatio = x / w;
        const yRatio = getYRatio(xRatio);
        const yVal = Math.round(h * yRatio);
        commands.executeCommand(`/fill   ${o.x + x} ${o.y + yVal + 1} ${o.z}   ${o.x + x} ${o.y + h - 1} ${o.z}   ${'air'}`)
        commands.executeCommand(`/fill   ${o.x + x} ${o.y + 0}        ${o.z}   ${o.x + x} ${o.y + yVal}  ${o.z}   ${blockName}`)
    }
};

export const graphBars = (commands: CommandService, getBar: (x: number) => { height: number, aboveBlockName?: string, belowBlockName?: string, atBlockName?: string }, options: {
    origin: { x: number, y: number, z: number },
    width: number,
    height: number,
    blockName: string,
}) => {

    const o = options.origin;
    const blockName = options.blockName;
    const w = options.width;
    const h = options.height;

    for (let x = 0; x < w; x++) {
        const bar = getBar(x);
        const yVal = bar.height;
        const { aboveBlockName, belowBlockName, atBlockName } = bar;

        commands.executeCommand(`/fill   ${o.x + x} ${o.y + yVal + 1} ${o.z}   ${o.x + x} ${o.y + h - 1} ${o.z}   ${aboveBlockName ?? 'air'}`);
        commands.executeCommand(`/fill   ${o.x + x} ${o.y + 0}        ${o.z}   ${o.x + x} ${o.y + yVal}  ${o.z}   ${belowBlockName ?? blockName}`);
        if (atBlockName) {
            commands.executeCommand(`/setblock   ${o.x + x} ${o.y + yVal} ${o.z}   ${atBlockName}`);
        }
    }
};

export const graphLine = (commands: CommandService, blockName: string) => {
    // const h = Math.floor((Math.sin(x / (16 * chunkWidth - 1) * 2 * Math.PI + offset) * amplitudeRatio + (1 - amplitudeRatio)) * 16 * chunkWidth);
    graph(commands, xRatio => xRatio, {
        origin: { x: 1024, y: 0, z: 1024 },
        width: 64,
        height: 64,
        blockName
    });
};

export const graphSinCurve = (commands: CommandService, blockName: string) => {
    // const h = Math.floor((Math.sin(x / (16 * chunkWidth - 1) * 2 * Math.PI + offset) * amplitudeRatio + (1 - amplitudeRatio)) * 16 * chunkWidth);
    graph(commands, xRatio => 0.5 + 0.5 * Math.sin(xRatio * Math.PI * 2), {
        origin: { x: 1024, y: 32, z: 1024 },
        width: 64,
        height: 64,
        blockName
    });
};

