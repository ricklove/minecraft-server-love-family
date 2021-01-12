import { StudyProblemBase, StudySubject } from "../types";

export type SpellingProblemType = StudyProblemBase<'spelling'> & {
    word: string,
    wrongChoices: string[],
};

export const createSpellingSubject = (): StudySubject<SpellingProblemType, 'spelling'> => {

    const getNewProblem = (): SpellingProblemType => {
        return {
            subjectKey: 'spelling',
            key: 'howdy',
            formTitle: 'howdy',
            question: 'howdy',
            questionPreview: 'howdy',
            correctAnswer: 'howdy',
            word: 'howdy',
            wrongChoices: ['hi', 'hello'],
        };
    };

    return {
        subjectKey: 'spelling',
        getNewProblem,
        getWrongChoices: (p) => new Set(p.wrongChoices),
        evaluateAnswer: (p, answer) => ({ isCorrect: p.correctAnswer === answer }),
        getReviewProblemSequence: (p) => [p],
    };
};