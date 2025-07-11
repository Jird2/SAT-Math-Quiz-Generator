// @ts-check
// import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import JSON5 from "json5";
import dotenv from "dotenv";
import { MathQuestionValidator } from "./quizvalidator.js";
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
/**
 * @param {string[]} selectedClasses
 * @param {number} numquestions
 * @param {"easy" | "medium" | "hard"} difficulty
 */

//SAT Math Topics by Math Classes Taken
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

    // Add general difficulty guidelines
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

function isValidMathClasses(classes = /** @type {string[]} */ ([])) {
    return Array.isArray(classes) && classes.length > 0 && classes.length <= 5 && classes.every((cls) => Object.prototype.hasOwnProperty.call(mathClasses, cls));
}

function isValidDifficulty(difficulty = "") {
    return ["easy", "medium", "hard"].includes(difficulty);
}

function isValidNumQuestions(num = 0) {
    return Number.isInteger(num) && num > 0 && num <= 10; // reasonable limit for a quiz
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

        // Combine topics from all selected classes
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

            // Generate extra questions to account for validation filtering
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

**QUESTION DIVERSITY REQUIREMENTS:**
- NO duplicate questions or identical problem types across the entire quiz
- Vary question formats: word problems, pure math, real-world applications, graphical interpretations
- Mix computational and conceptual questions
- Use different mathematical contexts and scenarios  
- Ensure each question tests a DIFFERENT specific skill within each math class
- Include varied number types: integers, fractions, decimals, radicals, irrational numbers
- Mix question styles: solve for x, evaluate, simplify, find, prove, analyze, interpret, etc.
- Rotate between theoretical and applied mathematics

**AVOID REPETITION ACROSS ALL SUBJECTS:**
- Don't repeat exact numerical values (if using 3/5, don't use it again anywhere)
- Vary coefficients, constants, and variables significantly
- Use different contexts: pure math vs real-world applications
- Rotate between different mathematical representations: algebraic, graphical, numerical, verbal
- Change geometric configurations and measurement units
- Vary complexity within difficulty level: some more computational, others more conceptual
- Use different variable names and mathematical notation styles
- Include both exact and approximate answers where appropriate
- Mix abstract problems with concrete applications

**COMPREHENSIVE TOPIC ROTATION BY SUBJECT:**

**ALGEBRA I - Rotate between:**
- Linear equations: one-step, two-step, multi-step, with fractions, with decimals
- Systems: substitution, elimination, graphical, word problems, no solution/infinite solutions
- Polynomials: addition, subtraction, multiplication, division, synthetic division
- Factoring: GCF, difference of squares, trinomials, by grouping, completely
- Inequalities: linear, compound, absolute value, graphing, word problems

**GEOMETRY - Rotate between:**
- Area/Perimeter: triangles, squares, rectangles, circles, trapezoids, parallelograms, composite figures
- Volume/Surface Area: prisms, cylinders, pyramids, cones, spheres, composite solids
- Coordinate Geometry: distance, midpoint, slope, parallel/perpendicular lines, transformations
- Triangles: Pythagorean theorem, special right triangles, similarity, congruence, proofs
- Circles: area, circumference, arc length, sector area, tangent lines, inscribed angles

**ALGEBRA II - Rotate between:**
- Quadratics: factoring, quadratic formula, completing the square, graphing, vertex form, applications
- Exponentials: growth/decay, compound interest, half-life, exponential equations, graphing
- Logarithms: evaluation, properties, equations, change of base, natural logs, applications  
- Rational Functions: simplifying, domain/range, asymptotes, graphing, equations
- Complex Numbers: operations, graphing, polar form, De Moivre's theorem, roots

**TRIGONOMETRY - Rotate between:**
- Right Triangle Trig: SOH-CAH-TOA, special angles, applications, word problems
- Unit Circle: exact values, reference angles, coterminal angles, radians/degrees
- Identities: Pythagorean, reciprocal, quotient, sum/difference, double angle, half angle
- Graphing: amplitude, period, phase shift, transformations, modeling
- Law of Sines/Cosines: triangle solving, ambiguous case, applications, area formulas
- Inverse Trig: evaluation, domain/range, solving equations, applications

