import clearModule from "clear-module";

export const loadAtRuntime = async (moduleName: string) => {
    clearModule(moduleName);
    const module = await import(moduleName);
    return module;
};