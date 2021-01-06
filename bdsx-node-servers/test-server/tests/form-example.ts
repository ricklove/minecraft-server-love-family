import { NetworkIdentifier } from "bdsx";
import { CustomForm, ModalForm, sendModalForm, SimpleForm } from "./formsapi";


export function sendExampleForm(networkIdentifier: NetworkIdentifier) {
    let worldSelectForm = new SimpleForm("§lMapSelect", "§l§o§ePlease Pick a World\nOr Custom Server");
    worldSelectForm.addButton("§l§dTEST WORLD");
    worldSelectForm.addButton("§l§bCUSTOM");

    console.log('sendExampleForm', { worldSelectForm });
    sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {

        console.log("formResponse=", { data });

        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    })

}

export function sendExampleForm_Modal(networkIdentifier: NetworkIdentifier) {
    let worldSelectForm = new ModalForm("§lMapSelect", "§l§o§ePlease Pick a World\nOr Custom Server");
    worldSelectForm.setLeftButton("§l§dTEST WORLD");
    worldSelectForm.setRightButton("§l§bCUSTOM");

    console.log('sendExampleForm', { worldSelectForm });
    sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {

        console.log("formResponse=", { data });

        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    })

}


export function sendExampleForm_Custom(networkIdentifier: NetworkIdentifier) {
    let worldSelectForm = new CustomForm("§lMapSelect");
    worldSelectForm.addLabel("§l§dTEST WORLD");
    worldSelectForm.addToggle("§l§bCUSTOM");
    worldSelectForm.addInput("§l§bINPUT");

    console.log('sendExampleForm', { worldSelectForm });
    sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {

        console.log("formResponse=", { data });

        // if (data.formData[0] === '0') {
        //     // transferServer(networkIdentifier, 'bds.server.com', 19134);
        //     console.log("not finished yet")
        // }
        // if (data.formData[0] === '1') {
        //     console.log("not finished yet")
        // }
    })

}

export function sendExampleForm_Math(networkIdentifier: NetworkIdentifier, onAnswered: (isCorrect: boolean) => void) {
    let worldSelectForm = new CustomForm("§lMapSelect");
    const a = Math.ceil(Math.random() * 10);
    const b = Math.ceil(Math.random() * 10);
    const correctAnswer = a * b;

    worldSelectForm.addLabel(`§l§dWhat be ${a} * ${b}`);
    worldSelectForm.addInput("§l§bAnswer");

    console.log('sendExampleForm', { worldSelectForm });
    sendModalForm(networkIdentifier, worldSelectForm, (data, networkIdentifier) => {

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
    })

}