**PRE-CALCULUS - Rotate between:**
- Polynomial Functions: graphing, end behavior, zeros, synthetic division, remainder theorem
- Sequences/Series: arithmetic, geometric, summation notation, convergence, applications
- Matrices: operations, determinants, inverses, solving systems, applications
- Conic Sections: circles, parabolas, ellipses, hyperbolas, standard form, graphing
- Limits: graphical, numerical, algebraic evaluation, one-sided, infinite

**DIFFICULTY VALIDATION:**
Before creating each question, verify it meets the ${difficulty} criteria:
- Computational complexity matches the level
- Conceptual depth is appropriate
- Time requirement aligns with difficulty
- Mathematical sophistication fits the level

**CRITICAL JSON FORMATTING REQUIREMENTS:**
- Return ONLY valid JSON, no markdown code blocks or extra text
- Escape all quotes in strings using \\" (backslash + quote)
- Escape all backslashes in strings using \\\\ (double backslash)
- Replace all newlines with \\n in strings
- Replace all tabs with \\t in strings
- Mathematical expressions must be in simple text format within strings
- No unescaped quotes, newlines, or special characters in JSON strings
- All JSON keys must use double quotes
- No trailing commas in arrays or objects
- Ensure all strings are properly terminated with closing quotes

Each question should:
1. Be clearly tied to ONE specific math class
2. Use appropriate complexity for that class level AND the selected difficulty
3. Include realistic SAT/ACT formatting
4. Have 4 multiple choice options with one correct answer
5. Demonstrate the specified difficulty level through both computational and conceptual requirements

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
        "explanation": "Step-by-step solution",
        "topic": "Topic name",
        "mathClass": "Algebra I"
      }
    ]
  }
}`;

            /* const response = await anthropic.messages.create({
                model: "claude-opus-4-20250514",
                max_tokens: 4000,
                temperature: 0.1,
                system: `You are an expert math teacher specializing in SAT preparation. Create high-quality, grade-appropriate practice questions that strictly adhere to the specified
                difficulty level. 
                DIFFICULTY EXPERTISE: You understand that ${difficulty} questions in each math class have specific characteristics:
                - Easy: Foundation-level, minimal steps, basic application
                - Medium: Multi-step, moderate complexity, concept connections  
                - Hard: Advanced reasoning, complex scenarios, deep understanding

                Every calculation must be correct and the marked correct answer must be mathematically accurate. Pay special attention to making questions appropriately ${difficulty} 
                for each selected math class.`,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }); */
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                max_tokens: 4000,
                temperature: 0.1,
                messages: [
                    {
                        role: "system",
                        content: `You are an expert math teacher specializing in SAT preparation. 
                        Create high-quality, grade-appropriate practice questions that strictly adhere to the specified difficulty level. 
                        DIFFICULTY EXPERTISE: You understand that ${difficulty} questions in each math class have specific characteristics:
                        - Easy: Foundation-level, minimal steps, basic application
                        - Medium: Multi-step, moderate complexity, concept connections  
                        - Hard: Advanced reasoning, complex scenarios, deep understanding
                        Every calculation must be correct and the marked correct answer must be mathematically accurate. 
                        Pay special attention to making questions appropriately ${difficulty} for each selected math class.
                        CRITICAL JSON FORMATTING: You must return properly formatted JSON with all special characters escaped. 
                        All quotes in strings must be escaped with backslashes. All mathematical expressions must be plain text within JSON strings. 
                        No markdown code blocks or extra formatting.`,
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

            /* const contentBlock = response.content[0];
            if (contentBlock.type !== "text") {
                throw new Error("Expected text content but received different type.");
            }
            const content = contentBlock.text;
            if (!content) {
                throw new Error("No content returned from Anthropic API.");
            }

            // Check if response was truncated
            if (response.stop_reason === "max_tokens") {
                console.log("Warning: Response was truncated due to token limit");
                // Continue to next attempt
                continue;
            }
            */
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error("No content returned from OpenAI API.");
            }

            let cleanContent = content.trim();
            // Remove markdown code block markers if present
            if (cleanContent.startsWith("```json")) {
                cleanContent = cleanContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (cleanContent.startsWith("```")) {
                cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }
            let data;
            try {
                data = JSON.parse(cleanContent);
                console.log("Successfully parsed with JSON.parse");
            } catch (parseError) {
                console.log(`JSON.parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                console.log(`Trying JSON5 (more forgiving parser)...`);

                try {
                    // JSON5 - more forgiving with quotes and formatting
                    data = JSON5.parse(cleanContent);
                    console.log("Successfully parsed with JSON5");
                } catch (json5Error) {
                    console.log(`JSON5 failed: ${json5Error instanceof Error ? json5Error.message : String(json5Error)}`);
                    console.log(`Attempting manual string fixes...`);

                    try {
                        // Conservative cleaning - only fix the most common issues
                        let fixedContent = cleanContent
                            .replace(/: "([^"]*)"([^"]*)"([^"]*)",/g, ': "$1\\"$2\\"$3",')
                            .replace(/: "([^"]*)"([^"]*)"([^"]*)"$/g, ': "$1\\"$2\\"$3"')
                            .replace(/\n(?=\s*["}])/g, "\\n")
                            .replace(/([^\\])"(\s*\n)/g, '$1\\"$2');
                        data = JSON.parse(fixedContent);
                        console.log("Successfully parsed after manual fixes");
                    } catch (finalError) {
                        console.error("All parsing attempts failed");
                        console.error("Original error:", parseError instanceof Error ? parseError.message : String(parseError));
                        console.error("JSON5 error:", json5Error instanceof Error ? json5Error.message : String(json5Error));
                        console.error("Final error:", finalError instanceof Error ? finalError.message : String(finalError));
                        // Show problematic content
                        const errorPos = parseError instanceof Error ? parseError.message.match(/position (\d+)/) : null;
                        if (errorPos) {
                            const pos = parseInt(errorPos[1]);
                            console.error("Content around original error:");
                            console.error(cleanContent.substring(Math.max(0, pos - 100), pos + 100));
                        }

                        throw new Error("Failed to parse AI response as JSON after all attempts");
                    }
                }
            }
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
                            /** @type {{ id: number, question: string, options: {[key: string]: string}, correctAnswer: string, explanation: string, topic: string }} */
                            const correctedQuestion = {
                                id: validQuestions.length + 1,
                                question: question.question,
                                options: { ...question.options },
                                correctAnswer: validation.correctedAnswer, // corrected answer post validation
                                explanation: correctedExplanation,
                                topic: question.topic,
                            };
                            validQuestions.push(correctedQuestion);
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
                                explanation: question.explanation, // OG explanation (if question is perfect) -> This process ensures a clean, corrected question with good questions, options, answer, and explaanation
                                topic: question.topic,
                            };
                            validQuestions.push(perfectQuestion);
                        }
                        console.log(`Question accepted (score: ${validation.score})`);
                    } else {
                        // Reject if question is flawed
                        console.log(`Rejected (score: ${validation.score}): ${validation.issues.join(", ")}`);
                    }
                }
            }
        }
        if (validQuestions.length === 0) {
            throw new Error("No valid questions could be generated. Please try again.");
        }
        const finalQuestions = validQuestions.slice(0, numquestions);
        // FINAL DEBUG
        console.log(`\nFINAL QUESTIONS BEING RETURNED:`);
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
 * Check student answer
 * @param {{ questions: Array<{ id: number, question: string, options: {[key: string]: string},
 * correctAnswer: string, explanation: string}>}} quiz - Quiz object containing questions, options, and correct answers
 * @param {Array<string>} studentAnswer
 * @returns {{ score: number, total: number, percentage: number, results:
 * Array<{ questionId: number, correct: boolean, studentAnswer: string, correctAnswer: string, explanation: string }>}}
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
        score: correct,
        total: questions.length,
        percentage: Math.round((correct / questions.length) * 100),
        results: results,
    };
}
