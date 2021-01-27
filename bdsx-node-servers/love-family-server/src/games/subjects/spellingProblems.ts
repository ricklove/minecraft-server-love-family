import { StudyProblemBase, StudySubject } from "../types";
import { getSpellingEntries } from "./spellingEntries";

const subjectKey = 'spelling';
type CategoryBaseKey = 'normal' | 'chat-only' | 'next-letter';

const toStringCategoryKey = (categoryBaseKey: CategoryBaseKey, level: number): string => {
    return `${categoryBaseKey}:${level}`;
}
const parseCategoryKey = (categoryKey: string): { categoryBaseKey: CategoryBaseKey, level: number } => {
    const [categoryBaseKey, level] = categoryKey.split(':');
    return {
        categoryBaseKey: categoryBaseKey as CategoryBaseKey,
        level: parseInt(level, 10),
    };
}

export type SpellingProblemType = StudyProblemBase<'spelling'> & {
    categoryBaseKey: CategoryBaseKey,
    levelIndex: number,
    word: string,
    wrongChoices: string[],
    wordGroup: { words: string[] };
};

const createLevels = (entries: ReturnType<typeof getSpellingEntries>, levelCount = 5) => {
    const levelSize = Math.ceil(entries.length / levelCount);
    const levelEntries = [...new Array(levelCount)].map((_, iLevel) => entries.slice(iLevel * levelSize, (iLevel + 1) * levelSize));
    return levelEntries.map((x, iLevel) => {
        return {
            levelIndex: iLevel,
            level: iLevel + 1,
            entries: x,
        };
    });
};

const getUnderlines = (length: number) => [...new Array(length)].map(x => '_').join('');

export const createSpellingSubject = (): StudySubject<SpellingProblemType, 'spelling'> => {

    const spellingEntries = getSpellingEntries();
    const levels = createLevels(spellingEntries);

    const getProblemFromWord = (word: string, categoryBaseKey: CategoryBaseKey, levelIndex: number, startLength_override?: number, keySuffix: string = ''): null | SpellingProblemType => {
        const entry = spellingEntries.find(x => x.word === word);
        if (!entry) { return null; }

        const startLength = startLength_override ?? Math.max(1, Math.floor(word.length - 2 - word.length * Math.random()));
        const endLength = word.length - startLength;
        const revealPart = word.substr(0, startLength) + getUnderlines(endLength);

        const getChoices = () => {

            if (categoryBaseKey === 'next-letter') {
                const nextLetter = word[startLength];
                const nextLetterWrongChoices = entry.mispellings.map(x => {
                    return x[startLength];
                });

                return {
                    correctAnswer: nextLetter,
                    wrongAnswers: nextLetterWrongChoices,
                };
            }

            const guessPart = getUnderlines(startLength) + word.substr(startLength);
            const wrongChoicesAll = entry.mispellings.map(x => {
                return getUnderlines(startLength) + x.substr(startLength);
            });
            // Don't include choices that are actually the real word, just split on a duplicate letter 
            const wrongChoices = wrongChoicesAll.filter(x => !word.endsWith(x.replace(/_/g, '')));

            return {
                correctAnswer: guessPart,
                wrongAnswers: wrongChoices,
            };
        };

        const {
            correctAnswer,
            wrongAnswers,
        } = getChoices();


        const wordGroup = entry.wordGroup;

        return {
            subjectKey: 'spelling',
            categoryBaseKey,
            levelIndex,
            key: word + ':' + startLength + keySuffix,
            formTitle: 'Spell',
            question: revealPart,
            questionPreview: categoryBaseKey === 'chat-only' || categoryBaseKey === 'next-letter' ? undefined : word,
            questionPreviewTimeMs: 3000,
            questionPreviewChat: word,
            questionPreviewChatTimeMs: 0,
            correctAnswer,
            word,
            wrongChoices: wrongAnswers,
            wordGroup,
        };
    };

    const getNewProblem = (selectedCategories: { categoryKey: string }[]): SpellingProblemType => {
        const randomSelectedCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)].categoryKey ?? 'normal:1';
        const { categoryBaseKey, level } = parseCategoryKey(randomSelectedCategory);
        const levelEntries = levels[level - 1].entries;
        const randomEntry = levelEntries[Math.floor(Math.random() * levelEntries.length)];
        return getProblemFromWord(randomEntry.word, (categoryBaseKey || 'normal') as CategoryBaseKey, level - 1)!;
    };

    return {
        subjectKey: 'spelling',
        subjectTitle: 'Spelling',
        getNewProblem,
        getWrongChoices: (p) => new Set(p.wrongChoices),
        evaluateAnswer: (p, answer) => ({ isCorrect: p.correctAnswer === answer, responseMessage: p.correctAnswer === answer ? undefined : `${p.word} = ${p.correctAnswer}` }),
        getReviewProblemSequence: (p) => [
            // Same word with decreasing start length: i.e: ___t, ___rt, __art, _tart, start
            ...[...new Array(p.word.length - 1)].map((x, i) => getProblemFromWord(p.word, p.categoryBaseKey, p.levelIndex, p.word.length - 1 - i, 'decreasing')),
            // Same word letter by letter
            ...[...new Array(p.word.length)].map((x, i) => getProblemFromWord(p.word, 'next-letter', p.levelIndex, i, 'next-letter')),
            // ...[...new Array(p.word.length - 1)].map((x, i) => getProblemFromWord(p.word, i +1)),
            // Similar words
            ...p.wordGroup.words.map(x => getProblemFromWord(x, p.categoryBaseKey, p.levelIndex)).filter(x => x?.word !== p.word),
            // Finally the original problem again
            p,
        ].filter(x => x).map(x => x!),
        getCategories: () => [
            // ...levels.map(l => ({ subjectKey, categoryKey: 'normal', categoryTitle: `Words: Level ${l.level}` })),
            ...levels.map(l => ({ subjectKey, categoryKey: toStringCategoryKey('chat-only', l.level), categoryTitle: `Level ${l.level} (speech)` })),
        ],

        // { subjectKey, categoryKey: 'chat-only', categoryTitle: `Words (Chat Speech)` },
        //
    };
};