// @ts-check
import { difficultyClassification, mathClasses } from "../config/generationconstants.js";
/**
 * @typedef {"easy" | "medium" | "hard"} Difficulty
 */
/**
 * Generate a random seed for quiz generation -> could potentially be filtered out later since AI is not particular good at these things
 * @returns {string}
 */
function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15);
}
/**
 * Generate difficulty-specific instructions for the prompt
 * @param {string[]} selectedClasses
 * @param {Difficulty} difficulty
 * @returns {string}
 */
export function generateDifficultyInstructions(selectedClasses, difficulty) {
    let instructions = `\n**${difficulty.toUpperCase()} DIFFICULTY REQUIREMENTS:**\n\n`;

    selectedClasses.forEach((mathClass) => {
        if (difficultyClassification[/** @type {keyof typeof difficultyClassification} */ (mathClass)]) {
            const classInstructions = difficultyClassification[/** @type {keyof typeof difficultyClassification} */ (mathClass)][difficulty];
            instructions += `**${mathClass} - ${difficulty} level:**\n`;
            /**
             * @type {any[]} instruction
             */
            classInstructions.forEach((instruction = "") => {
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
 * Generate complexity guidelines based on difficulty level
 * @param {Difficulty} difficulty
 * @returns {string}
 */
export function generateComplexityGuidelines(difficulty) {
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

/**
 * Generate question distribution instructions
 * @param {string[]} selectedClasses
 * @param {number} totalQuestions
 * @returns {string}
 */
export function generateQuestionDistribution(selectedClasses, totalQuestions) {
    const questionsPerClass = Math.floor(totalQuestions / selectedClasses.length);
    const remainder = totalQuestions % selectedClasses.length;

    let distribution = selectedClasses.map((cls, index) => {
        const questions = questionsPerClass + (index < remainder ? 1 : 0);
        return `- Generate ${questions} question${questions !== 1 ? "s" : ""} from ${cls}`;
    });

    return distribution.join("\n");
}
/**
 * Get unique topics from selected classes
 * @param {string[]} selectedClasses
 * @param {number} numQuestions
 */
export function getUniqueTopics(selectedClasses, numQuestions) {
    /**
     * @type {string[]}
     */
    const allTopics = [];
    selectedClasses.forEach((className) => {
        const topics = mathClasses[/** @type {keyof typeof mathClasses} */ (className)] || [];
        topics.forEach((topic) => {
            allTopics.push(`${className}: ${topic}`);
        });
    });
    // Shuffle and return unique topics
    const shuffled = allTopics.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numQuestions);
}

/**
 * Add generation ID and freshness instructions to prompt
 * @param {string} prompt
 * @returns {string}
 */
export function addGenerationId(prompt = "") {
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
- Generate questions as if this is your first quiz ever created`
    );
}

/**
 * Build the complete dynamic prompt for quiz generation
 * @param {string[]} selectedClasses
 * @param {Difficulty} difficulty
 * @param {number} questionsToGenerate
 * @returns {string}
 */
export function buildDynamicPrompt(selectedClasses, difficulty, questionsToGenerate) {
    const difficultyInstructions = generateDifficultyInstructions(selectedClasses, difficulty);
    const complexityGuidelines = generateComplexityGuidelines(difficulty);
    const specificTopics = getUniqueTopics(selectedClasses, questionsToGenerate);
    const dynamicPrompt = `Generate a ${difficulty} SAT math quiz with ${questionsToGenerate} questions for students who have taken these math classes: ${selectedClasses.join(", ")}.

${difficultyInstructions}

${complexityGuidelines}

**QUESTION TOPICS:**
${specificTopics.map((topic, index) => `- Question ${index + 1}: Create a ${difficulty} question about ${topic}`).join("\n")}

**QUESTION DISTRIBUTION REQUIREMENTS:**
${generateQuestionDistribution(selectedClasses, questionsToGenerate)}

**CRITICAL INSTRUCTIONS FOR QUESTION COMPLEXITY:**
- **Algebra I topics** (Linear Equations, Polynomials, Factoring, Systems of Equations, Inequalities): Focus on the ${difficulty} level concepts listed above
- **Geometry topics** (Area and Perimeter, Triangles, Circles, Volume, Coordinate Geometry): Apply ${difficulty} level geometric reasoning as specified
- **Algebra II topics** (Quadratic Functions, Exponential Functions, Logarithms, Rational Functions, Complex Numbers): Use ${difficulty} level advanced algebraic concepts
- **Trigonometry topics**: Apply ${difficulty} level trigonometric concepts and reasoning
- **Pre-Calculus topics**: Use ${difficulty} level advanced function analysis

**DIFFICULTY VALIDATION:**
Before creating each question, verify it meets the ${difficulty} criteria:
- Computational complexity matches the level
- Conceptual depth is appropriate
- Time requirement aligns with difficulty
- Mathematical sophistication fits the level`;

    return addGenerationId(dynamicPrompt);
}
