
export const createCommandsApi = (system: IVanillaServerSystem) => {

    const commands = {
        sendMessage: (playerName: string, message: string) => {
            const messageJson = JSON.stringify({ rawtext: [{ text: message }] });
            system.executeCommand(`/tellraw ${playerName} ${messageJson}`, () => { });
        },
        showTitle: (playerName: string, title: string, options?: { subTitle?: string, fadeInTimeSec: number, stayTimeSec: number, fadeOutTimeSec: number }) => {
            // const messageJson = JSON.stringify({ rawtext: [{ text: message }] });
            // system.executeCommand(`/titleraw ${playerName} ${messageJson}`, () => { });
            system.executeCommand(`/title ${playerName} reset`, () => { });
            if (options) {
                system.executeCommand(`/title ${playerName} times ${Math.ceil(options.fadeInTimeSec * 20)} ${Math.ceil(options.stayTimeSec * 20)} ${Math.ceil(options.fadeOutTimeSec * 20)}`, () => { });
            }
            system.executeCommand(`/title ${playerName} title ${title}`, () => { });
            if (options?.subTitle) {
                system.executeCommand(`/title ${playerName} subtitle ${options.subTitle}`, () => { });
            }
        },
        clearTitle: (playerName: string, message: string) => {
            system.executeCommand(`/title ${playerName} clear`, () => { });
            system.executeCommand(`/title ${playerName} reset`, () => { });
        },
        closeChat: (playerName: string) => {
            // TODO: What is the most non-intrusive way to force the chat to close on the client?
            // system.executeCommand(`/execute ${playerName} ~~~ tp ${playerName} ~~~`, () => { });
        },
    };

    return commands;
};

export type CommandsApiType = ReturnType<typeof createCommandsApi>;