import express from "express";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { generateQuiz } from "./quizgeneratorai.js";
import { gradeQuiz } from "./quizGrader.js";
import { formatQuizMath } from "./mathFormatting.js";
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
app.use(express.json()); // Parse JSON request bodies
app.use("/public", express.static(path.join(__dirname, "..", "public")));

app.get("/", (_req, res) => {
    res.json({ message: "Quiz server is running!" });
});

app.get("/quiz", (_req, res) => {
    const html = fs.readFileSync(path.join(__dirname, "..", "public", "html", "quiz.html"), "utf8");
    res.send(html);
});

app.post("/generateQuiz", async (req, res) => {
    const { selectedClasses, numquestions, difficulty } = req.body;
    try {
        const quiz = await generateQuiz(selectedClasses, numquestions, difficulty);
        const formattedQuiz = formatQuizMath(quiz);
        res.json(formattedQuiz);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: errorMessage });
    }
});
app.post("/gradeQuiz", (req, res) => {
    const { quiz, studentAnswer } = req.body;
    try {
        const result = gradeQuiz(quiz, studentAnswer);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ error: errorMessage });
    }
});
app.listen(port, () => {
    console.log(`Quiz runner app listening on port ${port}`);
});
