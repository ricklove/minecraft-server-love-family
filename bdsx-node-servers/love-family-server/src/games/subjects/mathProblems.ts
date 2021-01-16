import { StudyProblemBase, StudySubject } from "../types";

const subjectKey = 'math';
const MAX_MULTIPLICATION = 12;

/** For division, question: product / a = b */
type MathProblemOperator = '*' | '+' | '-' | '/' | '^';
const mathCategories = [
    { subjectKey, categoryKey: '+', categoryTitle: 'Addition', },
    { subjectKey, categoryKey: '-', categoryTitle: 'Subtraction', },
    { subjectKey, categoryKey: '*', categoryTitle: 'Multiplication', },
    { subjectKey, categoryKey: '/', categoryTitle: 'Division', },
    { subjectKey, categoryKey: '^', categoryTitle: 'Powers', },
];

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
        case '^': return 'Powers';
        default: return 'Math';
    }
};


const calculateAnswer = ({ x, y, operator }: { x: number, y: number, operator: MathProblemOperator }): number => {
    switch (operator) {
        case '*': return x * y;
        case '/': return x / y;
        case '-': return x - y;
        case '+': return x + y;
        case '^': return Math.pow(x, y);
        default: return 0;
    }
};

const calculateProblem = ({ x, y, operator }: { x: number, y: number, operator: MathProblemOperator }): MathProblemType => {

    const formTitle = getFormTitle(operator);

    if (operator === '/') {
        // product / a = b

        if (x === 0) { x = 1; }
        const product = calculateAnswer({ x, y, operator: '*' });

        const key = `${product} ${operator} ${x}`;
        const question = `What is ${product} ${operator} ${x}?`;
        const correctAnswer = calculateAnswer({ x: product, y: x, operator });
        const correctAnswerStatement = `${product} / ${x} = ${y}`;

        return { subjectKey: 'math', key, formTitle, question, questionPreview: question, a: x, b: y, operator, correctAnswer: correctAnswer + '', correctAnswerValue: correctAnswer, correctAnswerStatement };
    }

    const key = `${x} ${operator} ${y}`;
    const question = `What is ${x} ${operator} ${y}?`;
    const correctAnswer = calculateAnswer({ x, y, operator });
    const correctAnswerStatement = `${x} ${operator} ${y} = ${correctAnswer}`;

    return { subjectKey: 'math', key, formTitle, question, questionPreview: question, a: x, b: y, operator, correctAnswer: correctAnswer + '', correctAnswerValue: correctAnswer, correctAnswerStatement };
};

const getNewProblem = () => {
    const operator =
        Math.random() < 0.1 ? '^'
            : Math.random() < 0.1 ? '/'
                : Math.random() < 0.1 ? '-'
                    : Math.random() < 0.3 ? '+'
                        : '*';
    if (operator === '^') {
        const a = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX_MULTIPLICATION + 1));
        const b = a > 3 ? 2
            : Math.floor(Math.random() * (3 + 1));

        const problem = calculateProblem({ x: a, y: b, operator });
        return problem;
    }

    const a = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX_MULTIPLICATION + 1));
    const b = (Math.random() < 0.1 ? -1 : 1) * Math.floor(Math.random() * (MAX_MULTIPLICATION + 1));

    const problem = calculateProblem({ x: a, y: b, operator });
    return problem;
};

const getWrongChoices = (problem: MathProblemType) => {
    const { a, b, operator } = problem;
    const wrongChoices = [...new Array(7)].map(() => Math.floor(calculateProblem({
        x: Math.floor(a + (3 - Math.random() * 5)),
        y: operator === '^' && b === 0 ? 1
            : operator === '^' ? b
                : Math.floor(b + (3 - Math.random() * 5)),
        operator,
    }).correctAnswerValue)).filter(x => isFinite(x));
    return new Set(wrongChoices.map(x => x + ''));
};

const getReviewProblemSequence = (problem: MathProblemType): MathProblemType[] => {
    if (problem.operator === '^') {
        return [
            calculateProblem({ x: problem.a, y: problem.a, operator: '*' }),
            calculateProblem({ x: problem.a, y: 2, operator: '^' }),
            problem,
        ];
    }

    if (problem.operator === '/') {
        return [
            calculateProblem({ x: problem.a, y: problem.b, operator: '*' }),
            calculateProblem({ x: problem.b, y: problem.a, operator: '*' }),
            calculateProblem({ x: problem.a, y: problem.b, operator: '/' }),
            calculateProblem({ x: problem.b, y: problem.a, operator: '/' }),
        ];
    }

    const reviewProblems = [] as MathProblemType[];
    for (let i = problem.b - 2; i <= problem.b; i++) {
        if (i < -MAX_MULTIPLICATION) { continue; }
        if (i > MAX_MULTIPLICATION) { continue; }

        reviewProblems.push(calculateProblem({ x: problem.a, y: i, operator: problem.operator }));
    }
    return reviewProblems;

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
        subjectKey,
        getNewProblem,
        getWrongChoices,
        evaluateAnswer,
        getReviewProblemSequence,
        getCategories: () => mathCategories,
    };
};