export type StudyProblemBase<TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    key: string,
    formTitle: string,
    question: string,
    questionPreview?: string,
    questionPreviewTimeMs?: number,
    questionPreviewChat?: string,
    questionPreviewChatTimeMs?: number,
    correctAnswer: string,
};

export type StudySubject<TProblem extends StudyProblemBase<TSubjectKey>, TSubjectKey extends string> = {
    subjectKey: TSubjectKey,
    subjectTitle: string,
    getNewProblem: (selectedCategories: { categoryKey: string }[]) => TProblem,
    getWrongChoices: (problem: TProblem) => Set<string>,
    evaluateAnswer: (problem: TProblem, answer: string | null | undefined) => { isCorrect: boolean, responseMessage?: string },
    getReviewProblemSequence: (problem: TProblem) => TProblem[],
    getCategories: () => { categoryKey: string, categoryTitle: string }[],
};