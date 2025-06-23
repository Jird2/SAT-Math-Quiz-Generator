// @ts-check
import OpenAI from "openai";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
/**
 * @param {"9th Grade" | "10th Grade" | "11th Grade" | "12th Grade"} gradelevel
 * @param {number} numquestions
 * @param {"easy" | "medium" | "hard"} difficulty
 */
//SAT/ACT Math Topics by Grade Level
/**
 * @type {{[key: string]: string[]}}
 */
const mathTopics = {
    "9th Grade": ["Algebra", "Geometry", "Statistics", "Probability", "Functions"],
    "10th Grade": ["Linear Equations", "Quadratic Functions", "Polynomials", "Rational Expressions"],
    "11th Grade": ["Trigonometry", "Complex Numbers", "Sequences and Series", "Exponential Functions"],
    "12th Grade": ["Calculus Basics", "Vectors", "Matrices", "Conic Sections"],
};
function isValidGradeLevel(grade = "") {
    return Object.prototype.hasOwnProperty.call(mathTopics, grade);
}
function isValidDifficulty(difficulty = "") {
    return ["easy", "medium", "hard"].includes(difficulty);
}
function isValidNumQuestions(num = 0) {
    return Number.isInteger(num) && num > 0 && num <= 10; // reasonable limit for a quiz
}

export async function generateQuiz(gradelevel = "", numquestions = 0, difficulty = "") {
    try {
        if (!isValidGradeLevel(gradelevel)) {
            throw new Error("Invalid grade level. Must be '9th Grade', '10th Grade', '11th Grade', or '12th Grade'.");
        }
        if (isValidNumQuestions(numquestions) === false) {
            throw new Error("Number of questions must be a positive number between 1 and 10.");
        }
        if (!isValidDifficulty(difficulty)) {
            throw new Error("Difficulty must be 'easy', 'medium', or 'hard'.");
        }
        // Get the topics for the specified grade level
        const topics = mathTopics[gradelevel];
        if (!topics || topics.length === 0) {
            throw new Error("Invalid grade level or no topics available.");
        }
        const prompt = `Generate a ${difficulty} math quiz for ${gradelevel} students preparing for the SAT/ACT with ${numquestions} questions. 
    Include the following topics: ${topics.join(", ")}. 
    Each question should have 4 answer choices, with one correct answer. 
    Format the output as an array of objects, each containing a question, an array of answer choices, and the index of the correct answer.
    Requirements: 
    Each question MUST be SAT/ACT formatted.
    Provide 4 multiple choice answers for each question.
    Include the correct answer.
    Make questions relevant to the grade level and difficulty specified.
    Example output:
    Format your response as a JSON object like this for example:
    {
  "quiz": {
    "gradeLevel": ${gradelevel},
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": 1,
        "question": "Question text here",
        "options": {
          "A": "Option A",
          "B": "Option B", 
          "C": "Option C",
          "D": "Option D"
        },
        "correctAnswer": "A",
        "explanation": "Step-by-step solution",
        "topic": "Topic name"
      }
    ]
  }
}`;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert math teacher specializing in SAT/ACT preparation. Create high-quality, grade-appropriate practice questions.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error("No content returned from OpenAI API.");
        }
        const data = JSON.parse(content);
        return data;
    } catch (e) {
        console.error("Error generating quiz:", e);
        throw e;
    }
}
/**
 * Check student answer
 * @param {{ questions: Array<{ id: number, question: string, options: Object, correctAnswer: string, explanation?: string, topic?: string }> }} quiz - Quiz object containing questions, options, and correct answers
 * @param {Array<string>} studentAnswer - Array of selected answers
 * @returns {{ score: number, total: number, percentage: number, results: Array<{ questionId: number, correct: boolean, studentAnswer: string, correctAnswer: string, explanation: string }> }} Returns an object with the question, student's answer, and whether it is correct
 */
export function gradeQuiz(quiz, studentAnswer) {
    const questions = quiz.questions || [];
    let correct = 0;
    /** @type {Array<{ questionId: number, correct: boolean, studentAnswer: string, correctAnswer: string, explanation: string }>} */
    const results = [];

    questions.forEach((question, index) => {
        const answer = studentAnswer[index];
        const isCorrect = answer === question.correctAnswer;
        if (isCorrect) {
            correct++;
        }
        results.push({
            questionId: question.id,
            correct: isCorrect,
            studentAnswer: answer,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "No explanation provided.",
        });
    });

    return {
        // Regular return, not await
        score: correct,
        total: questions.length,
        percentage: Math.round((correct / questions.length) * 100),
        results: results,
    };
}
