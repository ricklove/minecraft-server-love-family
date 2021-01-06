import { netevent, createPacket, sendPacket, PacketId, NetworkIdentifier } from 'bdsx';

// Credit: Not sure who to credit for figuring out this format, but thanks to those who figured out the technical details for this

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


type ResponseData<T> = {
    formData: null | T,
    networkIdentifier: NetworkIdentifier,
    formId: number,
    packetId: string,
};
const formCallback = {} as { [formId: number]: (response: ResponseData<unknown>) => void; }

const sendForm = <TFormData>(networkIdentifier: NetworkIdentifier, form: object): Promise<ResponseData<TFormData>> => {
    let formId = Math.floor(Math.random() * 2147483647) + 1;
    let packet = createPacket(PacketId.ModalFormRequest);
    packet.setUint32(formId, 0x28);
    packet.setCxxString(JSON.stringify(form), 0x30);
    sendPacket(networkIdentifier, packet);
    packet.dispose();

    const promise = new Promise<ResponseData<TFormData>>((resolve, reject) => {
        formCallback[formId] = (x) => resolve(x as ResponseData<TFormData>);
    });

    return promise;
}

// Register for responses
netevent.raw(PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
    ptr.move(1);
    const formId = ptr.readVarUint();
    const rawData = ptr.readVarString();
    const formData = JSON.parse(rawData);

    const responseData = {
        packetId: PacketId[packetId],
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


export const createFormsApi = () => {

    return {
        sendSimpleForm: async  <TContent extends { [name: string]: FormButtonItem }>(options: { title: string, content: string, buttons: TContent, networkIdentifier: NetworkIdentifier, playerName: string }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { buttonClickedName: keyof TContent | null }
        }> => {
            const buttonItems = Object.keys(options.content).map(k => ({ name: k as keyof TContent, value: options.content[k] }));

            const result = await sendForm(options.networkIdentifier, createSimpleForm({
                title: options.title,
                content: options.content,
                buttons: buttonItems.map(x => x.value),
            }));
            const buttonClickedName = result.formData === 'null' || !result.formData ? null : result.formData as keyof TContent;
            return {
                networkIdentifier: result.networkIdentifier,
                formData: { buttonClickedName }
            };
        },
        sendModalForm: async (options: Parameters<typeof createModalForm>[0] & { networkIdentifier: NetworkIdentifier, playerName: string }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { wasButton1Clicked: boolean }
        }> => {
            const result = await sendForm<'true' | 'null'>(options.networkIdentifier, createModalForm(options));
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
        sendCustomForm: async <TContent extends { [name: string]: CustomFormItem }>(options: { title: string, content: TContent, networkIdentifier: NetworkIdentifier, playerName: string }): Promise<{
            networkIdentifier: NetworkIdentifier,
            formData: { [name in keyof TContent]: string | number | boolean | null }
        }> => {
            const contentItems = Object.keys(options.content).map(k => ({ name: k as keyof TContent, value: options.content[k] }));

            const result = await sendForm<(null | boolean | number | string)[]>(options.networkIdentifier, createCustomForm({
                title: options.title,
                content: contentItems.map(x => x.value),
            }));

            const formData = {} as { [name in keyof TContent]: string | number | boolean | null };
            contentItems.forEach((x, i) => {
                const getValue = () => {
                    const valueRaw = result.formData?.[i] ?? null;
                    if (x.value.type === 'step_slider') {
                        return x.value.steps[valueRaw as number];
                    }
                    if (x.value.type === 'dropdown') {
                        return x.value.options[valueRaw as number];
                    }
                    return valueRaw;
                };

                formData[x.name] = getValue();
            });
            return {
                networkIdentifier: result.networkIdentifier,
                formData: formData,
            };
        },
    };
}

export type FormsApiType = ReturnType<typeof createFormsApi>;