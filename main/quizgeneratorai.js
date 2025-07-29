// @ts-check
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
// Internal modules
import { MathQuestionValidator } from "./quizvalidator.js";
import { parseJSONWithFallbacks } from "./jsonProcessor.js";
import { formatWithKaTeX } from "./mathFormatting.js";
import { cleanExplanation } from "./explanationCleaner.js";
// Config + util
import { mathClasses, isValidMathClasses, isValidDifficulty, isValidNumQuestions } from "../config/generationconstants.js";
import { createSystemPrompt, CACHED_FORMATTING_RULES, CACHED_DIVERSITY_RULES, CACHED_QUALITY_STANDARDS } from "../config/cachedPrompts.js";
import { buildDynamicPrompt } from "../util/promptUtils.js";
dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * @typedef {"easy" | "medium" | "hard"} Difficulty
 * @typedef {"Algebra I" | "Geometry" | "Algebra II" | "Trigonometry" | "Pre-Calculus"} MathClassName
 */

/**
 * Generate a quiz with the specified parameters
 * @param {string[]} selectedClasses
 * @param {number} numquestions
 * @param {Difficulty} difficulty
 * @returns {Promise<{quiz: {selectedClasses: string[], difficulty: string, questions: any[]}}>}
 */
export async function generateQuiz(selectedClasses = [], numquestions = 0, difficulty = "medium") {
    try {
        if (!isValidMathClasses(selectedClasses)) {
            throw new Error("Please select 1-5 valid math classes.");
        }
        if (!isValidNumQuestions(numquestions)) {
            throw new Error("Number of questions must be a positive number between 1 and 10.");
        }
        if (!isValidDifficulty(difficulty)) {
            throw new Error("Difficulty must be 'easy', 'medium', or 'hard'.");
        }
        /** @type {MathClassName[]} */
        const validatedClasses = /** @type {MathClassName[]} */ (selectedClasses);

        const allTopics = validatedClasses.flatMap((cls) => mathClasses[cls]);
        if (!allTopics || allTopics.length === 0) {
            throw new Error("No topics available for selected classes.");
        }

        console.log(`Generating ${numquestions} ${difficulty} questions from classes: ${validatedClasses.join(", ")}...`);

        const maxAttempts = 3;
        let validQuestions = [];
        let correctedQuestions = [];

        for (let attempt = 1; attempt <= maxAttempts && validQuestions.length < numquestions; attempt++) {
            console.log(`Attempt ${attempt}/${maxAttempts}...`);

            const questionsToGenerate = Math.min(5, (numquestions - validQuestions.length) * 2);
            const dynamicPrompt = buildDynamicPrompt(validatedClasses, difficulty, questionsToGenerate);
            const systemPrompt = createSystemPrompt(difficulty);
            console.log("System prompt length:", systemPrompt.length);
            console.log("Cached rules length:", CACHED_FORMATTING_RULES.length);
            //region API Prompt Caching
            const response = await anthropic.messages.create({
                model: "claude-opus-4-20250514",
                max_tokens: 8000,
                temperature: 0.4,
                stream: true,
                stop_sequences: ["}]}}"],
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: CACHED_DIVERSITY_RULES,
                                cache_control: { type: "ephemeral" },
                            },
                            {
                                type: "text",
                                text: CACHED_QUALITY_STANDARDS,
                                cache_control: { type: "ephemeral" },
                            },
                            {
                                type: "text",
                                text: CACHED_FORMATTING_RULES + "\n\n IMPORTANT: Keep explanations concise (2-3 sentences max). Do not show excessive step-by-step calculations. Focus on the key insight and final answer",
                                cache_control: { type: "ephemeral" },
                            },
                            {
                                type: "text",
                                text: dynamicPrompt,
                            },
                        ],
                    },
                ],
                system: [
                    {
                        type: "text",
                        text: systemPrompt + "\n\nCRITICAL: Keep all explanations brief and concise. Limit each explanation to 2-3 sentences maximum. Do not include lengthy calculations or step-by-step work.",
                        cache_control: { type: "ephemeral" },
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

            if (content.length > 12000) {
                console.warn("Response unusually long, token count will be high.");
            }
            // Parse and validate questions
            const data = parseJSONWithFallbacks(content);

            if (data.quiz && data.quiz.questions) {
                for (const question of data.quiz.questions) {
                    if (validQuestions.length >= numquestions) break;

                    console.log(`Validating: "${question.question.substring(0, 50)}..."`);
                    const validation = MathQuestionValidator.validateQuestion(question);

                    if (validation.isValid) {
                        const processedQuestion = processValidQuestion(question, validation, validQuestions.length + 1);

                        validQuestions.push(processedQuestion.question);

                        if (processedQuestion.wasCorrected) {
                            correctedQuestions.push(processedQuestion.correction);
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

        return formatFinalResult(validQuestions, correctedQuestions, numquestions, validatedClasses, difficulty);
    } catch (e) {
        console.error("Error generating quiz:", e);
        throw e;
    }
}

/**
 * Process a valid question and handle corrections
 * @param {any} question
 * @param {any} validation
 * @param {number} questionId
 * @returns {{question: any, wasCorrected: boolean, correction: any}}
 */
function processValidQuestion(question, validation, questionId) {
    if (validation.correctedAnswer) {
        console.log(`Auto-corrected: ${question.correctAnswer} → ${validation.correctedAnswer}`);

        const correctedExplanation = validation.solution ? MathQuestionValidator.generateCorrectedExplanation(question, validation.solution, validation.correctedAnswer) : question.explanation;

        const cleanedExplanation = cleanExplanation(correctedExplanation);

        const correctedQuestion = {
            id: questionId,
            question: question.question,
            options: { ...question.options },
            correctAnswer: validation.correctedAnswer,
            explanation: cleanedExplanation,
            topic: question.topic,
        };

        const formattedQuestion = formatWithKaTeX(correctedQuestion);

        return {
            question: formattedQuestion,
            wasCorrected: true,
            correction: {
                id: question.id || questionId,
                original: question.correctAnswer,
                corrected: validation.correctedAnswer,
                reason: "Math validation correction with explanation fix",
            },
        };
    } else {
        console.log(`Simple question verified correctly`);

        const perfectQuestion = {
            id: questionId,
            question: question.question,
            options: { ...question.options },
            correctAnswer: question.correctAnswer,
            explanation: cleanExplanation(question.explanation),
            topic: question.topic,
        };

        const formattedQuestion = formatWithKaTeX(perfectQuestion);

        return {
            question: formattedQuestion,
            wasCorrected: false,
            correction: null,
        };
    }
}

/**
 * Format the final quiz result
 * @param {any[]} validQuestions
 * @param {any[]} correctedQuestions
 * @param {number} numquestions
 * @param {MathClassName[]} selectedClasses
 * @param {Difficulty} difficulty
 * @returns {{quiz: {selectedClasses: MathClassName[], difficulty: string, questions: any[]}}}
 */
function formatFinalResult(validQuestions, correctedQuestions, numquestions, selectedClasses, difficulty) {
    const finalQuestions = validQuestions.slice(0, numquestions);

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

    return {
        quiz: {
            selectedClasses: selectedClasses,
            difficulty: difficulty,
            questions: finalQuestions,
        },
    };
}
export { formatWithKaTeX } from "./mathFormatting.js";
export { gradeQuiz } from "./quizGrader.js";
