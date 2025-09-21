
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

const listeningUnit3: ListeningExercise[] = [
    { id: "u3e1", type: "typing", text: "The sixth sick sheikh's sixth sheep's sick." },
    { id: "u3e2", type: "mcq", text: "Surely Sylvia swims, shrieked Stephen.", options: ["Surely Sylvia swims, shrieked Stephen.", "Surely Steven swims, shrieked Sylvia.", "Surely Sylvia sings, shrieked Stephen."], answer: "Surely Sylvia swims, shrieked Stephen." },
    { id: "u3e3", type: "typing", text: "A big black bug bit a big black dog on his big black nose." },
];

const readingUnit4: ReadingSentence[] = [
    { unit: "Unit 4: At the Restaurant", text: "Could I see the menu, please?" },
    { unit: "Unit 4: At the Restaurant", text: "I would like to order the grilled chicken salad." },
    { unit: "Unit 4: At the Restaurant", text: "Can we have the check, please?" },
];

const listeningUnit4: ListeningExercise[] = [
    { id: "u4e1", type: "typing", text: "Are you ready to order?" },
    { id: "u4e2", type: "mcq", text: "The soup of the day is tomato basil.", options: ["The soup of the day is tomato basil.", "The special of the day is fish.", "The soup is very cold today."], answer: "The soup of the day is tomato basil." },
    { id: "u4e3", type: "typing", text: "Everything was delicious, thank you." },
];

const readingUnit5: ReadingSentence[] = [
    { unit: "Unit 5: Hobbies and Interests", text: "In my free time, I enjoy reading books and listening to music." },
    { unit: "Unit 5: Hobbies and Interests", text: "He plays soccer with his friends every weekend." },
    { unit: "Unit 5: Hobbies and Interests", text: "Her favorite hobby is painting landscapes." },
];

const listeningUnit5: ListeningExercise[] = [
    { id: "u5e1", type: "typing", text: "What do you like to do for fun?" },
    { id: "u5e2", type: "mcq", text: "I'm going to the cinema on Saturday.", options: ["I'm going to the museum on Saturday.", "I'm going to the cinema on Saturday.", "I'm going to the park on Sunday."], answer: "I'm going to the cinema on Saturday." },
    { id: "u5e3", type: "typing", text: "They often go hiking in the mountains." },
];

const readingUnit6: ReadingSentence[] = [
    { unit: "Unit 6: Travel and Directions", text: "Excuse me, how do I get to the train station?" },
    { unit: "Unit 6: Travel and Directions", text: "Our flight is scheduled to depart at ten o'clock." },
    { unit: "Unit 6: Travel and Directions", text: "You should take the second left and then go straight ahead." },
];

const listeningUnit6: ListeningExercise[] = [
    { id: "u6e1", type: "mcq", text: "Turn right at the next corner.", options: ["Turn left at the next corner.", "Go straight at the next corner.", "Turn right at the next corner."], answer: "Turn right at the next corner." },
    { id: "u6e2", type: "typing", text: "The museum is opposite the park." },
    { id: "u6e3", type: "typing", text: "We need to book a hotel for our vacation." },
];

const readingUnit7: ReadingSentence[] = [
    { unit: "Unit 7: Health and Wellness", text: "Eating a balanced diet is essential for good health." },
    { unit: "Unit 7: Health and Wellness", text: "Regular exercise can help reduce stress and improve your mood." },
    { unit: "Unit 7: Health and Wellness", text: "It is important to get at least eight hours of sleep every night." },
];

const listeningUnit7: ListeningExercise[] = [
    { id: "u7e1", type: "typing", text: "You should drink plenty of water throughout the day." },
    { id: "u7e2", type: "mcq", text: "The doctor recommended taking the medicine twice a day.", options: ["The doctor recommended taking the medicine twice a day.", "The nurse suggested taking a short walk.", "The medicine should be taken once a day."], answer: "The doctor recommended taking the medicine twice a day." },
    { id: "u7e3", type: "typing", text: "He has an appointment with the dentist tomorrow." },
];

const readingUnit8: ReadingSentence[] = [
    { unit: "Unit 8: Technology in Daily Life", text: "Smartphones have completely changed the way we communicate." },
    { unit: "Unit 8: Technology in Daily Life", text: "The internet provides access to a vast amount of information." },
    { unit: "Unit 8: Technology in Daily Life", text: "Artificial intelligence is becoming more integrated into our daily routines." },
];

const listeningUnit8: ListeningExercise[] = [
    { id: "u8e1", type: "typing", text: "Please charge your laptop before the meeting." },
    { id: "u8e2", type: "mcq", text: "She uses her tablet to read e-books and watch videos.", options: ["He uses his computer for gaming.", "She uses her tablet to read e-books and watch videos.", "They watch videos on the television."], answer: "She uses her tablet to read e-books and watch videos." },
    { id: "u8e3", type: "typing", text: "Could you please send me the file via email?" },
];

