import { StudyProblemBase, StudySubject } from "../types";

const MAX = 12;

// TODO: 
// Record to File
// Decrease Review Problem Repeat Interval?
// Other Math Problem Types:
// Double digit addition/subtraction
// Powers & Roots
// Reduce Fractions
// Prime Factors

/** For division, question: product / a = b */
type MathProblemOperator = '*' | '+' | '-' | '/';

export type MathProblemType = StudyProblemBase<'math'> & {
    key: string,
    formTitle: string,
    question: string,
    questionPreview: string,
    a: number,
    b: number,
    operator: MathProblemOperator,
    correctAnswer: string,
    correctAnswerValue: number,
    correctAnswerStatement: string,
};


const getFormTitle = (operator: MathProblemOperator): string => {
    switch (operator) {
        case '*': return 'Multiplication';
        case '/': return 'Division';
        case '-': return 'Subtraction';
        case '+': return 'Addition';
        default: return 'Math';
    }
};


const calculateAnswer = ({ a, b, operator }: Pick<MathProblemType, 'operator' | 'a' | 'b'>): number => {
    switch (operator) {
        case '*': return a * b;
        case '/': return a / b;
        case '-': return a - b;
        case '+': return a + b;
        default: return 0;
    }
};

const calculateProblem = ({ a, b, operator }: Pick<MathProblemType, 'operator' | 'a' | 'b'>): MathProblemType => {

    const formTitle = getFormTitle(operator);

    if (operator === '/') {
        // product / a = b

        if (a === 0) { a = 1; }
        const product = calculateAnswer({ a, b, operator: '*' });

        const key = `${product} ${operator} ${a}`;
        const question = `What is ${product} ${operator} ${a}?`;
        const correctAnswer = calculateAnswer({ a: product, b: a, operator });
        const correctAnswerStatement = `${product} / ${a} = ${b}`;

        return { subjectKey: 'math', key, formTitle, question, questionPreview: question, a, b, operator, correctAnswer: correctAnswer + '', correctAnswerValue: correctAnswer, correctAnswerStatement };
    }

    const key = `${a} ${operator} ${b}`;
    const question = `What is ${a} ${operator} ${b}?`;
    const correctAnswer = calculateAnswer({ a, b, operator });
    const correctAnswerStatement = `${a} ${operator} ${b} = ${correctAnswer}`;

    return { subjectKey: 'math', key, formTitle, question, questionPreview: question, a, b, operator, correctAnswer: correctAnswer + '', correctAnswerValue: correctAnswer, correctAnswerStatement };
};

const getNewProblem = () => {
    const a = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
    const b = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX + 1));
    const operator =
        Math.random() < 0.1 ? '/'
            : Math.random() < 0.1 ? '-'
                : Math.random() < 0.3 ? '+'
                    : '*';

    const problem = calculateProblem({ a, b, operator });
    return problem;
};

const getWrongChoices = (problem: MathProblemType) => {
    const { a, b, operator } = problem;
    const wrongChoices = [...new Array(7)].map(() => Math.floor(calculateProblem({
        a: Math.floor(a + (3 - Math.random() * 5)),
        b: Math.floor(b + (3 - Math.random() * 5)),
        operator,
    }).correctAnswerValue)).filter(x => isFinite(x));
    return new Set(wrongChoices.map(x => x + ''));
};

const getReviewProblemSequence = (problem: MathProblemType): MathProblemType[] => {
    if (problem.operator === '/') {
        return [
            calculateProblem({ a: problem.a, b: problem.b, operator: '*' }),
            calculateProblem({ b: problem.a, a: problem.b, operator: '*' }),
            calculateProblem({ a: problem.a, b: problem.b, operator: '/' }),
            calculateProblem({ b: problem.a, a: problem.b, operator: '/' }),
        ];
    } else {
        const reviewProblems = [] as MathProblemType[];
        for (let i = problem.b - 2; i <= problem.b; i++) {
            if (i < -MAX) { continue; }
            if (i > MAX) { continue; }

            reviewProblems.push(calculateProblem({ a: problem.a, b: i, operator: problem.operator }));
        }
        return reviewProblems;
    }
};

const evaluateAnswer = (problem: MathProblemType, answerRaw: null | string) => {
    const answer = parseInt(answerRaw + '');

    const isCorrect = answer === problem.correctAnswerValue;

    if (isCorrect) {
        return {
            isCorrect,
        };
    }

    if (answerRaw === null) {
        return {
            isCorrect,
        };
    }

    if (isNaN(answer)) {
        return {
            isCorrect,
            responseMessage: `That's not even a number!`,
        };
    }

    return {
        isCorrect,
        responseMessage: `Incorrect ${answer}! ${problem.correctAnswerStatement}`,
    };
};

export const createMathSubject = (): StudySubject<MathProblemType, 'math'> => {
    return {
        subjectKey: 'math',
        getNewProblem,
        getWrongChoices,
        evaluateAnswer,
        getReviewProblemSequence,
    };
};