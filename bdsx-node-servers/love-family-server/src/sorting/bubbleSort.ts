import { INSPECT_MAX_BYTES } from "buffer";
import { graph } from "../graphing/graph";

type CommandService = {
    executeCommand: (command: string) => void
};

export const createBubbleSorter = (count: number, max: number) => {

    const state = {
        items: [...new Array(count)].map(() => Math.floor(Math.random() * max)),
        cursor: 0,
        isDone: false,
        didSwap: true,
    };

    const iterate = () => {
        if (state.isDone) { return { isDone: true }; }
        if (state.cursor + 1 > state.items.length - 1) {
            if (!state.didSwap) {
                state.isDone = true;
                return { isDone: true };
            }
            state.didSwap = false;
            state.cursor = 0;
        }

        const a = state.items[state.cursor];
        const b = state.items[state.cursor + 1];

        if (a > b) {
            // swap
            const t = state.items[state.cursor];
            state.items[state.cursor] = state.items[state.cursor + 1];
            state.items[state.cursor + 1] = t;

            state.didSwap = true;
        }

        state.cursor++;
    };

    return {
        items: state.items,
        iterate,
    };
};

export const runBubbleSort = (commands: CommandService, blockName: string) => {

    const size = 64;
    const bubbleSort = createBubbleSorter(size, size);

    const iterationsPerTick = 2;

    let intervalId = setInterval(() => {

        // Extra iterations
        for (let i = 0; i < iterationsPerTick - 1; i++) {
            bubbleSort.iterate();
        }

        const result = bubbleSort.iterate();
        // console.log('runBubbleSort iterate', { bubbleSort });

        graph(commands, xRatio => bubbleSort.items[Math.floor(size * xRatio)] / size, {
            origin: { x: 1024, y: 32, z: 1024 },
            width: size,
            height: size,
            blockName
        });

        if (result?.isDone) {
            clearInterval(intervalId);
            return;
        }

    }, 50);

};