const readingUnit9: ReadingSentence[] = [
    { unit: "Unit 9: Nature and Environment", text: "Protecting our planet's natural resources is a global responsibility." },
    { unit: "Unit 9: Nature and Environment", text: "Recycling helps to reduce waste and conserve energy." },
    { unit: "Unit 9: Nature and Environment", text: "Many species are endangered due to habitat loss and climate change." },
];

const listeningUnit9: ListeningExercise[] = [
    { id: "u9e1", type: "typing", text: "We went for a long hike in the forest on Saturday." },
    { id: "u9e2", type: "mcq", text: "The government announced a new policy to combat pollution.", options: ["The government announced a new policy to combat pollution.", "The company started a new recycling program.", "The school organized a tree-planting event."], answer: "The government announced a new policy to combat pollution." },
    { id: "u9e3", type: "typing", text: "Planting more trees can help improve air quality." },
];

const readingUnit10: ReadingSentence[] = [
    { unit: "Unit 10: Shopping and Fashion", text: "I'm looking for a new pair of shoes for the party." },
    { unit: "Unit 10: Shopping and Fashion", text: "This shirt is on sale for twenty percent off." },
    { unit: "Unit 10: Shopping and Fashion", text: "Do you have this dress in a smaller size?" },
];

const listeningUnit10: ListeningExercise[] = [
    { id: "u10e1", type: "typing", text: "I would like to return this item, please." },
    { id: "u10e2", type: "mcq", text: "The fitting rooms are on the left.", options: ["The cashier is on the right.", "The fitting rooms are on the left.", "The exit is straight ahead."], answer: "The fitting rooms are on the left." },
    { id: "u10e3", type: "typing", text: "You can pay with a credit card or cash." },
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
            - The sixth sick sheikh's sixth sheep's sick.
            - A big black bug bit a big black dog on his big black nose.
        `,
        activities: {
            reading: readingUnit3,
            listening: listeningUnit3,
        }
    },
    {
        id: "unit4",
        unit: "Unit 4: At the Restaurant",
        content: `
            - Could I see the menu, please?
            - I would like to order the grilled chicken salad.
            - Can we have the check, please?
            - Are you ready to order?
            - The soup of the day is tomato basil.
            - Everything was delicious, thank you.
        `,
        activities: {
            reading: readingUnit4,
            listening: listeningUnit4,
        }
    },
    {
        id: "unit5",
        unit: "Unit 5: Hobbies and Interests",
        content: `
            - In my free time, I enjoy reading books and listening to music.
            - He plays soccer with his friends every weekend.
            - Her favorite hobby is painting landscapes.
            - What do you like to do for fun?
            - I'm going to the cinema on Saturday.
            - They often go hiking in the mountains.
        `,
        activities: {
            reading: readingUnit5,
            listening: listeningUnit5,
        }
    },
    {
        id: "unit6",
        unit: "Unit 6: Travel and Directions",
        content: `
            - Excuse me, how do I get to the train station?
            - Our flight is scheduled to depart at ten o'clock.
            - You should take the second left and then go straight ahead.
            - Turn right at the next corner.
            - The museum is opposite the park.
            - We need to book a hotel for our vacation.
        `,
        activities: {
            reading: readingUnit6,
            listening: listeningUnit6,
        }
    },
    {
        id: "unit7",
        unit: "Unit 7: Health and Wellness",
        content: `
            - Eating a balanced diet is essential for good health.
            - Regular exercise can help reduce stress and improve your mood.
            - It is important to get at least eight hours of sleep every night.
            - You should drink plenty of water throughout the day.
            - He has an appointment with the dentist tomorrow.
        `,
        activities: {
            reading: readingUnit7,
            listening: listeningUnit7,
        }
    },
    {
        id: "unit8",
        unit: "Unit 8: Technology in Daily Life",
        content: `
            - Smartphones have completely changed the way we communicate.
            - The internet provides access to a vast amount of information.
            - Artificial intelligence is becoming more integrated into our daily routines.
            - Please charge your laptop before the meeting.
            - Could you please send me the file via email?
        `,
        activities: {
            reading: readingUnit8,
            listening: listeningUnit8,
        }
    },
    {
        id: "unit9",
        unit: "Unit 9: Nature and Environment",
        content: `
            - Protecting our planet's natural resources is a global responsibility.
            - Recycling helps to reduce waste and conserve energy.
            - Many species are endangered due to habitat loss and climate change.
            - We went for a long hike in the forest on Saturday.
            - Planting more trees can help improve air quality.
        `,
        activities: {
            reading: readingUnit9,
            listening: listeningUnit9,
        }
    },
    {
        id: "unit10",
        unit: "Unit 10: Shopping and Fashion",
        content: `
            - I'm looking for a new pair of shoes for the party.
            - This shirt is on sale for twenty percent off.
            - Do you have this dress in a smaller size?
            - I would like to return this item, please.
            - You can pay with a credit card or cash.
        `,
        activities: {
            reading: readingUnit10,
            listening: listeningUnit10,
        }
    },
    {
        id: "unit11",
        unit: "Unit 11: User-Created Lesson",
        content: ``,
        activities: {
            reading: [],
            listening: [],
        }
    }
];
