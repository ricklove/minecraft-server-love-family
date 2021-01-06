
export const createCommandsApi = (system: IVanillaServerSystem) => {

    const commands = {
        sendMessage: (playerName: string, message: string) => {
            const messageJson = JSON.stringify({ rawtext: [{ text: message }] });
            system.executeCommand(`/tellraw ${playerName} ${messageJson}`, () => { });
        },
        closeChat: (playerName: string) => {
            //  system.executeCommand(`/execute ${playerName} ~~~ tp ${playerName} ~~~`, () => { });
        },
    };

    return commands;
};

export type CommandsApiType = ReturnType<typeof createCommandsApi>;