import clearModule from "clear-module";

export const loadAtRuntime = async () => {
    const moduleName = `./dynamicScripting01`;
    clearModule(moduleName);
    const module = await import(moduleName);
    module.runDynamic();
};