//@ts-check

/**
 * Format mathematical notation for KaTeX rendering
 * @param {string} text
 * @returns {string}
 */
function formatMathematicalNotation(text = "") {
    if (!text || typeof text !== "string") return text;

    let formatted = text;

    // Convert mathematical expressions to KaTeX format
    formatted = formatted
        // Exponents: x^3 → $x^3$, x^2 → $x^2$
        .replace(/([a-zA-Z])\^([0-9]+)/g, "$$$1^{$2}$$")

        // Subscripts: log_2 → $\log_2$
        .replace(/log_([0-9a-zA-Z]+)/g, "$\\log_{$1}$")

        // Clean up LaTeX backslashes (remove doubles)
        .replace(/\\\\(\w+)/g, "\\$1")

        // Trigonometric functions
        .replace(/\\?sin\b/g, "$\\sin$")
        .replace(/\\?cos\b/g, "$\\cos$")
        .replace(/\\?tan\b/g, "$\\tan$")
        .replace(/\\?csc\b/g, "$\\csc$")
        .replace(/\\?sec\b/g, "$\\sec$")
        .replace(/\\?cot\b/g, "$\\cot$")
        .replace(/\\?ln\b/g, "$\\ln$")

        // Mathematical symbols and functions
        .replace(/sqrt\(([^)]+)\)/g, "$\\sqrt{$1}$")
        .replace(/\\?sqrt\{([^}]+)\}/g, "$\\sqrt{$1}$")
        .replace(/\\?pi\b/g, "$\\pi$")
        .replace(/\bpi\b/g, "$\\pi$")
        .replace(/\\?infty/g, "$\\infty$")
        .replace(/infinity/g, "$\\infty$")
        .replace(/\\?pm/g, "$\\pm$")
        .replace(/\+\/-/g, "$\\pm$")
        .replace(/\\?leq/g, "$\\leq$")
        .replace(/\\?geq/g, "$\\geq$")
        .replace(/\\?neq/g, "$\\neq$")
        .replace(/<=/g, "$\\leq$")
        .replace(/>=/g, "$\\geq$")
        .replace(/!=/g, "$\\neq$")
        .replace(/degrees?/g, "$°$")

        // Greek letters
        .replace(/\\?theta\b/g, "$\\theta$")
        .replace(/\\?alpha\b/g, "$\\alpha$")
        .replace(/\\?beta\b/g, "$\\beta$")
        .replace(/\\?gamma\b/g, "$\\gamma$")
        .replace(/\\?delta\b/g, "$\\delta$")
        .replace(/\\?Delta\b/g, "$\\Delta$")
        .replace(/\\?omega\b/g, "$\\omega$")
        .replace(/\\?Omega\b/g, "$\\Omega$");

    // Format matrices for KaTeX
    formatted = formatMatricesKaTeX(formatted);

    // Clean up multiple $ signs
    formatted = formatted.replace(/\$+/g, "$");

    return formatted;
}

/**
 * Format matrix notation for KaTeX
 * @param {string} text
 * @returns {string}
 */
function formatMatricesKaTeX(text) {
    return text.replace(/\[([^\]]+)\]/g, (match, content) => {
        // Check if it contains semicolons (matrix notation)
        if (content.includes(";")) {
            const rows = content.split(";").map((/** @type {string} */ row) => row.trim());
            const matrixRows = rows
                .map((/** @type {string} */ row) => {
                    const elements = row.split(/\s+/).filter((el) => el);
                    return elements.join(" & ");
                })
                .join(" \\\\ ");

            return `$$\\begin{bmatrix} ${matrixRows} \\end{bmatrix}$$`;
        }

        // Not a matrix, return original
        return match;
    });
}

/**
 * Format a question object with KaTeX mathematical notation
 * @param {any} question
 * @returns {any}
 */
export function formatWithKaTeX(question = {}) {
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
            questions: quiz.quiz.questions.map((/** @type {any} */ question) => formatWithKaTeX(question)),
        },
    };
    return formattedQuiz;
}
