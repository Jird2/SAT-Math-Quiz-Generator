// @ts-check
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import JSON5 from "json5";
import dotenv from "dotenv";
import { MathQuestionValidator } from "./quizvalidator.js";
dotenv.config();
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Utility functions for ID generation and content processing
function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Extract JSON from AI response that may contain thinking/reasoning text
 * @param {string} content - Raw content from AI
 * @returns {string} Extracted JSON content
 */
function extractJSONFromResponse(content) {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Look for JSON object that starts with { and contains "quiz"
    const jsonPatterns = [/\{[\s\S]*?"quiz"[\s\S]*?\}(?:\s*$)/, /\{(?:[^{}]|{[^{}]*})*"quiz"(?:[^{}]|{[^{}]*})*\}/, /\{[\s\S]*"quiz"[\s\S]*\}/];

    for (const pattern of jsonPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
            console.log("Found JSON pattern in response");
            return match[0].trim();
        }
    }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = cleaned.substring(firstBrace, lastBrace + 1);
        if (candidate.includes('"quiz"')) {
            console.log("Extracted JSON by brace boundaries");
            return candidate;
        }
    }
    const quizKeyword = cleaned.indexOf('"quiz"');
    if (quizKeyword !== -1) {
        // Find the opening brace before "quiz"
        let startBrace = -1;
        for (let i = quizKeyword; i >= 0; i--) {
            if (cleaned[i] === "{") {
                startBrace = i;
                break;
            }
        }

        if (startBrace !== -1) {
            // Find the matching closing brace
            let braceCount = 0;
            let endBrace = -1;
            for (let i = startBrace; i < cleaned.length; i++) {
                if (cleaned[i] === "{") braceCount++;
                if (cleaned[i] === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                        endBrace = i;
                        break;
                    }
                }
            }

            if (endBrace !== -1) {
                console.log("Extracted JSON by quiz keyword search");
                return cleaned.substring(startBrace, endBrace + 1);
            }
        }
    }
    console.log("Could not extract JSON, returning original content");
    return cleaned;
}

/**
 * Sanitize and fix JSON content before parsing
 * @param {string} content - Raw content from AI (already extracted)
 * @returns {string} Sanitized JSON content
 */
function sanitizeJSONContent(content) {
    let cleaned = content.trim();
    // Fix common JSON issues in explanation strings
    try {
        const lines = cleaned.split("\n");
        const fixedLines = [];
        let inString = false;
        let stringDelimiter = "";
        let currentLine = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let processedLine = "";

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const prevChar = j > 0 ? line[j - 1] : "";

                if (!inString) {
                    if (char === '"' && prevChar !== "\\") {
                        inString = true;
                        stringDelimiter = '"';
                        processedLine += char;
                    } else {
                        processedLine += char;
                    }
                } else {
                    // We're inside a string
                    if (char === stringDelimiter && prevChar !== "\\") {
                        inString = false;
                        stringDelimiter = "";
                        processedLine += char;
                    } else if (char === '"' && prevChar !== "\\") {
                        processedLine += '\\"';
                    } else if (char === "\\" && j + 1 < line.length && line[j + 1] !== '"' && line[j + 1] !== "\\" && line[j + 1] !== "n" && line[j + 1] !== "t") {
                        processedLine += "\\\\";
                    } else {
                        processedLine += char;
                    }
                }
            }

            if (inString && i < lines.length - 1) {
                // We're in a multi-line string - add escaped newline
                processedLine += "\\n";
            }

            fixedLines.push(processedLine);
        }

        cleaned = fixedLines.join("\n");
    } catch (error) {
        console.log("Line-by-line processing failed, trying regex approach");
        cleaned = cleaned
            .replace(/"explanation":\s*"([^"]*)"([^"]*)"([^"]*)"(?=\s*[,}])/g, '"explanation": "$1\\"$2\\"$3"')
            .replace(/"question":\s*"([^"]*)"([^"]*)"([^"]*)"(?=\s*[,}])/g, '"question": "$1\\"$2\\"$3"')
            .replace(/("(?:explanation|question)":\s*"[^"]*)\n([^"]*")/g, "$1\\n$2")
            .replace(/("(?:explanation|question)":\s*"[^"]*(?:\\n[^"]*)*)\n\n+([^"]*")/g, "$1\\n\\n$2")
            .replace(/\t/g, "\\t")
            .replace(/,(\s*[}\]])/g, "$1");
    }

    return cleaned;
}

/**
 * @param {string} content - Raw content to parse
 * @returns {any} Parsed JSON object
 */

