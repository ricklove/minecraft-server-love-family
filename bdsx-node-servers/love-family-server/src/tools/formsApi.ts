import { NetworkIdentifier } from "../bdsx-dependencies/types";

// Credits: Thanks for these coders for their great work!
// Based on: https://github.com/randommouse/bdsx-scripts/blob/main/formsapi.ts @☮madeofstown
// And: https://github.com/Rjlintkh/bdsx-scripts/blob/main/scripts/forms.js @P Jai Rjlin
// And: https://github.com/karikera/bdsx/wiki/Structure-of-Cxx-packets

type FormButtonItem = {
    text: string,
    // TODO: Debug: Internet url not working - just shows loading placeholder
    image?: {
        type: 'path' | 'url',
        data: string,
    }
};
const createSimpleForm = (options: {
    title: string,
    content: string,
    buttons: FormButtonItem[],
}) => {

    const {
        title,
        content,
        buttons,
    } = options;

    return {
        type: 'form',
        title,
        content,
        buttons,
    };
};

const createModalForm = (options: {
    title: string,
    content: string,
    button1: string,
    button2: string,
    // TODO: Test if images are supported here somehow
    // leftButton: {
    //     text: string,
    //     image?: {
    //         type: 'path' | 'url',
    //         data: string,
    //     }
    // },
    // rightButton: {
    //     text: string,
    //     image?: {
    //         type: 'path' | 'url',
    //         data: string,
    //     }
    // },
}) => {

    const {
        title,
        content,
        button1,
        button2,
    } = options;

    return {
        type: 'modal',
        title,
        content,
        button1,
        button2,
    };
};

type CustomFormItem =
    { type: 'label', text: string }
    | { type: 'toggle', text: string, default?: boolean }
    | { type: 'slider', text: string, min: number, max: number, step?: number, default?: number }
    | { type: 'step_slider', text: string, steps: string[], default?: number }
    | { type: 'dropdown', text: string, options: string[], default?: string }
    | { type: 'input', text: string, placeholder?: string, default?: string }
    ;
type CustomFormData<T extends { [name: string]: CustomFormItem }> = {
    [K in keyof T]
    : T[K] extends { type: 'toggle' } ? { value: boolean }
    : T[K] extends { type: 'slider' } ? { value: number }
    : T[K] extends { type: 'step_slider' } ? { value: string, index: number }
    : T[K] extends { type: 'dropdown' } ? { value: string, index: number }
    : T[K] extends { type: 'input' } ? { value: string }
    : never
};

const createCustomForm = (options: {
    title: string,
    content: CustomFormItem[],
}) => {
    const {
        title,
        content,
    } = options;

    // Empty required values
    content.forEach(x => {
        if (x.type === 'input' && !x.placeholder) {
            x.placeholder = '';
        }
    });

    return {
        type: 'custom_form',
        title,
        content,
    };
};

// const createFormsApiDependencies = (): CreateFormsApiDependenciesType => {
//     return {
//         sendForm: ({ formId, content, networkIdentifier }) => {
//             let packet = ShowModalFormPacket.create();
//             packet.id = formId;
//             packet.content = content;
//             packet.sendTo(networkIdentifier, 0);
//             packet.dispose();
//         },
//         onFormResponse: (callback) => {
//             nethook.raw(PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
//                 ptr.move(1);
//                 const formId = ptr.readVarUint();
//                 const rawData = ptr.readVarString();
//                 callback({ formId, rawData, networkIdentifier });
//             });
//         },
//     };
// };

