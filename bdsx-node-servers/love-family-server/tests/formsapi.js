"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendModalForm = exports.CustomForm = exports.ModalForm = exports.SimpleForm = void 0;
const bdsx_1 = require("bdsx");
class SimpleForm {
    constructor(title = "", content = "") {
        this.type = "form";
        this.title = title;
        this.content = content;
        this.buttons = [];
    }
    addButton(text, imageType = null, imagePath = "") {
        let content = {
            text: text
        };
        if (imageType !== null) {
            content.image = {
                type: imageType === 0 ? "path" : "url",
                data: imagePath
            };
        }
        this.buttons.push(content);
    }
}
exports.SimpleForm = SimpleForm;
class ModalForm {
    constructor(title = "", content = "") {
        this.type = "modal";
        this.title = title;
        this.content = content;
        this.button1 = "";
        this.button2 = "";
    }
    setLeftButton(text) {
        this.button1 = text;
    }
    setRightButton(text) {
        this.button2 = text;
    }
}
exports.ModalForm = ModalForm;
class CustomForm {
    constructor(title = "") {
        this.type = "custom_form";
        this.title = title;
        this.content = [];
    }
    addLabel(text) {
        let content = {
            type: "label",
            text: text
        };
        this.content.push(content);
    }
    addToggle(text, _default = null) {
        let content = {
            type: "toggle",
            text: text
        };
        if (_default !== null) {
            content.default = _default;
        }
        this.content.push(content);
    }
    addSlider(text, min, max, step = null, _default = null) {
        let content = {
            type: "slider",
            text: text,
            min: min,
            max: max
        };
        if (step !== null) {
            content.step = step;
        }
        if (_default !== null) {
            content.default = _default;
        }
        this.content.push(content);
    }
    addStepSlider(text, steps, defaultIndex = null) {
        let content = {
            type: "step_slider",
            text: text,
        };
        if (steps !== null) {
            content.step = steps;
        }
        if (defaultIndex !== null) {
            content.default = defaultIndex;
        }
        this.content.push(content);
    }
    addDropdown(text, options, _default = null) {
        let content = {
            type: "dropdown",
            text: text,
            options: options
        };
        if (_default !== null) {
            content.default = _default;
        }
        this.content.push(content);
    }
    addInput(text, placeholder = "", _default = null) {
        let content = {
            type: "input",
            text: text,
            placeholder: placeholder
        };
        if (_default !== null) {
            content.default = _default;
        }
        this.content.push(content);
    }
}
exports.CustomForm = CustomForm;
const formCallback = {};
function sendModalForm(networkIdentifier, form, callback = function () { }) {
    let formId = Math.floor(Math.random() * 2147483647) + 1;
    let packet = bdsx_1.createPacket(bdsx_1.PacketId.ModalFormRequest);
    packet.setUint32(formId, 0x28);
    packet.setCxxString(JSON.stringify(form), 0x30);
    bdsx_1.sendPacket(networkIdentifier, packet);
    packet.dispose();
    formCallback[formId] = callback;
    // console.log(formCallback);
}
exports.sendModalForm = sendModalForm;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybXNhcGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb3Jtc2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBdUY7QUFFdkYsTUFBYSxVQUFVO0lBRW5CLFlBQVksS0FBSyxHQUFHLEVBQUUsRUFBRSxPQUFPLEdBQUcsRUFBRTtRQUNoQyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBQ0QsU0FBUyxDQUFDLElBQVksRUFBRSxTQUFTLEdBQUcsSUFBSSxFQUFFLFNBQVMsR0FBRyxFQUFFO1FBQ3BELElBQUksT0FBTyxHQUEyQjtZQUNsQyxJQUFJLEVBQUUsSUFBSTtTQUNiLENBQUM7UUFDRixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDcEIsT0FBTyxDQUFDLEtBQUssR0FBRztnQkFDWixJQUFJLEVBQUUsU0FBUyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLO2dCQUN0QyxJQUFJLEVBQUUsU0FBUzthQUNsQixDQUFBO1NBQ0o7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDO0NBQ0o7QUFwQkQsZ0NBb0JDO0FBRUQsTUFBYSxTQUFTO0lBRWxCLFlBQVksS0FBSyxHQUFHLEVBQUUsRUFBRSxPQUFPLEdBQUcsRUFBRTtRQUNoQyxJQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNsQixJ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