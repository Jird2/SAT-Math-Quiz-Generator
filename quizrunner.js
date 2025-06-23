import express from "express";
import dotenv from "dotenv";
import { generateQuiz, gradeQuiz } from "./quizgeneratorai.js";
const app = express();
const port = 3000;
dotenv.config();
app.use(express.json()); //to parse Json request bodies
app.get("/", (_req, res) => {
    res.json({ message: "Quiz server is running!" });
});
app.get("/quiz", (req, res) => {
    // Hard-coded sample quiz for testing (no OpenAI calls)
    const sampleQuiz = {
        gradeLevel: "9th Grade",
        difficulty: "easy",
        questions: [
            {
                id: 1,
                question: "If x + 5 = 12, what is the value of x?",
                options: {
                    A: "2",
                    B: "7",
                    C: "12",
                    D: "17",
                },
                correctAnswer: "B",
                explanation: "Subtract 5 from both sides: x + 5 - 5 = 12 - 5, so x = 7",
            },
            {
                id: 2,
                question: "What is the area of a rectangle with length 8 and width 3?",
                options: {
                    A: "11",
                    B: "22",
                    C: "24",
                    D: "32",
                },
                correctAnswer: "C",
                explanation: "Area = length × width = 8 × 3 = 24",
            },
        ],
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Quiz</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .quiz-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .quiz-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .question {
            background: #f9f9f9;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
        }
        .question h3 {
            margin-top: 0;
            color: #333;
        }
        .options {
            margin: 15px 0;
        }
        .option {
            margin: 10px 0;
            padding: 8px;
        }
        .option input {
            margin-right: 10px;
        }
        .option label {
            cursor: pointer;
            padding: 5px;
        }
        button {
            background: #2196F3;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
        }
        button:hover {
            background: #1976D2;
        }
        #results {
            margin-top: 20px;
            padding: 20px;
            background: #f1f8e9;
            border-radius: 5px;
            display: none;
        }
        .correct {
            color: #4caf50;
            font-weight: bold;
        }
        .incorrect {
            color: #f44336;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="quiz-container">
        <h1>Math Quiz</h1>
        
        <div class="quiz-info">
            <strong>Grade Level:</strong> ${sampleQuiz.gradeLevel} | 
            <strong>Difficulty:</strong> ${sampleQuiz.difficulty} | 
            <strong>Questions:</strong> ${sampleQuiz.questions.length}
        </div>

        <form id="quizForm">
            ${sampleQuiz.questions
                .map(
                    (question, index) => `
                <div class="question">
                    <h3>Question ${question.id}: ${question.question}</h3>
                    <div class="options">
                        ${Object.entries(question.options)
                            .map(
                                ([key, value]) => `
                            <div class="option">
                                <input type="radio" 
                                       id="q${question.id}_${key}" 
                                       name="question${question.id}" 
                                       value="${key}">
                                <label for="q${question.id}_${key}">${key}. ${value}</label>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            `
                )
                .join("")}
            
            <button type="submit">Submit Quiz</button>
        </form>

        <div id="results"></div>
    </div>

    <script>
        // Store the quiz data for grading
        const quizData = ${JSON.stringify(sampleQuiz)};
        
        document.getElementById('quizForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect student answers
            const studentAnswers = [];
            quizData.questions.forEach(question => {
                const selected = document.querySelector(\`input[name="question\${question.id}"]:checked\`);
                studentAnswers.push(selected ? selected.value : null);
            });
            
            // Check if all questions are answered
            if (studentAnswers.includes(null)) {
                alert('Please answer all questions before submitting!');
                return;
            }
            
            try {
                // Send to your grading endpoint
                const response = await fetch('/gradeQuiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        quiz: { questions: quizData.questions },
                        studentAnswer: studentAnswers
                    })
                });
                
                const results = await response.json();
                displayResults(results);
                
            } catch (error) {
                console.error('Error grading quiz:', error);
                alert('Error grading quiz. Check the console for details.');
            }
        });
        
        function displayResults(results) {
            const resultsDiv = document.getElementById('results');
            
            let html = \`
                <h2>Quiz Results</h2>
                <p><strong>Score: \${results.score}/\${results.total} (\${results.percentage}%)</strong></p>
                <hr>
            \`;
            
            results.results.forEach((result, index) => {
                const question = quizData.questions[index];
                const statusClass = result.correct ? 'correct' : 'incorrect';
                const statusText = result.correct ? '✓ Correct' : '✗ Incorrect';
                
                html += \`
                    <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                        <p><strong>Question \${question.id}:</strong> \${question.question}</p>
                        <p class="\${statusClass}">Your answer: \${result.studentAnswer} - \${statusText}</p>
                        \${!result.correct ? \`<p>Correct answer: \${result.correctAnswer}</p>\` : ''}
                        <p><em>Explanation: \${result.explanation}</em></p>
                    </div>
                \`;
            });
            
            resultsDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
            
            // Scroll to results
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
    `;

    res.send(html);
});
app.post("/generateQuiz", async (req, res) => {
    const { gradelevel, numquestions, difficulty } = req.body;
    try {
        const quiz = await generateQuiz(gradelevel, numquestions, difficulty);
        res.json(quiz);
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
