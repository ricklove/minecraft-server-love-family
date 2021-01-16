export type StudyProblemBase<TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    key: string,
    formTitle: string,
    question: string,
    questionPreview: string,
    correctAnswer: string,
};

export type StudySubject<TProblem extends StudyProblemBase<TSubjectKey>, TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    getNewProblem: () => TProblem,
    getWrongChoices: (problem: TProblem) => Set<string>,
    evaluateAnswer: (problem: TProblem, answer: string | null | undefined) => { isCorrect: boolean, responseMessage?: string },
    getReviewProblemSequence: (problem: TProblem) => TProblem[],
    getCategories: () => { subjectKey: string, categoryKey: string, categoryTitle: string }[],
};