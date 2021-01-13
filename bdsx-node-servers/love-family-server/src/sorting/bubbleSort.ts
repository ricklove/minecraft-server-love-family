import { graphBars } from "../graphing/graph";

type CommandService = {
    executeCommand: (command: string) => void
};

const createBubbleSorter = (count: number, max: number) => {

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
        state,
        iterate,
    };
};

export const runBubbleSort = (commands: CommandService) => {

    const size = 64;
    const bubbleSort = createBubbleSorter(size, size);

    const iterationsPerTick = 1;

    let intervalId = 0 as unknown as ReturnType<typeof setInterval>;
    const run = () => {
        intervalId = setInterval(() => {

            // Extra iterations
            for (let i = 0; i < iterationsPerTick - 1; i++) {
                bubbleSort.iterate();
            }

            const result = bubbleSort.iterate();
            // console.log('runBubbleSort iterate', { bubbleSort });

            graphBars(commands, x => ({
                height: bubbleSort.state.items[x],
                aboveBlockName: 'air',
                belowBlockName: x === bubbleSort.state.cursor ? 'gold_block'
                    : x + 1 === bubbleSort.state.cursor ? 'iron_block'
                        : 'dirt',
            }), {
                origin: { x: 1024, y: 32, z: 1024 },
                width: size,
                height: size,
                blockName: 'dirt'
            });

            if (result?.isDone) {
                clearInterval(intervalId);
                return;
            }

        }, 50);
    };

    run();
    return {
        stop: () => clearInterval(intervalId),
        continue: () => run(),
    };
};