export type FormsApiDependenciesType = {
    sendForm: (args: { formId: number, content: string, networkIdentifier: NetworkIdentifier }) => void,
    onFormResponse: (callback: (args: { formId: number, rawData: string, networkIdentifier: NetworkIdentifier }) => void) => void,
};
export const createFormsApi = (dependencies: FormsApiDependenciesType) => {

    type ResponseData<T> = {
        formData: null | T,
        networkIdentifier: NetworkIdentifier,
        formId: number,
        // packetId: string,
    };
    const formCallback = {} as { [formId: number]: (response: ResponseData<unknown>) => void; }
    const formTimeoutIds = [] as ReturnType<typeof setTimeout>[];

    // const sendForm = <TFormData>(networkIdentifier: NetworkIdentifier, form: object, timeoutMs?: number): Promise<ResponseData<TFormData>> => {
    //     let formId = Math.floor(Math.random() * 2147483647) + 1;
    //     let packet = ShowModalFormPacket.create();
    //     packet.id = formId;
    //     packet.content = JSON.stringify(form)
    //     packet.sendTo(networkIdentifier, 0);
    //     packet.dispose();
    const sendForm = <TFormData>(networkIdentifier: NetworkIdentifier, form: object, timeoutMs?: number): Promise<ResponseData<TFormData>> => {

        const formId = Math.floor(Math.random() * 2147483647) + 1;
        dependencies.sendForm({
            formId,
            content: JSON.stringify(form),
            networkIdentifier
        });

        const promise = new Promise<ResponseData<TFormData>>((resolve, reject) => {
            let wasTimedOut = false;
            const timeoutId = timeoutMs ? setTimeout(() => {
                // reject('timeout');
                wasTimedOut = true;
                reject('timeout');
            }, timeoutMs) : null;
            if (timeoutId) { formTimeoutIds.push(timeoutId); }

            formCallback[formId] = (x) => {
                if (wasTimedOut) { return; }
                if (timeoutId) { clearTimeout(timeoutId); }
                resolve(x as ResponseData<TFormData>);
            };
        });

        return promise;
    }

    // Register for responses
    // nethook.raw(PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
    //     ptr.move(1);
    //     const formId = ptr.readVarUint();
    //     const rawData = ptr.readVarString();
    dependencies.onFormResponse(({ formId, rawData, networkIdentifier }) => {

        const formData = JSON.parse(rawData);
        const responseData = {
            //  packetId: PacketId[packetId],
            formId,
            formData,
            networkIdentifier,
        };

        if (formCallback[responseData.formId]) {
            console.log('formReponse', { responseData, rawData });

            formCallback[responseData.formId](responseData);
            delete formCallback[responseData.formId];
        } else {
            console.log('formReponse IGNORED', { responseData, rawData });
        }
    });


    return {
        stop: () => {
            for (const x of formTimeoutIds) {
                clearTimeout(x);
            }
        },
        sendSimpleForm: async  <TContent extends { [name: string]: FormButtonItem }>(options: { title: string, content: string, buttons: TContent, networkIdentifier: NetworkIdentifier, playerName: string, timeoutMs?: number }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { buttonClickedName: keyof TContent | null }
        }> => {
            const buttonItems = Object.keys(options.content).map(k => ({ name: k as keyof TContent, value: options.buttons[k] }));

            const result = await sendForm(options.networkIdentifier, createSimpleForm({
                title: options.title,
                content: options.content,
                buttons: buttonItems.map(x => x.value),
            }), options.timeoutMs);
            const buttonClickedName = result.formData === null ? null : buttonItems[result.formData as number].name;
            return {
                networkIdentifier: result.networkIdentifier,
                formData: { buttonClickedName }
            };
        },
        sendSimpleButtonsForm: async (options: { title: string, content: string, buttons: string[], networkIdentifier: NetworkIdentifier, playerName: string, timeoutMs?: number }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { buttonClickedName: string | null }
        }> => {
            const buttonItems = options.buttons;

            const result = await sendForm(options.networkIdentifier, createSimpleForm({
                title: options.title,
                content: options.content,
                buttons: buttonItems.map(x => ({ text: x })),
            }), options.timeoutMs);
            const buttonClickedName = result.formData === null ? null : buttonItems[result.formData as number];
            return {
                networkIdentifier: result.networkIdentifier,
                formData: { buttonClickedName }
            };
        },
        sendModalForm: async (options: Parameters<typeof createModalForm>[0] & { networkIdentifier: NetworkIdentifier, playerName: string, timeoutMs?: number }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { wasButton1Clicked: boolean }
        }> => {
            const result = await sendForm<'true' | 'null'>(options.networkIdentifier, createModalForm(options), options.timeoutMs);
            if (result.formData === 'true') {
                return {
                    networkIdentifier: result.networkIdentifier,
                    formData: { wasButton1Clicked: true },
                };
            }
            return {
                networkIdentifier: result.networkIdentifier,
                formData: { wasButton1Clicked: false },
            };
        },
        sendCustomForm: async <TContent extends { [name: string]: CustomFormItem }>(options: { title: string, content: TContent, networkIdentifier: NetworkIdentifier, playerName: string, timeoutMs?: number }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: null | CustomFormData<TContent>
        }> => {
            const contentItems = Object.keys(options.content).map(k => ({ name: k as keyof TContent, value: options.content[k] }));

            const result = await sendForm<(null | boolean | number | string)[]>(options.networkIdentifier, createCustomForm({
                title: options.title,
                content: contentItems.map(x => x.value),
            }), options.timeoutMs);

            if (!result.formData) {
                return {
                    networkIdentifier: result.networkIdentifier,
                    formData: null,
                };
            }

            const formData = {} as CustomFormData<TContent>;
            contentItems.forEach((x, i) => {
                const getValue = () => {
                    const valueRaw = result.formData?.[i] || null;
                    if (x.value.type === 'step_slider') {
                        return { index: valueRaw as number, value: x.value.steps[valueRaw as number] };
                    }
                    if (x.value.type === 'dropdown') {
                        return { index: valueRaw as number, value: x.value.options[valueRaw as number] };
                    }
                    if (x.value.type === 'toggle') {
                        return { value: valueRaw as boolean };
                    }
                    if (x.value.type === 'input') {
                        return { value: valueRaw as string };
                    }
                    if (x.value.type === 'slider') {
                        return { value: valueRaw as number };
                    }
                    if (x.value.type === 'label') {
                        return {};
                    }
                    // This should not occur
                    return { value: valueRaw };
                };

                // Name mapping requires any
                formData[x.name] = getValue() as any;
            });
            return {
                networkIdentifier: result.networkIdentifier,
                formData: formData,
            };
        },
    };
}

export type FormsApiType = ReturnType<typeof createFormsApi>;