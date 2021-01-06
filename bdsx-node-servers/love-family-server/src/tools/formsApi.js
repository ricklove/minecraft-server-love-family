"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsApi = void 0;
const bdsx_1 = require("bdsx");
const createSimpleForm = (options) => {
    const { title, content, buttons, } = options;
    return {
        type: 'form',
        title,
        content,
        buttons,
    };
};
const createModalForm = (options) => {
    const { title, content, leftButton, rightButton, } = options;
    return {
        type: 'modal',
        title,
        content,
        button1: leftButton,
        button2: rightButton,
    };
};
// export class CustomForm {
//     [key: string]: any
//     constructor(title = "") {
//         this.type = "custom_form";
//         this.title = title;
//         this.content = [];
//     }
//     addLabel(text: any) {
//         let content = {
//             type: "label",
//             text: text
//         };
//         this.content.push(content);
//     }
//     addToggle(text: any, _default = null) {
//         let content: { [key: string]: any } = {
//             type: "toggle",
//             text: text
//         };
//         if (_default !== null) {
//             content.default = _default;
//         }
//         this.content.push(content);
//     }
//     addSlider(text: any, min: any, max: any, step = null, _default = null) {
//         let content: { [key: string]: any } = {
//             type: "slider",
//             text: text,
//             min: min,
//             max: max
//         }
//         if (step !== null) {
//             content.step = step;
//         }
//         if (_default !== null) {
//             content.default = _default;
//         }
//         this.content.push(content);
//     }
//     addStepSlider(text: any, steps: null, defaultIndex = null) {
//         let content: { [key: string]: any } = {
//             type: "step_slider",
//             text: text,
//         }
//         if (steps !== null) {
//             content.step = steps;
//         }
//         if (defaultIndex !== null) {
//             content.default = defaultIndex;
//         }
//         this.content.push(content);
//     }
//     addDropdown(text: any, options: any, _default = null) {
//         let content: { [key: string]: any } = {
//             type: "dropdown",
//             text: text,
//             options: options
//         };
//         if (_default !== null) {
//             content.default = _default;
//         }
//         this.content.push(content);
//     }
//     addInput(text: any, placeholder = "", _default = null) {
//         let content: { [key: string]: any } = {
//             type: "input",
//             text: text,
//             placeholder: placeholder
//         };
//         if (_default !== null) {
//             content.default = _default;
//         }
//         this.content.push(content);
//     }
// }
const formCallback = {};
const sendForm = (networkIdentifier, form) => {
    let formId = Math.floor(Math.random() * 2147483647) + 1;
    let packet = bdsx_1.createPacket(bdsx_1.PacketId.ModalFormRequest);
    packet.setUint32(formId, 0x28);
    packet.setCxxString(JSON.stringify(form), 0x30);
    bdsx_1.sendPacket(networkIdentifier, packet);
    packet.dispose();
    const promise = new Promise((resolve, reject) => {
        formCallback[formId] = resolve;
    });
    // console.log(formCallback);
    return promise;
};
// Register for responses
bdsx_1.netevent.raw(bdsx_1.PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
    ptr.move(1);
    let data = {};
    data.packetId = bdsx_1.PacketId[packetId];
    data.formId = ptr.readVarUint();
    let rawData = ptr.readVarString();
    data.formData = rawData.replace(/[\[\]\r\n\1]+|(null,)/gm, "").split(',');
    console.log(data.packetId);
    console.log(data.formId);
    console.log(data.formData);
    if (formCallback[data.formId]) {
        formCallback[data.formId](data, networkIdentifier);
        // console.log(formCallback);
        delete formCallback[data.formId];
    }
    // console.log(formCallback);
});
exports.FormsApi = {
    sendSimpleForm: (options) => {
        return sendForm(options.networkIdentifier, createSimpleForm(options));
    },
    sendModalForm: (options) => {
        return sendForm(options.networkIdentifier, createModalForm(options));
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybXNBcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb3Jtc0FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBdUY7QUFHdkYsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLE9BVXpCLEVBQUUsRUFBRTtJQUVELE1BQU0sRUFDRixLQUFLLEVBQ0wsT0FBTyxFQUNQLE9BQU8sR0FDVixHQUFHLE9BQU8sQ0FBQztJQUVaLE9BQU87UUFDSCxJQUFJLEVBQUUsTUFBTTtRQUNaLEtBQUs7UUFDTCxPQUFPO1FBQ1AsT0FBTztLQUNWLENBQUM7QUFDTixDQUFDLENBQUM7QUFFRixNQUFNLGVBQWUsR0FBRyxDQUFDLE9BbUJ4QixFQUFFLEVBQUU7SUFFRCxNQUFNLEVBQ0YsS0FBSyxFQUNMLE9BQU8sRUFDUCxVQUFVLEVBQ1YsV0FBVyxHQUNkLEdBQUcsT0FBTyxDQUFDO0lBRVosT0FBTztRQUNILElBQUksRUFBRSxPQUFPO1FBQ2IsS0FBSztRQUNMLE9BQU87UUFDUCxPQUFPLEVBQUUsVUFBVTtRQUNuQixPQUFPLEVBQUUsV0FBVztLQUN2QixDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBSUYsNEJBQTRCO0FBQzVCLHlCQUF5QjtBQUN6QixnQ0FBZ0M7QUFDaEMscUNBQXFDO0FBQ3JDLDhCQUE4QjtBQUM5Qiw2QkFBNkI7QUFDN0IsUUFBUTtBQUNSLDRCQUE0QjtBQUM1QiwwQkFBMEI7QUFDMUIsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQUN6QixhQUFhO0FBQ2Isc0NBQXNDO0FBQ3RDLFFBQVE7QUFDUiw4Q0FBOEM7QUFDOUMsa0RBQWtEO0FBQ2xELDhCQUE4QjtBQUM5Qix5QkFBeUI7QUFDekIsYUFBYTtBQUNiLG1DQUFtQztBQUNuQywwQ0FBMEM7QUFDMUMsWUFBWTtBQUNaLHNDQUFzQztBQUN0QyxRQUFRO0FBQ1IsK0VBQStFO0FBQy9FLGtEQUFrRDtBQUNsRCw4QkFBOEI7QUFDOUIsMEJBQTBCO0FBQzFCLHdCQUF3QjtBQUN4Qix1QkFB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