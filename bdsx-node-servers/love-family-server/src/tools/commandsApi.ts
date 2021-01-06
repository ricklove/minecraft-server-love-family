
export const createCommandsApi = (system: IVanillaServerSystem) => {

    const commands = {
        sendMessage: (playerName: string, message: string) => {
            const messageJson = JSON.stringify({ rawtext: [{ text: message }] });
            system.executeCommand(`/tellraw ${playerName} ${messageJson}`, () => { });
        },
        closeChat: (playerName: string) => {
            // TODO: What is the most non-intrusive way to force the chat to close on the client?
            // system.executeCommand(`/execute ${playerName} ~~~ tp ${playerName} ~~~`, () => { });
        },
    };

    return commands;
};

export type CommandsApiType = ReturnType<typeof createCommandsApi>;