import { netevent, createPacket, sendPacket, PacketId, NetworkIdentifier } from 'bdsx';

const createSimpleForm = (options: {
    title: string,
    content: string,
    buttons: {
        text: string,
        image?: {
            // Just shows loading
            type: 'path' | 'url',
            data: string,
        }
    }[],
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
    buttonOK: string,
    buttonCancel: string,
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
        buttonOK: button1,
        buttonCancel: button2,
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
    formData: T,
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

    // console.log(formCallback);
    return promise;
}

// Register for responses
netevent.raw(PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
    ptr.move(1);
    const formId = ptr.readVarUint();
    const rawData = ptr.readVarString();
    //const formData = rawData.replace(/[\[\]\r\n\1]+|(null,)/gm, "").split(',');
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
        // console.log(formCallback);
        delete formCallback[responseData.formId];
    } else {
        console.log('formReponse IGNORED', { responseData, rawData });
    }
    // console.log(formCallback);
});


export const createFormsApi = () => {

    return {
        sendSimpleForm: async (options: Parameters<typeof createSimpleForm>[0] & { networkIdentifier: NetworkIdentifier, playerName: string }) => {
            return await sendForm(options.networkIdentifier, createSimpleForm(options));
        },
        sendCustomForm: async <TContent extends { [name: string]: CustomFormItem }>(options: { title: string, content: TContent, networkIdentifier: NetworkIdentifier, playerName: string }): Promise<{
            networkIdentifier: NetworkIdentifier,
            data: { [name in keyof TContent]: string | number | boolean | null }
        }> => {
            const contentItems = Object.keys(options.content).map(k => ({ name: k as keyof TContent, value: options.content[k] }));

            const result = await sendForm<(null | boolean | number | string)[]>(options.networkIdentifier, createCustomForm({
                title: options.title,
                content: contentItems.map(x => x.value),
            }));

            const data = {} as { [name in keyof TContent]: string | number | boolean | null };
            contentItems.forEach((x, i) => {
                const getValue = () => {
                    const valueRaw = result.formData[i];
                    if (x.value.type === 'step_slider') {
                        return x.value.steps[valueRaw as number];
                    }
                    if (x.value.type === 'dropdown') {
                        return x.value.options[valueRaw as number];
                    }
                    return valueRaw;
                };

                data[x.name] = getValue();
            });
            return {
                networkIdentifier: result.networkIdentifier,
                data,
            };
        },
        sendModalForm: async (options: Parameters<typeof createModalForm>[0] & { networkIdentifier: NetworkIdentifier, playerName: string }) => {
            const result = await sendForm<'true' | 'null'>(options.networkIdentifier, createModalForm(options));
            if (result.formData === 'true') {
                return {
                    networkIdentifier: result.networkIdentifier,
                    data: { isOk: true },
                };
            }
            return {
                networkIdentifier: result.networkIdentifier,
                data: { isOk: false },
            };
        },
    };
}

// How to use:
// 

// Singleton Access - if desired
// export const FormsApi = createFormsApi();