import { StudyProblemBase, StudySubject } from "../types";
import { getSpellingEntries } from "./spellingEntries";

const subjectKey = 'spelling';

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

    const getProblemFromWord = (word: string, startLength_override?: number, keySuffix: string = ''): null | SpellingProblemType => {
        const entry = spellingEntries.find(x => x.word === word);
        if (!entry) { return null; }

        const startLength = startLength_override ?? Math.max(1, Math.floor(word.length - 2 - word.length * Math.random()));
        const endLength = word.length - startLength;
        const revealPart = word.substr(0, startLength) + getUnderlines(endLength);
        const guessPart = getUnderlines(startLength) + word.substr(startLength);
        const wrongChoicesAll = entry.mispellings.map(x => {
            return getUnderlines(startLength) + x.substr(startLength);
        });
        // Don't include choices that are actually the real word, just split on a duplicate letter 
        const wrongChoices = wrongChoicesAll.filter(x => !word.endsWith(x.replace(/_/g, '')));

        const wordGroup = entry.wordGroup;

        return {
            subjectKey: 'spelling',
            key: word + ':' + startLength + keySuffix,
            formTitle: 'Spell',
            question: revealPart,
            questionPreview: word,
            questionPreviewTimeMs: 3000,
            correctAnswer: guessPart,
            word,
            wrongChoices,
            wordGroup,
        };
    };

    const getNewProblem = (selectedCategories): SpellingProblemType => {
        const randomEntry = spellingEntries[Math.floor(Math.random() * spellingEntries.length)];
        return getProblemFromWord(randomEntry.word)!;
    };

    return {
        subjectKey: 'spelling',
        subjectTitle: 'Spelling',
        getNewProblem,
        getWrongChoices: (p) => new Set(p.wrongChoices),
        evaluateAnswer: (p, answer) => ({ isCorrect: p.correctAnswer === answer, responseMessage: p.correctAnswer === answer ? undefined : `${p.word} = ${p.correctAnswer}` }),
        getReviewProblemSequence: (p) => [
            // Same word with decreasing start length: i.e: ___t, ___rt, __art, _tart, start
            ...[...new Array(p.word.length - 1)].map((x, i) => getProblemFromWord(p.word, p.word.length - 1 - i, 'decreasing')),
            // Same word with increasing start length: i.e: start, _tart, __art, ___rt, ___t
            // ...[...new Array(p.word.length - 1)].map((x, i) => getProblemFromWord(p.word, i +1)),
            // Similar words
            ...p.wordGroup.words.map(x => getProblemFromWord(x)).filter(x => x?.word !== p.word),
            // Finally the original problem again
            p,
        ].filter(x => x).map(x => x!),
        getCategories: () => [
            { subjectKey, categoryKey: 'words', categoryTitle: 'Words' },
        ],
    };
};