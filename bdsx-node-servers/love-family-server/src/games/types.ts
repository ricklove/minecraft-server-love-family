import { createMathSubject, MathProblemType } from "./subjects/mathProblems";
import { createSpellingSubject, SpellingProblemType } from "./subjects/spellingProblems";
import { createSpanishSubject, SpanishProblemType } from "./subjects/spanishProblems";

export const allSubjects = [
    createMathSubject(),
    createSpellingSubject(),
    createSpanishSubject(),
];
export type StudyProblemType = MathProblemType | SpellingProblemType | SpanishProblemType;
export const getSubject = (subjectKey: StudyProblemType['subjectKey']): StudySubject<StudyProblemType, typeof subjectKey> => {
    return allSubjects.find(s => s.subjectKey === subjectKey) ?? allSubjects[0];
};


export type StudyProblemAnswer = {
    wasCorrect: boolean,
    answerRaw: string | null,
    responseMessage?: string | null,
    problem: StudyProblemType,
    time: Date,
    timeToAnswerMs: number,
};

export type StudyProblemBase<TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    categoryKey: string,
    key: string,
    formTitle: string,
    question: string,
    questionPreview?: string,
    questionPreviewTimeMs?: number,
    questionPreviewChat?: string,
    questionPreviewChatTimeMs?: number,
    correctAnswer: string,
    isTyping?: boolean,
    _isReviewProblem?: boolean,
    _reviewProblemSource?: StudyProblemType,
};

export type StudyProblemReviewState = {
    problem: StudyProblemType,
    reviewLevel: number,
};

export type StudySubject<TProblem extends StudyProblemBase<TSubjectKey>, TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    subjectTitle: string,
    getNewProblem: (selectedCategories: { categoryKey: string }[]) => TProblem,
    getWrongChoices: (problem: TProblem) => Set<string>,
    evaluateAnswer: (problem: TProblem, answer: string | null | undefined) => { isCorrect: boolean, responseMessage?: string },
    getReviewProblemSequence: (problem: TProblem, reviewLevel: number) => TProblem[],
    getCategories: () => { categoryKey: string, categoryTitle: string }[],
};