// JSON parsing with multiple fallback strategies
function parseJSONWithFallbacks(content) {
    const extracted = extractJSONFromResponse(content);
    const sanitized = sanitizeJSONContent(extracted);
    try {
        const data = JSON.parse(sanitized);
        console.log("Successfully parsed with JSON.parse");
        return data;
    } catch (parseError) {
        console.log(`JSON.parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // JSON5 (more forgiving)
    try {
        const data = JSON5.parse(sanitized);
        console.log("Successfully parsed with JSON5");
        return data;
    } catch (json5Error) {
        console.log(`JSON5 failed: ${json5Error instanceof Error ? json5Error.message : String(json5Error)}`);
    }
    try {
        const quizMatch = sanitized.match(/\{[\s\S]*"quiz"[\s\S]*\}/);
        if (quizMatch) {
            const data = JSON.parse(quizMatch[0]);
            console.log("Successfully parsed extracted quiz object");
            return data;
        }
    } catch (extractError) {
        console.log(`Quiz extraction failed: ${extractError instanceof Error ? extractError.message : String(extractError)}`);
    }
    try {
        let fixed = sanitized
            .replace(/log(\d+)\(([^)]+)\)/g, "log_$1($2)")
            .replace(/x(\d+)/g, "x^$1")
            .replace(/"([^"]*log[^"]*)"([^"]*)"([^"]*)"(?=\s*[,}])/g, '"$1\\"$2\\"$3"')
            .replace(/\n(?=\s*["}])/g, "\\n")
            .replace(/([^\\])"(\s*\n)/g, '$1\\"$2')
            .replace(/: "(\d+(?:\.\d+)?)"(?=\s*[,}])/g, ': "$1"')
            .replace(/^[^{]*/, "")
            .replace(/[^}]*$/, "");
        const data = JSON.parse(fixed);
        console.log("Successfully parsed after manual fixes");
        return data;
    } catch (finalError) {
        console.error("All parsing strategies failed");
        console.error("Original content sample:", content.substring(0, 500));

        if (finalError instanceof Error) {
            const errorMatch = finalError.message.match(/position (\d+)/);
            if (errorMatch) {
                const pos = parseInt(errorMatch[1]);
                console.error("Context around error position:");
                console.error(sanitized.substring(Math.max(0, pos - 100), pos + 100));
            }
        }

        throw new Error(`Failed to parse AI response as JSON after all attempts. Original error: ${finalError instanceof Error ? finalError.message : String(finalError)}`);
    }
}

function addGenerationId(prompt = "") {
    const generationId = generateRandomSeed();
    const timestamp = Date.now();
    return (
        prompt +
        `
    **GENERATION CONTEXT:**
Generation ID: ${generationId}
Timestamp: ${timestamp}
Instruction: This is a completely FRESH quiz generation. Do NOT repeat any patterns from previous generations. Every question must be mathematically unique and test different skills.

**FRESH GENERATION MANDATE:**
- Ignore any patterns from previous quiz generations
- Use completely different mathematical approaches
- Select different topics from the available options
- Vary all numerical values and coefficients
- Create entirely new problem contexts and scenarios
- Generate questions as if this is your first quiz ever created
    `
    );
}
/**
 * Clean up explanations by removing self-doubt and recalculation attempts
 * @param {string} explanation - Raw explanation text
 * @returns {string} Cleaned explanation
 */
function cleanExplanation(explanation) {
    if (!explanation || typeof explanation !== "string") return explanation;
    // Remove when AI thinks out loud (wastes tokens)
    let cleaned = explanation
        .replace(/Wait, let me recalculate[^.]*\./gi, "")
        .replace(/Let me try again[^.]*\./gi, "")
        .replace(/Actually, let me [^.]*\./gi, "")
        .replace(/Let me check[^.]*\./gi, "")
        .replace(/Let me verify[^.]*\./gi, "")
        .replace(/I keep getting[^.]*\./gi, "")
        .replace(/I consistently get[^.]*\./gi, "")
        .replace(/This doesn't match[^.]*\./gi, "")
        .replace(/Still doesn't match[^.]*\./gi, "")
        .replace(/Since.*isn't an option[^.]*\./gi, "")
        .replace(/But.*isn't an option[^.]*\./gi, "")
        .replace(/Given the options[^.]*\./gi, "")
        .replace(/There might be[^.]*\./gi, "")
        .replace(/I'll.*with[^.]*\./gi, "")
        .replace(/Wait,[^.]*\./gi, "")
        .replace(/Actually,[^.]*\./gi, "")
        .replace(/Let me try once more[^.]*\./gi, "")
        .replace(/Once more with[^.]*\./gi, "")
        .replace(/Based on.*constraints[^.]*\./gi, "")
        .replace(/Given the.*problem[^.]*\./gi, "")
        .replace(/Since this.*typo[^.]*\./gi, "")
        .replace(/\s+/g, " ")
        .replace(/\.\s*\./g, ".")
        .trim();

    const sentences = cleaned.split(/\.\s+/);
    const cleanSentences = [];

    for (const sentence of sentences) {
        if (sentence.toLowerCase().includes("wait") || sentence.toLowerCase().includes("actually") || sentence.toLowerCase().includes("let me") || sentence.toLowerCase().includes("doesn't match") || sentence.toLowerCase().includes("recalculate")) {
            break;
        }
        cleanSentences.push(sentence);
    }

    const result = cleanSentences.join(". ").trim();
    return result.length > 10 ? result + (result.endsWith(".") ? "" : ".") : cleaned;
}
/**
 * @param {string[]} selectedClasses
 * @param {number} numquestions
 * @param {"easy" | "medium" | "hard"} difficulty
 */

// SAT Math Topics by Math Classes Taken
/**
 * @type {{[key: string]: string[]}}
 */
const mathClasses = {
    "Algebra I": ["Linear Equations", "Polynomials", "Factoring", "Systems of Equations", "Inequalities"],
    Geometry: ["Area and Perimeter", "Triangles", "Circles", "Volume", "Coordinate Geometry"],
    "Algebra II": ["Quadratic Functions", "Exponential Functions", "Logarithms", "Rational Functions", "Complex Numbers"],
    Trigonometry: ["Trigonometric Functions", "Unit Circle", "Identities", "Law of Sines", "Law of Cosines"],
    "Pre-Calculus": ["Polynomial Functions", "Sequences and Series", "Conic Sections", "Matrices", "Limits"],
};

function formatMathematicalNotation(text = "") {
    if (!text || typeof text !== "string") return text;
    let formatted = text;
    const superscripts = {
        0: "⁰",
        1: "¹",
        2: "²",
        3: "³",
        4: "⁴",
        5: "⁵",
        6: "⁶",
        7: "⁷",
        8: "⁸",
        9: "⁹",
        "+": "⁺",
        "-": "⁻",
        "=": "⁼",
        "(": "⁽",
        ")": "⁾",
        n: "ⁿ",
        x: "ˣ",
        y: "ʸ",
        i: "ⁱ",
    };
    const subscripts = {
        0: "₀",
        1: "₁",
        2: "₂",
        3: "₃",
        4: "₄",
        5: "₅",
        6: "₆",
        7: "₇",
        8: "₈",
        9: "₉",
        "+": "₊",
        "-": "₋",
        "=": "₌",
        "(": "₍",
        ")": "₎",
        a: "ₐ",
        e: "ₑ",
        h: "ₕ",
        i: "ᵢ",
        j: "ⱼ",
        k: "ₖ",
        l: "ₗ",
        m: "ₘ",
        n: "ₙ",
        o: "ₒ",
        p: "ₚ",
        r: "ᵣ",
        s: "ₛ",
        t: "ₜ",
        u: "ᵤ",
        v: "ᵥ",
        x: "ₓ",
    };
    /**
     * @param {number} digit
     */
    formatted = formatted.replace(/([a-zA-Z])\^([0-9]+)/g, (_match, base, exponent) => {
        /**
         * @param {string} digit
         */
        const superscriptExp = exponent
            .split("")
            .map((/** @type {string} */ digit) => superscripts[/** @type {keyof typeof superscripts} */ (digit)] || digit)
            .join("");
        return base + superscriptExp;
    });

    formatted = formatted.replace(/([a-zA-Z])\^([0-9]+)/g, (_match, base, exponent) => {
        const superscriptExp = exponent
            .split("")
            .map((/** @type {string} */ digit) => superscripts[/** @type {keyof typeof superscripts} */ (digit)] || digit)
            .join("");
        return base + superscriptExp;
    });

    formatted = formatted.replace(/log_([0-9]+)/g, (_match, base) => {
        const subscriptBase = base
            .split("")
            .map((/** @type {string} */ digit) => subscripts[/** @type {keyof typeof subscripts} */ (digit)] || digit)
            .join("");
        return "log" + subscriptBase;
    });

    formatted = formatted.replace(/log_([a-zA-Z])/g, (_match, base) => {
        const subscriptBase = subscripts[/** @type {keyof typeof subscripts} */ (base)] || base;
        return "log" + subscriptBase;
    });

    formatted = formatted.replace(/sqrt\(([^)]+)\)/g, "√($1)");
    formatted = formatted.replace(/sqrt(\d+)/g, "√$1");
    formatted = formatted.replace(/\bpi\b/g, "π");
    formatted = formatted.replace(/\bPi\b/g, "π");
    formatted = formatted.replace(/infinity/g, "∞");
    formatted = formatted.replace(/\+\/-/g, "±");
    formatted = formatted.replace(/\+-/g, "±");
    formatted = formatted.replace(/<=/g, "≤");
    formatted = formatted.replace(/>=/g, "≥");
    formatted = formatted.replace(/!=/g, "≠");
    formatted = formatted.replace(/\*\*/g, "⋅");
    formatted = formatted.replace(/\bcdot\b/g, "⋅");
    formatted = formatted.replace(/degrees?/g, "°");
    formatted = formatted.replace(/deg\b/g, "°");
    formatted = formatted.replace(/\btheta\b/g, "θ");
    formatted = formatted.replace(/\balpha\b/g, "α");
    formatted = formatted.replace(/\bbeta\b/g, "β");
    formatted = formatted.replace(/\bgamma\b/g, "γ");
    formatted = formatted.replace(/\bdelta\b/g, "δ");
    formatted = formatted.replace(/\bDelta\b/g, "Δ");
    formatted = formatted.replace(/\bomega\b/g, "ω");
    formatted = formatted.replace(/\bOmega\b/g, "Ω");
    return formatted;
}

function formatQuestionMath(question = /** @type {any} */ ({})) {
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
 * Difficulty classification system for each math class
 * @type {{[key: string]: {easy: string[], medium: string[], hard: string[]}}}
 */
const difficultyClassification = {
    "Algebra I": {
        easy: ["One-step linear equations (2x = 10)", "Simple substitution (if x = 3, find 2x + 1)", "Basic polynomial addition/subtraction", "Simple factoring (x² + 5x + 6)", "Single-variable inequalities (x > 5)"],
        medium: ["Two-step linear equations with fractions", "Systems of equations by substitution", "Polynomial multiplication (distributive property)", "Factoring trinomials with leading coefficient ≠ 1", "Compound inequalities"],
        hard: ["Multi-step equations with variables on both sides", "Systems with no solution or infinite solutions", "Complex polynomial operations", "Factoring by grouping", "Absolute value inequalities"],
    },
    Geometry: {
        easy: ["Area of basic shapes (square, rectangle, triangle)", "Perimeter calculations", "Basic angle relationships", "Simple coordinate geometry (distance between points)", "Volume of rectangular prisms"],
        medium: ["Area of complex shapes (trapezoids, parallelograms)", "Pythagorean theorem applications", "Circle area and circumference", "Coordinate geometry with slopes", "Surface area calculations"],
        hard: ["Composite figure area/volume problems", "Geometric proofs and reasoning", "Complex coordinate geometry transformations", "Circle theorems and arc length", "3D geometry and spatial reasoning"],
    },
    "Algebra II": {
        easy: ["Evaluating quadratic functions at given points", "Simple exponential growth (2^x)", "Basic logarithm evaluation (log₁₀(100))", "Simple rational function evaluation", "Basic complex number arithmetic"],
        medium: ["Solving quadratic equations by factoring", "Exponential equations (3^x = 27)", "Logarithm properties and equations", "Rational function simplification", "Complex number operations"],
        hard: ["Quadratic formula with complex solutions", "Exponential modeling problems", "Change of base formula and applications", "Rational inequalities", "Complex number graphing and polar form"],
    },
    Trigonometry: {
        easy: ["Basic trig ratios in right triangles", "Unit circle values at special angles", "Simple trig function evaluation", "Basic angle conversions (degrees/radians)", "Simple trig equations"],
        medium: ["Trig functions of general angles", "Basic trig identities applications", "Law of Sines with one triangle", "Amplitude and period of trig functions", "Inverse trig function evaluation"],
        hard: ["Complex trig identity proofs", "Law of Cosines applications", "Trig function transformations", "Multiple angle formulas", "Trig equations with multiple solutions"],
    },
    "Pre-Calculus": {
        easy: ["Polynomial function evaluation", "Simple sequence identification", "Basic matrix operations", "Simple limit evaluation", "Conic section identification"],
        medium: ["Polynomial division and remainder theorem", "Arithmetic/geometric sequence formulas", "Matrix multiplication", "Limit laws application", "Conic section equations"],
        hard: ["Polynomial function analysis and graphing", "Series convergence and sum", "Matrix determinants and inverses", "Complex limits and continuity", "Conic section transformations"],
    },
};

/**
 * Generate detailed difficulty instructions for the prompt
 * @param {string[]} selectedClasses - Array of selected math classes
 * @param {"easy" | "medium" | "hard"} difficulty - Difficulty level
 * @returns {string} Detailed difficulty instructions
 */
function generateDifficultyInstructions(selectedClasses, difficulty) {
    let instructions = `\n**${difficulty.toUpperCase()} DIFFICULTY REQUIREMENTS:**\n\n`;

    selectedClasses.forEach((mathClass) => {
        if (difficultyClassification[mathClass]) {
            const classInstructions = difficultyClassification[mathClass][difficulty];
            instructions += `**${mathClass} - ${difficulty} level:**\n`;
            classInstructions.forEach((instruction) => {
                instructions += `• ${instruction}\n`;
            });
            instructions += "\n";
        }
    });

    switch (difficulty) {
        case "easy":
            instructions += `**GENERAL EASY GUIDELINES:**
- Questions should be solvable in 30-45 seconds
- Require 1-2 basic steps
- Use simple numbers (avoid complex fractions/decimals)
- Test fundamental concept understanding
- Minimal setup or word problem complexity
- Direct application of basic formulas\n\n`;
            break;
        case "medium":
            instructions += `**GENERAL MEDIUM GUIDELINES:**
- Questions should take 45-90 seconds to solve
- Require 2-4 computational steps
- May involve moderate fractions/decimals
- Test concept application and connections
- Moderate word problem complexity
- May require formula manipulation or multi-step reasoning\n\n`;
            break;
        case "hard":
            instructions += `**GENERAL HARD GUIDELINES:**
- Questions should take 90+ seconds to solve
- Require multiple steps and advanced reasoning
- May involve complex calculations
- Test deep conceptual understanding
- High word problem complexity or abstract scenarios
- Require synthesis of multiple concepts or advanced problem-solving strategies\n\n`;
            break;
    }
    return instructions;
}

/**
 * Generate mathematical complexity guidelines based on difficulty
 * @param {"easy" | "medium" | "hard"} difficulty - Difficulty level
 * @returns {string} Mathematical complexity guidelines
 */
function generateComplexityGuidelines(difficulty) {
    switch (difficulty) {
        case "easy":
            return `**MATHEMATICAL COMPLEXITY (Easy):**
- Use integers when possible, avoid complex fractions
- Simple substitution problems
- Direct formula application
- Single-concept questions
- Clear, straightforward wording`;

        case "medium":
            return `**MATHEMATICAL COMPLEXITY (Medium):**
- May use fractions, decimals, or radicals
- Multi-step problems requiring logical sequence
- Combination of 2-3 concepts
- Some interpretation or translation required
- Moderate algebraic manipulation`;

        case "hard":
            return `**MATHEMATICAL COMPLEXITY (Hard):**
- Complex numbers, expressions, or scenarios
- Multi-step problems with decision points
- Integration of multiple concepts
- Requires strategic thinking or insight
- Advanced algebraic/geometric reasoning`;
    }
}

// Input validation functions
function isValidMathClasses(classes = /** @type {string[]} */ ([])) {
    return Array.isArray(classes) && classes.length > 0 && classes.length <= 5 && classes.every((cls) => Object.prototype.hasOwnProperty.call(mathClasses, cls));
}

function isValidDifficulty(difficulty = "") {
    return ["easy", "medium", "hard"].includes(difficulty);
}

function isValidNumQuestions(num = 0) {
    return Number.isInteger(num) && num > 0 && num <= 10;
}

/**
 * @typedef {Object} QuestionDistribution
 * @property {string[]} selectedClasses - Array of selected math classes
 * @property {number} totalQuestions - Total number of questions to generate
 */

/**
 * @param {string[]} selectedClasses
 * @param {number} totalQuestions
 * @returns {string}
 */
function generateQuestionDistribution(selectedClasses, totalQuestions) {
    const questionsPerClass = Math.floor(totalQuestions / selectedClasses.length);
    const remainder = totalQuestions % selectedClasses.length;

    let distribution = selectedClasses.map((cls, index) => {
        const questions = questionsPerClass + (index < remainder ? 1 : 0);
        return `- Generate ${questions} question${questions !== 1 ? "s" : ""} from ${cls}`;
    });

    return distribution.join("\n");
}

// Main quiz generation function with validation and correction
export async function generateQuiz(selectedClasses = /** @type {string[]} */ ([]), numquestions = 0, difficulty = /** @type {"easy" | "medium" | "hard"} */ ("medium")) {
    try {
        if (!isValidMathClasses(selectedClasses)) {
            throw new Error("Please select 1-5 valid math classes.");
        }
        if (isValidNumQuestions(numquestions) === false) {
            throw new Error("Number of questions must be a positive number between 1 and 10.");
        }
        if (!isValidDifficulty(difficulty)) {
            throw new Error("Difficulty must be 'easy', 'medium', or 'hard'.");
        }

        const allTopics = selectedClasses.flatMap((cls) => mathClasses[cls]);

        if (!allTopics || allTopics.length === 0) {
            throw new Error("No topics available for selected classes.");
        }

        console.log(`Generating ${numquestions} ${difficulty} questions from classes: ${selectedClasses.join(", ")}...`);

        const maxAttempts = 3;
        let validQuestions = [];
        let correctedQuestions = [];

        for (let attempt = 1; attempt <= maxAttempts && validQuestions.length < numquestions; attempt++) {
            console.log(`Attempt ${attempt}/${maxAttempts}...`);
            const questionsToGenerate = Math.min(10, (numquestions - validQuestions.length) * 2);

            const difficultyInstructions = generateDifficultyInstructions(selectedClasses, difficulty);
            const complexityGuidelines = generateComplexityGuidelines(difficulty);

            const prompt = `Generate a ${difficulty} SAT math quiz with ${questionsToGenerate} questions for students who have taken these math classes: ${selectedClasses.join(", ")}.

${difficultyInstructions}

${complexityGuidelines}

**QUESTION DISTRIBUTION REQUIREMENTS:**
${generateQuestionDistribution(selectedClasses, questionsToGenerate)}

**CRITICAL INSTRUCTIONS FOR QUESTION COMPLEXITY:**
- **Algebra I topics** (Linear Equations, Polynomials, Factoring, Systems of Equations, Inequalities): Focus on the ${difficulty} level concepts listed above
- **Geometry topics** (Area and Perimeter, Triangles, Circles, Volume, Coordinate Geometry): Apply ${difficulty} level geometric reasoning as specified
- **Algebra II topics** (Quadratic Functions, Exponential Functions, Logarithms, Rational Functions, Complex Numbers): Use ${difficulty} level advanced algebraic concepts
- **Trigonometry topics**: Apply ${difficulty} level trigonometric concepts and reasoning
- **Pre-Calculus topics**: Use ${difficulty} level advanced function analysis

**QUESTION QUALITY STANDARDS:**
- Each question must clearly align with the specified difficulty level
- Use realistic SAT/ACT formatting and style
- Ensure mathematical accuracy in all calculations
- Provide clear, step-by-step explanations
- Make sure the correct answer is actually correct
- Create plausible distractors for incorrect options

**MAXIMUM DIVERSITY REQUIREMENTS - CRITICAL:**
- NO duplicate questions, identical problem types, or similar problem structures
- Each question must test a COMPLETELY DIFFERENT mathematical skill
- NEVER repeat solution methods or question formats
- Use diverse numerical values - avoid any repeated coefficients or constants
- Vary contexts: pure math, word problems, real-world applications, graphical interpretations
- Mix question styles: solve for x, evaluate, simplify, find, analyze, interpret, determine, calculate
- Include varied mathematical representations: algebraic, graphical, numerical, verbal

**STRICT REPETITION LIMITS:**
- Maximum 1 exponential equation per entire quiz
- Maximum 1 logarithm problem per entire quiz  
- Maximum 1 rational expression simplification per entire quiz
- Maximum 1 quadratic vertex/completing square problem per entire quiz
- Maximum 1 bacteria/population growth word problem per entire quiz
- Maximum 1 complex number multiplication per entire quiz
- NO two questions can use the same solution strategy
- NO similar numerical patterns (if one uses x² - 6x + 5, don't use x² - 4x + 3)

**ZERO TOLERANCE DIVERSITY ENFORCEMENT:**

**COMPLETELY FORBIDDEN - NEVER USE THESE COMBINATIONS:**
- Any logarithm equation with log₂(x + 3) = 5 or similar single-step log problems
- Complex number multiplication (3 + 2i)(4 - 5i) or any basic FOIL with complex numbers
- Rational function holes with (x² - 4)/(x - 2) or similar factor-cancellation
- Function composition with f(x) = x² + 6x and g(x) = 2x - 1
- System: x² + y = 7 and x - y = 1 or any parabola-line intersection
- Polynomial factor problems with x = 2 as a root
- Population growth with P(t) = initial(1.15)^t format
- Vertex form problems with y = ax² + bx + c and given vertex coordinates

**NUMERICAL DIVERSITY REQUIREMENTS:**
- Use different bases for all exponential/log problems (base 2, base 3, base e, base 10)
- Vary polynomial degrees (quadratic, cubic, quartic)
- Use different complex number forms (a+bi, polar, conjugates)
- Change function types completely (polynomial, rational, radical, exponential, log)
- Use different variables (x, t, n, k, etc.)

**SOLUTION METHOD DIVERSITY:**
- No two questions can use the same algebraic technique
- Rotate: factoring, quadratic formula, substitution, elimination, graphing, properties
- Mix: direct calculation, multi-step reasoning, conceptual analysis
- Vary: symbolic manipulation, numerical approximation, graphical interpretation

**VERIFICATION REQUIREMENT:**
Before generating each question, ask yourself:
1. Is this concept/method already used in a previous question?
2. Are the numbers/coefficients similar to any previous question?
3. Does this test the same mathematical skill as any other question?
4. Is the solution strategy identical to any previous question?
5. Does this question format match any previous question?
6. Does this question use the same numerical values or patterns as any previous question?

If ANY answer is yes, generate a completely different question.

**QUESTION FORMAT VARIETY:**
- "Solve for x" → "Find the value of" → "Determine" → "Calculate" → "What is"
- "Simplify" → "Evaluate" → "Express in standard form" → "Rewrite"
- Include interpretation questions: "What does this represent?"
- Add analysis questions: "Which statement is true?"

**DIFFICULTY VALIDATION:**
Before creating each question, verify it meets the ${difficulty} criteria:
- Computational complexity matches the level
- Conceptual depth is appropriate
- Time requirement aligns with difficulty
- Mathematical sophistication fits the level

**CRITICAL JSON OUTPUT REQUIREMENTS:**
You must respond with ONLY a valid JSON object. No explanatory text, no reasoning, no commentary.

Your response must start with { and end with }.

**JSON FORMATTING RULES:**
- Return ONLY valid JSON, no markdown code blocks or extra text
- ALL strings must have quotes and special characters properly escaped
- In explanation strings: Replace ALL quotes with \\" (backslash + quote)
- In explanation strings: Replace ALL newlines with \\n 
- In explanation strings: Replace ALL tabs with \\t
- Mathematical expressions must be written as plain text within strings
- NO unescaped quotes, newlines, or special characters anywhere in JSON strings
- All JSON keys must use double quotes
- NO trailing commas in arrays or objects
- Ensure all strings are properly terminated with closing quotes
- For complex mathematical explanations, use simple text descriptions

**EXPLANATION FORMATTING RULES:**
- Keep explanations concise and in simple text format
- Avoid complex mathematical notation that requires special characters
- Use words like "squared" instead of superscript notation
- Use "log base 2" instead of subscript notation
- Replace fractions with "3/4" format instead of complex notation
- Keep all explanations on single logical lines within the JSON structure

Your entire response must be the JSON object only. Do not include any other text.

Each question should:
1. Be clearly tied to ONE specific math class
2. Use appropriate complexity for that class level AND the selected difficulty
3. Include realistic SAT/ACT formatting
4. Have 4 multiple choice options with one correct answer
5. Demonstrate the specified difficulty level through both computational and conceptual requirements
6. Test a UNIQUE mathematical skill not covered by any other question

Format your response as a JSON object like this:
{
  "quiz": {
    "selectedClasses": ${JSON.stringify(selectedClasses)},
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
        "explanation": "Step-by-step solution using simple text format",
        "topic": "Topic name",
        "mathClass": "Algebra I"
      }
    ]
  }
}`;

            const response = await anthropic.messages.create({
                model: "claude-opus-4-20250514",
                max_tokens: 12000,
                temperature: 0.4,
                stream: true,
                stop_sequences: ["[]"],
                system: `You are an expert math teacher specializing in SAT preparation. Create high-quality, grade-appropriate practice questions that strictly adhere to the specified difficulty level. 

DIVERSITY EXPERT: You are obsessed with creating completely unique questions. You NEVER repeat question types, solution methods, or numerical patterns. Each question must test a different mathematical skill using a unique approach.

DIFFICULTY EXPERTISE: You understand that ${difficulty} questions in each math class have specific characteristics:
- Easy: Foundation-level, minimal steps, basic application
- Medium: Multi-step, moderate complexity, concept connections  
- Hard: Advanced reasoning, complex scenarios, deep understanding

Every calculation must be correct and the marked correct answer must be mathematically accurate. Pay special attention to making questions appropriately ${difficulty} for each selected math class.

JSON OUTPUT EXPERT: You are extremely careful about output formatting. You MUST:
- Return ONLY the JSON object, no explanatory text before or after
- No thinking out loud, no reasoning shown, no commentary
- No markdown formatting or code blocks
- Start immediately with { and end with }
- Escape ALL quotes in strings with backslashes
- Replace ALL newlines in strings with \\n
- Use simple text in explanations, avoiding complex mathematical notation
- Ensure all strings are properly terminated

CRITICAL: Your entire response must be ONLY the JSON object. Do not include any explanatory text, reasoning, or commentary. Start with { and end with }.`,
                messages: [
                    {
                        role: "user",
                        content: addGenerationId(prompt),
                    },
                ],
            });

            let content = "";
            for await (const message of response) {
                if (message.type === "content_block_delta" && message.delta && message.delta.type === "text_delta") {
                    content += message.delta.text;
                }
            }

            if (!content) {
                throw new Error("No content returned from Anthropic API.");
            }

            console.log("Raw response length:", content.length);
            console.log("Response preview:", content.substring(0, 200));
            console.log("Response ending:", content.substring(Math.max(0, content.length - 200)));

            const data = parseJSONWithFallbacks(content);

            // Validate each question
            if (data.quiz && data.quiz.questions) {
                for (const question of data.quiz.questions) {
                    if (validQuestions.length >= numquestions) break;
                    console.log(`Validating: "${question.question.substring(0, 50)}..."`);
                    const validation = MathQuestionValidator.validateQuestion(question);
                    if (validation.isValid) {
                        if (validation.correctedAnswer) {
                            //Question has good math but wrong answer marked
                            console.log(`Auto-corrected: ${question.correctAnswer} → ${validation.correctedAnswer}`);
                            // Generate corrected explanation
                            const correctedExplanation = validation.solution ? MathQuestionValidator.generateCorrectedExplanation(question, validation.solution, validation.correctedAnswer) : question.explanation; // Fallback to original if no solution
                            const cleanedExplanation = cleanExplanation(correctedExplanation);
                            /** @type {{ id: number, question: string, options: {[key: string]: string}, correctAnswer: string, explanation: string, topic: string }} */
                            const correctedQuestion = {
                                id: validQuestions.length + 1,
                                question: question.question,
                                options: { ...question.options },
                                correctAnswer: validation.correctedAnswer,
                                explanation: cleanedExplanation,
                                topic: question.topic,
                            };
                            const formattedQuestion = formatQuestionMath(correctedQuestion);
                            validQuestions.push(formattedQuestion);
                            correctedQuestions.push({
                                id: question.id || validQuestions.length,
                                original: question.correctAnswer,
                                corrected: validation.correctedAnswer,
                                reason: "Math validation correction with explanation fix",
                            });
                            console.log(`CORRECTION VERIFIED: Final answer = ${correctedQuestion.correctAnswer}`);
                            console.log(`EXPLANATION CORRECTED: ${correctedExplanation.substring(0, 100)}...`);
                        } else {
                            console.log(`Simple question verified correctly`);
                            /** @type {{ id: number, question: string, options: {[key: string]: string}, correctAnswer: string, explanation: string, topic: string }} */
                            const perfectQuestion = {
                                id: validQuestions.length + 1,
                                question: question.question,
                                options: { ...question.options },
                                correctAnswer: question.correctAnswer, // OG answer
                                explanation: cleanExplanation(question.explanation), // OG explanation (if question is perfect) -> This process ensures a clean, corrected question with good questions, options, answer, and explaanation
                                topic: question.topic,
                            };
                            const formattedQuestion = formatQuestionMath(perfectQuestion);
                            validQuestions.push(formattedQuestion);
                        }
                        console.log(`Question accepted (score: ${validation.score})`);
                    } else {
                        console.log(`Rejected (score: ${validation.score}): ${validation.issues.join(", ")}`);
                    }
                }
            }
        }
        if (validQuestions.length === 0) {
            throw new Error("No valid questions could be generated. Please try again.");
        }
        const finalQuestions = validQuestions.slice(0, numquestions);
        console.log(`\nFINAL QUESTIONS BEING RETURNED:`); // Keep a log of what was corrected
        finalQuestions.forEach((q, i) => {
            console.log(`Q${i + 1}: Answer=${q.correctAnswer} (${q.options[q.correctAnswer]})`);
        });
        console.log(`\nGENERATION SUMMARY:`);
        console.log(`Valid questions: ${finalQuestions.length}/${numquestions}`);
        console.log(`Auto-corrections: ${correctedQuestions.length}`);
        if (correctedQuestions.length > 0) {
            console.log(`\nCORRECTIONS MADE:`);
            correctedQuestions.forEach((correction) => {
                console.log(`   Q${correction.id}: ${correction.original} → ${correction.corrected}`);
            });
        }
        const result = {
            quiz: {
                selectedClasses: selectedClasses,
                difficulty: difficulty,
                questions: finalQuestions,
            },
        };
        return result;
    } catch (e) {
        console.error("Error generating quiz:", e);
        throw e;
    }
}

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
 * Format mathematical notation in an entire quiz
 * @param {QuizWrapper} quiz - The quiz object to format
 * @returns {QuizWrapper} Formatted quiz object
 */
export function formatQuizMath(quiz) {
    if (!quiz || !quiz.quiz || !quiz.quiz.questions) return quiz;
    const formattedQuiz = {
        ...quiz,
        quiz: {
            ...quiz.quiz,
            questions: quiz.quiz.questions.map((question) => formatQuestionMath(question)),
        },
    };
    return formattedQuiz;
}

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
