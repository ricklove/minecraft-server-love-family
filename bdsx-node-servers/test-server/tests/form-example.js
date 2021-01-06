"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExampleForm_Math = exports.sendExampleForm_Custom = exports.sendExampleForm_Modal = exports.sendExampleForm = void 0;
const formsapi_1 = require("./formsapi");
function sendExampleForm(networkIdentifier) {
    let worldSelectForm = new formsapi_1.SimpleForm("§lMapSelect", "§l§o§ePlease Pick a World\nOr Custom Server");
    worldSelectForm.addButton("§l§dTEST WORLD");
    worldSelectForm.addButton("§l§bCUSTOM");
    console.log('sendExampleForm', { worldSelectForm });
    formsapi_1.sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {
        console.log("formResponse=", { data });
        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    });
}
exports.sendExampleForm = sendExampleForm;
function sendExampleForm_Modal(networkIdentifier) {
    let worldSelectForm = new formsapi_1.ModalForm("§lMapSelect", "§l§o§ePlease Pick a World\nOr Custom Server");
    worldSelectForm.setLeftButton("§l§dTEST WORLD");
    worldSelectForm.setRightButton("§l§bCUSTOM");
    console.log('sendExampleForm', { worldSelectForm });
    formsapi_1.sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {
        console.log("formResponse=", { data });
        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    });
}
exports.sendExampleForm_Modal = sendExampleForm_Modal;
function sendExampleForm_Custom(networkIdentifier) {
    let worldSelectForm = new formsapi_1.CustomForm("§lMapSelect");
    worldSelectForm.addLabel("§l§dTEST WORLD");
    worldSelectForm.addToggle("§l§bCUSTOM");
    worldSelectForm.addInput("§l§bINPUT");
    console.log('sendExampleForm', { worldSelectForm });
    formsapi_1.sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {
        console.log("formResponse=", { data });
        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    });
}
exports.sendExampleForm_Custom = sendExampleForm_Custom;
function sendExampleForm_Math(networkIdentifier, onAnswered) {
    let worldSelectForm = new formsapi_1.CustomForm("§lMapSelect");
    const a = Math.ceil(Math.random() * 10);
    const b = Math.ceil(Math.random() * 10);
    const correctAnswer = a * b;
    worldSelectForm.addLabel(`§l§dWhat be ${a} * ${b}`);
    worldSelectForm.addInput("§l§bAnswer");
    console.log('sendExampleForm', { worldSelectForm });
    formsapi_1.sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {
        console.log("formResponse=", { data });
        const answer = parseInt(data.formData[0].replace(/[^0-9]/g, ''), 10) || 'WRONG';
        const isCorrect = correctAnswer === answer;
        console.log('math answered', { answer, isCorrect });
        onAnswered(isCorrect);
        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    });
}
exports.sendExampleForm_Math = sendExampleForm_Math;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybS1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZm9ybS1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlDQUE4RTtBQUc5RSxTQUFnQixlQUFlLENBQUMsaUJBQW9DO0lBQ2hFLElBQUksZUFBZSxHQUFHLElBQUkscUJBQVUsQ0FBQyxhQUFhLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztJQUNuRyxlQUFlLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDNUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUV4QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztJQUNwRCx3QkFBYSxDQUFDLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRSxFQUFFO1FBRTFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUV2QyxrQ0FBa0M7UUFDbEMscUVBQXFFO1FBQ3JFLHNDQUFzQztRQUN0QyxJQUFJO1FBQ0osa0NBQWtDO1FBQ2xDLHNDQUFzQztRQUN0QyxJQUFJO0lBQ1IsQ0FBQyxDQUFDLENBQUE7QUFFTixDQUFDO0FBbkJELDBDQW1CQztBQUVELFNBQWdCLHFCQUFxQixDQUFDLGlCQUFvQztJQUN0RSxJQUFJLGVBQWUsR0FBRyxJQUFJLG9CQUFTLENBQUMsYUFBYSxFQUFFLDZDQUE2QyxDQUFDLENBQUM7SUFDbEcsZUFBZSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2hELGVBQWUsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7SUFDcEQsd0JBQWEsQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLEVB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