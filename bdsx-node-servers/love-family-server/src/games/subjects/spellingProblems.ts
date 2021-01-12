import { StudyProblemBase, StudySubject } from "../types";
import { getSpellingEntries } from "./spellingEntries";

export type SpellingProblemType = StudyProblemBase<'spelling'> & {
    word: string,
    wrongChoices: string[],
    wordGroup: { words: string[] };
};

const getUnderlines = (length: number) => [...new Array(length)].map(x => '_').join('');

export const createSpellingSubject = (): StudySubject<SpellingProblemType, 'spelling'> => {

    const spellingEntries = getSpellingEntries()
        .slice(0, 2500)
        ;

    const getProblemFromWord = (word: string): null | SpellingProblemType => {
        const entry = spellingEntries.find(x => x.word === word);
        if (!entry) { return null; }

        const startLength = Math.max(1, Math.floor(word.length - 2 - word.length * Math.random()));
        const endLength = word.length - startLength;
        const revealPart = word.substr(0, startLength) + getUnderlines(endLength);
        const guessPart = getUnderlines(startLength) + word.substr(startLength);
        const wrongChoices = entry.mispellings.map(x => {
            return getUnderlines(startLength) + x.substr(x.length - endLength);
        });
        const wordGroup = entry.wordGroup;

        return {
            subjectKey: 'spelling',
            key: word,
            formTitle: 'Spell',
            question: revealPart,
            questionPreview: word,
            correctAnswer: guessPart,
            word,
            wrongChoices,
            wordGroup,
        };
    };

    const getNewProblem = (): SpellingProblemType => {
        const randomEntry = spellingEntries[Math.floor(Math.random() * spellingEntries.length)];
        return getProblemFromWord(randomEntry.word)!;
    };

    return {
        subjectKey: 'spelling',
        getNewProblem,
        getWrongChoices: (p) => new Set(p.wrongChoices),
        evaluateAnswer: (p, answer) => ({ isCorrect: p.correctAnswer === answer }),
        getReviewProblemSequence: (p) => p.wordGroup.words.map(x => getProblemFromWord(x)).filter(x => x).map(x => x!),
    };
};