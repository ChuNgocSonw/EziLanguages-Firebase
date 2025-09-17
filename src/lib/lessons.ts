
export interface ReadingSentence {
    unit: string;
    text: string;
}

interface BaseExercise {
    id: string;
    text: string;
}
interface TypingExercise extends BaseExercise {
    type: 'typing';
}
interface McqExercise extends BaseExercise {
    type: 'mcq';
    options: string[];
    answer: string;
}
export type ListeningExercise = TypingExercise | McqExercise;

export interface Lesson {
    id: string;
    unit: string;
    content: string; // Combined content for the AI
    activities: {
        reading?: ReadingSentence[];
        listening?: ListeningExercise[];
    }
}

const readingUnit1: ReadingSentence[] = [
    { unit: "Unit 1: Greetings", text: "Hello, how are you doing today?" },
    { unit: "Unit 1: Greetings", text: "It's a pleasure to meet you." },
    { unit: "Unit 1: Greetings", text: "Good morning, I hope you have a wonderful day." },
];

const listeningUnit1: ListeningExercise[] = [
    { id: "u1e1", type: "typing", text: "Hello, how are you?" },
    { id: "u1e2", type: "mcq", text: "My name is John.", options: ["My name is John.", "My name is Jane.", "His name is John."], answer: "My name is John." },
    { id: "u1e3", type: "typing", text: "It is a pleasure to meet you." },
];

const readingUnit2: ReadingSentence[] = [
    { unit: "Unit 2: Daily Activities", text: "I usually wake up early in the morning." },
    { unit: "Unit 2: Daily Activities", text: "She is currently working on a very important project." },
    { unit: "Unit 2: Daily Activities", text: "They are going to the supermarket to buy some groceries." },
];

const listeningUnit2: ListeningExercise[] = [
    { id: "u2e1", type: "mcq", text: "The cat is sleeping on the sofa.", options: ["The dog is sleeping on the sofa.", "The cat is sleeping on the sofa.", "The cat is playing on the sofa."], answer: "The cat is sleeping on the sofa." },
    { id: "u2e2", type: "typing", text: "There is a book on the table." },
    { id: "u2e3", type: "mcq", text: "She opened the window to get some fresh air.", options: ["She closed the window.", "He opened the window.", "She opened the window to get some fresh air."], answer: "She opened the window to get some fresh air." },
];

const readingUnit3: ReadingSentence[] = [
    { unit: "Unit 3: Complex Sounds", text: "The quick brown fox jumps over the lazy dog near the river bank." },
    { unit: "Unit 3: Complex Sounds", text: "She sells seashells by the seashore." },
    { unit: "Unit 3: Complex Sounds", text: "Peter Piper picked a peck of pickled peppers." },
];


export const lessonsData: Lesson[] = [
    {
        id: "unit1",
        unit: "Unit 1: Basic Greetings",
        content: `
            - Hello, how are you doing today?
            - It's a pleasure to meet you.
            - Good morning, I hope you have a wonderful day.
            - My name is John.
        `,
        activities: {
            reading: readingUnit1,
            listening: listeningUnit1
        }
    },
    {
        id: "unit2",
        unit: "Unit 2: Everyday Objects & Activities",
        content: `
            - I usually wake up early in the morning.
            - She is currently working on a very important project.
            - They are going to the supermarket to buy some groceries.
            - The cat is sleeping on the sofa.
            - There is a book on the table.
            - She opened the window to get some fresh air.
        `,
        activities: {
            reading: readingUnit2,
            listening: listeningUnit2,
        }
    },
    {
        id: "unit3",
        unit: "Unit 3: Complex Sounds",
        content: `
            - The quick brown fox jumps over the lazy dog near the river bank.
            - She sells seashells by the seashore.
            - Peter Piper picked a peck of pickled peppers.
        `,
        activities: {
            reading: readingUnit3,
            // No listening exercises for this unit yet
        }
    }
];
