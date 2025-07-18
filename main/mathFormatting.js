//@ts-check
/**
 * Convert mathematical notation to LaTeX format for MathJax rendering
 * @param {string} text
 * @returns {string}
 */
export function formatMathematicalNotation(text = "") {
    if (!text || typeof text !== "string") return text;
    let formatted = text;
    formatted = formatted.replace(/([a-zA-Z])\^([0-9]+)/g, "$1^{$2}").replace(/([a-zA-Z])\^\(([^)]+)\)/g, "$1^{$2}");
    formatted = formatted.replace(/log_([0-9a-zA-Z]+)/g, "log_{$1}").replace(/([a-zA-Z])_([0-9a-zA-Z]+)/g, "$1_{$2}");
    formatted = formatted
        .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
        .replace(/sqrt([a-zA-Z0-9]+)/g, "\\sqrt{$1}")
        .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}")
        .replace(/\bpi\b/g, "\\pi")
        .replace(/\btheta\b/g, "\\theta")
        .replace(/\balpha\b/g, "\\alpha")
        .replace(/\bbeta\b/g, "\\beta")
        .replace(/\bgamma\b/g, "\\gamma")
        .replace(/\bdelta\b/g, "\\delta")
        .replace(/\bDelta\b/g, "\\Delta")
        .replace(/\bomega\b/g, "\\omega")
        .replace(/\bOmega\b/g, "\\Omega")
        .replace(/\+\/-/g, "\\pm")
        .replace(/\+-/g, "\\pm")
        .replace(/<=/g, "\\leq")
        .replace(/>=/g, "\\geq")
        .replace(/!=/g, "\\neq")
        .replace(/infinity/g, "\\infty")
        .replace(/degrees?/g, "^\\circ")
        .replace(/deg\b/g, "^\\circ")
        .replace(/\bsin\b/g, "\\sin")
        .replace(/\bcos\b/g, "\\cos")
        .replace(/\btan\b/g, "\\tan")
        .replace(/\bcsc\b/g, "\\csc")
        .replace(/\bsec\b/g, "\\sec")
        .replace(/\bcot\b/g, "\\cot");
    return formatted;
}

/**
 * Format a question object with LaTeX mathematical notation
 * @param {any} question
 * @returns {any}
 */
export function formatQuestionMath(question = {}) {
    if (!question || typeof question !== "object") return question;
    const formatted = { ...question };

    if (formatted.question) {
        formatted.question = formatMathematicalNotation(formatted.question);
    }
    if (formatted.explanation) {
        formatted.explanation = formatMathematicalNotation(formatted.explanation);
    }
    if (formatted.options && typeof formatted.options === "object") {
        formatted.options = {};
        for (const [key, value] of Object.entries(question.options)) {
            formatted.options[key] = formatMathematicalNotation(value);
        }
    }
    return formatted;
}

/**
 * Format mathematical notation in an entire quiz
 * @param {any} quiz
 * @returns {any}
 */
export function formatQuizMath(quiz) {
    if (!quiz || !quiz.quiz || !quiz.quiz.questions) return quiz;
    const formattedQuiz = {
        ...quiz,
        quiz: {
            ...quiz.quiz,
            questions: quiz.quiz.questions.map((/** @type {any} */ question) => formatQuestionMath(question)),
        },
    };
    return formattedQuiz;
}
