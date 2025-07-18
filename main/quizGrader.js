/**
 * @typedef {Object} QuizQuestion
 * @property {number} id
 * @property {string} question
 * @property {{[key: string]: string}} options
 * @property {string} correctAnswer
 * @property {string} explanation
 * @property {string} topic
 * @property {string} [mathClass]
 */

/**
 * @typedef {Object} Quiz
 * @property {string[]} selectedClasses
 * @property {string} difficulty
 * @property {QuizQuestion[]} questions
 */

/**
 * @typedef {Object} QuizWrapper
 * @property {Quiz} quiz
 */

/**
 * Check student answer
 * @param {{ questions: Array<{ id: number, question: string, options: {[key: string]: string},
 * correctAnswer: string, explanation: string}>}} quiz - Quiz object containing questions, options, and correct answers
 * @param {Array<string>} studentAnswer
 * @returns {{ score: number, total: number, percentage: number, results:
 * Array<{ questionId: number, correct: boolean, studentAnswer: string, correctAnswer: string, explanation: string }>}}
 */
// Grade student responses against correct answers
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
        score: correct,
        total: questions.length,
        percentage: Math.round((correct / questions.length) * 100),
        results: results,
    };
}
