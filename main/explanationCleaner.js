/**
 * Clean up explanations by removing self-doubt and recalculation attempts
 * @param {string} explanation
 * @returns {string}
 */
export function cleanExplanation(explanation) {
    if (!explanation || typeof explanation !== "string") return explanation;

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
