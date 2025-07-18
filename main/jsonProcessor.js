import JSON5 from "json5";
/**
 * Extract JSON from AI response that may contain thinking/reasoning text
 * @param {string} content
 * @returns {string}
 */
export function extractJSONFromResponse(content) {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

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
 * @param {string} content
 * @returns {string}
 */
export function sanitizeJSONContent(content) {
    let cleaned = content.trim();
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
 * @param {string} content
 * @returns {any}
 */
export function parseJSONWithFallbacks(content) {
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
