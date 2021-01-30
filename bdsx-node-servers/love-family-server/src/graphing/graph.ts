import { Vector3 } from "../utils/vector";
import { calculateMapPosition } from "./map";

type CommandService = {
    executeCommand: (command: string) => void
};

export const graph = (commands: CommandService, getYRatio: (xRatio: number) => number, options: {
    origin: Vector3,
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
    origin: Vector3,
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
        const yVal = Math.min(h - 1, bar.height);
        const { aboveBlockName, belowBlockName, atBlockName } = bar;

        commands.executeCommand(`/fill   ${o.x + x} ${o.y + yVal} ${o.z}   ${o.x + x} ${o.y + h - 1} ${o.z}   ${aboveBlockName ?? 'air'}`);
        commands.executeCommand(`/fill   ${o.x + x} ${o.y + 0}    ${o.z}   ${o.x + x} ${o.y + yVal}  ${o.z}   ${belowBlockName ?? blockName}`);
        if (atBlockName) {
            commands.executeCommand(`/setblock   ${o.x + x} ${o.y + yVal} ${o.z}   ${atBlockName}`);
        }
    }
};

export const graphMap = (commands: CommandService, getValue: (x: number) => { value: number, value_bottom?: number, aboveBlockName?: string, belowBlockName?: string, atBlockName?: string }, options: {
    origin: Vector3,
    blockName: string,
}) => {

    const o = calculateMapPosition(options.origin);
    const blockName = options.blockName;
    const w = 128;
    const h = 128;
    const y = Math.floor(options.origin.y);

    for (let x = 0; x < w; x++) {
        const vResult = getValue(x);
        const val = Math.min(h - 1, vResult.value);
        const { aboveBlockName, belowBlockName, atBlockName } = vResult;

        const zVal = 128 - val;

        commands.executeCommand(`/fill   ${o.topLeft.x + x} ${y} ${o.topLeft.z + zVal + 1}   ${o.topLeft.x + x} ${y} ${o.topLeft.z + 0}         ${aboveBlockName ?? 'air'}`);
        commands.executeCommand(`/fill   ${o.topLeft.x + x} ${y} ${o.topLeft.z + zVal - 1}   ${o.topLeft.x + x} ${y} ${o.topLeft.z + 127}       ${belowBlockName ?? blockName}`);
        if (atBlockName) {
            const val_bottom = Math.min(h - 1, vResult.value_bottom ?? vResult.value);
            const zVal_bottom = 128 - val_bottom;

            commands.executeCommand(`/fill   ${o.topLeft.x + x} ${y} ${o.topLeft.z + zVal}   ${o.topLeft.x + x} ${y} ${o.topLeft.z + zVal_bottom}       ${atBlockName ?? blockName}`);
            // commands.executeCommand(`/setblock   ${o.topLeft.x + x} ${y} ${o.topLeft.z + zVal}   ${atBlockName}`);
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

