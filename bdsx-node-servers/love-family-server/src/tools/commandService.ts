import { NetworkIdentifier } from "../bdsx-dependencies/types";

export type CommandServiceDependencyType = {
    onPlayerCommand: (callback: (args: { command: string, networkIdentifier: NetworkIdentifier }) => void) => void,
    onServerCommand: (callback: (args: { command: string }) => void) => void,
};
export const createCommandService = (dependencies: CommandServiceDependencyType) => {

    return {
        ...dependencies,
    };
};

export type CommandServiceType = ReturnType<typeof createCommandService>;
