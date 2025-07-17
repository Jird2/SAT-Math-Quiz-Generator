/**
 * @typedef {Object} Quiz
 * @property {string[]} selectedClasses
 * @property {string} difficulty
 * @property {QuizQuestion[]} questions
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {number} id
 * @property {string} question
 * @property {Object.<string, string>} options
 * @property {string} correctAnswer
 * @property {string} explanation
 */

/**
 * @type {Quiz | null}
 */
let currentQuiz = null;
/**
 * @type {string[]}
 */
let selectedMathClasses = [];
const idlePhrases = ["Ready to ace your SAT Math? Let's get started!", "Math is like a puzzle, let's solve it together!", "Practice makes perfect! You've got this!", "Don't give up!", "Let's turn those math challenges into victories!", "Let's be better than yesterday!"];

let currentPhraseIndex = 0;
/**
 * @type {string | number | NodeJS.Timeout | undefined}
 */
let phraseInterval;
let isUserAction = false;

function startPhraseRotation() {
    if (isUserAction) return;

    phraseInterval = setInterval(() => {
        if (!isUserAction) {
            updateMascotMessage(idlePhrases[currentPhraseIndex]);
            currentPhraseIndex = (currentPhraseIndex + 1) % idlePhrases.length;
        }
    }, 10000);
}

function stopPhraseRotation() {
    /**
     * @param {number} phraseInterval
     * @returns {number | undefined}
     */
    if (phraseInterval) {
        clearInterval(phraseInterval);
    }
}

/**
 * @param {string} message
 * @param {boolean} isAction
 */
function updateMascotMessage(message, isAction = false) {
    const speechBubble = document.getElementById("mascotSpeech");
    if (speechBubble) {
        speechBubble.textContent = message;
    }

    isUserAction = isAction;

    if (isAction) {
        stopPhraseRotation();
        setTimeout(() => {
            isUserAction = false;
            startPhraseRotation();
        }, 5000);
    }
}
function initializeModernDropdown() {
    const dropdownSelected = document.getElementById("dropdownSelected");
    const dropdownList = document.getElementById("dropdownList");
    // const selectedTags = document.getElementById("selectedClassesTags");

    if (!dropdownSelected || !dropdownList) return;
    dropdownSelected.addEventListener("click", () => {
        dropdownList.classList.toggle("open");
        dropdownSelected.classList.toggle("active");
        const arrow = dropdownSelected.querySelector(".select-arrow");
        if (arrow) {
            arrow.classList.toggle("rotated");
        }
    });

    document.addEventListener("click", (e) => {
        const mathClassesDropdown = document.getElementById("mathClassesDropdown");
        if (!mathClassesDropdown || !e.target || !(e.target instanceof Node) || !mathClassesDropdown.contains(e.target)) {
            dropdownList.classList.remove("open");
            dropdownSelected.classList.remove("active");
            const arrow = dropdownSelected.querySelector(".select-arrow");
            if (arrow) {
                arrow.classList.remove("rotated");
            }
        }
    });

    // Handle option selection
    document.querySelectorAll(".dropdown-option").forEach((option) => {
        option.addEventListener("click", (e) => {
            if (!e.target || !(e.target instanceof HTMLElement)) return;
            const value = e.target.dataset.value;

            if (!value) return;

            if (selectedMathClasses.includes(value)) {
                selectedMathClasses = selectedMathClasses.filter((cls) => cls !== value);
                option.classList.remove("selected");
            } else {
                selectedMathClasses.push(value);
                option.classList.add("selected");
            }
            updateModernSelectedDisplay();
        });
    });
}
function updateModernSelectedDisplay() {
    const dropdownSelected = document.getElementById("dropdownSelected");
    const selectedTags = document.getElementById("selectedClassesTags");

    if (!dropdownSelected) return;

    const placeholder = dropdownSelected.querySelector("span");
    if (!placeholder) return;

    if (selectedMathClasses.length === 0) {
        placeholder.textContent = "Select Math Classes";
        placeholder.classList.remove("has-selections");
    } else if (selectedMathClasses.length === 1) {
        placeholder.textContent = selectedMathClasses[0];
        placeholder.classList.add("has-selections");
    } else if (selectedMathClasses.length === 5) {
        placeholder.textContent = "All classes selected";
        placeholder.classList.add("has-selections");
    } else {
        placeholder.textContent = `${selectedMathClasses.length} classes selected`;
        placeholder.classList.add("has-selections");
    }

    if (selectedTags) {
        // @ts-ignore
        selectedTags.innerHTML = selectedMathClasses
            .map(
                (cls) =>
                    `<span class="class-tag">
                ${cls}
                <span class="remove-tag" onclick="removeModernTag('${cls}')">×</span>
            </span>`
            )
            .join("");
    }
}

/**
 * @param {string} className
 */
function removeModernTag(className) {
    selectedMathClasses = selectedMathClasses.filter((cls) => cls !== className);
    const option = document.querySelector(`[data-value="${className}"]`);
    if (option) {
        option.classList.remove("selected");
    }
    updateModernSelectedDisplay();
}

window.removeModernTag = removeModernTag;

// Demo shortcut - Press Ctrl + . to jump to results page
document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === ".") {
        e.preventDefault();
        currentQuiz = {
            selectedClasses: ["Algebra II", "Trigonometry"],
            difficulty: "medium",
            questions: [
                {
                    id: 1,
                    question: "Solve for x: x² - 5x + 6 = 0",
                    options: {
                        A: "x = 2, x = 3",
                        B: "x = 1, x = 6",
                        C: "x = -2, x = -3",
                        D: "x = 0, x = 5",
                    },
                    correctAnswer: "A",
                    explanation: "Factor the quadratic equation to (x - 2)(x - 3) = 0, leading to x = 2 or x = 3.",
                },
                {
                    id: 2,
                    question: "If sin θ = 3/5 and θ is in the second quadrant, what is cos θ?",
                    options: {
                        A: "4/5",
                        B: "-4/5",
                        C: "3/4",
                        D: "-3/4",
                    },
                    correctAnswer: "B",
                    explanation: "Use the Pythagorean identity: sin²θ + cos²θ = 1. Since θ is in the second quadrant, cosine is negative. Therefore, cos θ = -4/5.",
                },
                {
                    id: 3,
                    question: "Simplify: log₃(27) + log₃(9)",
                    options: {
                        A: "5",
                        B: "4",
                        C: "6",
                        D: "3",
                    },
                    correctAnswer: "A",
                    explanation: "log₃(27) = 3 and log₃(9) = 2, so the sum is 3 + 2 = 5.",
                },
            ],
        };

        // Mock results with some correct and incorrect answers (Demo purposes)
        const mockResults = {
            score: 2,
            total: 3,
            percentage: 67,
            results: [
                {
                    questionId: 1,
                    correct: true,
                    studentAnswer: "A",
                    correctAnswer: "A",
                    explanation: "Factor the quadratic equation to (x - 2)(x - 3) = 0, leading to x = 2 or x = 3.",
                },
                {
                    questionId: 2,
                    correct: false,
                    studentAnswer: "A",
                    correctAnswer: "B",
                    explanation: "Use the Pythagorean identity: sin²θ + cos²θ = 1. Since θ is in the second quadrant, cosine is negative. Therefore, cos θ = -4/5.",
                },
                {
                    questionId: 3,
                    correct: true,
                    studentAnswer: "A",
                    correctAnswer: "A",
                    explanation: "log₃(27) = 3 and log₃(9) = 2, so the sum is 3 + 2 = 5.",
                },
            ],
        };
        const generatorCard = document.getElementById("generatorCard");
        if (generatorCard instanceof HTMLElement) {
            generatorCard.style.display = "none";
        }
        displayResults(mockResults);

        console.log("Demo mode activated! Press Ctrl+. to test results page anytime.");
    }
});

function selectAllClasses() {
    const checkboxes = document.querySelectorAll('.multi-select-option input[type="checkbox"]');
    checkboxes.forEach(
        /** @param {Element} cb */ (cb) => {
            if (cb instanceof HTMLInputElement) {
                cb.checked = true;
            }
        }
    );
    updateSelectedClasses();
}

function clearAllClasses() {
    const checkboxes = document.querySelectorAll('.multi-select-option input[type="checkbox"]');
    checkboxes.forEach(
        /** @param {Element} cb */ (cb) => {
            if (cb instanceof HTMLInputElement) {
                cb.checked = false;
            }
        }
    );
    updateSelectedClasses();
}

const mathClassesHeader = document.getElementById("mathClassesHeader");
if (mathClassesHeader instanceof HTMLElement) {
    mathClassesHeader.addEventListener("click", function () {
        const dropdown = document.getElementById("mathClassesDropdown");
        const arrow = this.querySelector(".dropdown-arrow");

        if (dropdown) {
            dropdown.classList.toggle("open");
        }
        if (arrow) {
            arrow.classList.toggle("rotated");
        }
        this.classList.toggle("active");
    });
}

document.querySelectorAll('.multi-select-option input[type="checkbox"]').forEach(
    /** @param {Element} checkbox */ (checkbox) => {
        if (checkbox instanceof HTMLInputElement) {
            checkbox.addEventListener("change", function () {
                if (this.value === "select-all") {
                    handleSelectAll(this.checked);
                } else {
                    handleIndividualSelection();
                }
                updateSelectedClasses();
            });
        }
    }
);

/**
 * @param {boolean} isChecked
 */
function handleSelectAll(isChecked) {
    const checkboxes = document.querySelectorAll('.multi-select-option input[type="checkbox"]:not([value="select-all"])');

    checkboxes.forEach(
        /** @param {Element} checkbox */ (checkbox) => {
            if (checkbox instanceof HTMLInputElement) {
                checkbox.checked = isChecked;
            }
        }
    );
}

function handleIndividualSelection() {
    const selectAllCheckbox = document.getElementById("selectAll");
    const otherCheckboxes = document.querySelectorAll('.multi-select-option input[type="checkbox"]:not([value="select-all"])');
    const checkedOthers = document.querySelectorAll('.multi-select-option input[type="checkbox"]:not([value="select-all"]):checked');

    if (selectAllCheckbox instanceof HTMLInputElement) {
        if (checkedOthers.length === otherCheckboxes.length) {
            // All individual items are selected
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedOthers.length > 0) {
            // Some individual items are selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            // No individual items are selected
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }
}

function updateSelectedClasses() {
    const checkboxes = document.querySelectorAll('.multi-select-option input[type="checkbox"]:not([value="select-all"])');
    selectedMathClasses = Array.from(checkboxes)
        .filter(/** @param {Element} cb */ (cb) => cb instanceof HTMLInputElement && cb.checked)
        .map(/** @param {Element} cb */ (cb) => (cb instanceof HTMLInputElement ? cb.value : ""));

    updateClassesDisplay();
    updateClassesTags();

    handleIndividualSelection();
}

function updateClassesDisplay() {
    const header = document.getElementById("mathClassesHeader");
    if (!header) return;

    const placeholder = header.querySelector(".placeholder");
    if (!placeholder) return;

    if (selectedMathClasses.length === 0) {
        placeholder.textContent = "Select Math Classes";
        placeholder.classList.remove("has-selections");
    } else if (selectedMathClasses.length === 1) {
        placeholder.textContent = selectedMathClasses[0];
        placeholder.classList.add("has-selections");
    } else if (selectedMathClasses.length === 5) {
        placeholder.textContent = "All classes selected";
        placeholder.classList.add("has-selections");
    } else {
        placeholder.textContent = `${selectedMathClasses.length} classes selected`;
        placeholder.classList.add("has-selections");
    }
}

function updateClassesTags() {
    const container = document.getElementById("selectedClassesTags");
    if (!container) return;
    container.innerHTML = selectedMathClasses
        .map(
            /** @param {string} cls */ (cls) =>
                `<span class="class-tag">
            ${cls}
            <span class="remove-tag" onclick="removeClassTag('${cls}')">×</span>
        </span>`
        )
        .join("");
}

/**
 * @param {string} className
 */
function removeClassTag(className) {
    const checkbox = document.querySelector(`input[value="${className}"]`);
    if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = false;
        updateSelectedClasses();
    }
}

// Make functions globally accessible for onclick handlers
window.removeClassTag = removeClassTag;
window.selectAllClasses = selectAllClasses;
window.clearAllClasses = clearAllClasses;

document.addEventListener("click", function (event) {
    const container = document.querySelector(".multi-select-container");
    const target = event.target;
    if (container && target instanceof Node && !container.contains(target)) {
        const dropdown = document.getElementById("mathClassesDropdown");
        const header = document.getElementById("mathClassesHeader");
        const arrow = header ? header.querySelector(".dropdown-arrow") : null;

        if (dropdown) {
            dropdown.classList.remove("open");
        }
        if (arrow) {
            arrow.classList.remove("rotated");
        }
        if (header) {
            header.classList.remove("active");
        }
    }
});

const numQuestionsInput = document.getElementById("numQuestions");
if (numQuestionsInput instanceof HTMLInputElement) {
    numQuestionsInput.addEventListener("input", function () {
        const count = parseInt(this.value);
        const questionCount = document.getElementById("questionCount");
        if (questionCount) {
            questionCount.textContent = `${count} Question${count != 1 ? "s" : ""}`;
        }
    });
}

// Generate Quiz
const generateBtn = document.getElementById("generateBtn");
if (generateBtn instanceof HTMLButtonElement) {
    generateBtn.addEventListener("click", async function () {
        const numQuestionsInput = document.getElementById("numQuestions");
        const difficultyInput = document.querySelector('input[name="difficulty"]:checked');

        if (!(numQuestionsInput instanceof HTMLInputElement) || !(difficultyInput instanceof HTMLInputElement)) {
            showError("Please fill in all required fields.");
            return;
        }

        const numQuestions = parseInt(numQuestionsInput.value);
        const difficulty = difficultyInput.value;

        if (selectedMathClasses.length === 0) {
            showError("Please select at least one math class.");
            return;
        }

        if (selectedMathClasses.length > 5) {
            showError("Please select no more than 5 math classes.");
            return;
        }

        updateMascotMessage("Generating your quiz...", true);
        const btn = this;
        const loading = document.getElementById("loading");
        const errorMessage = document.getElementById("errorMessage");
        const warningMessage = document.getElementById("warningMessage");

        btn.disabled = true;
        btn.textContent = "Generating...";
        if (loading instanceof HTMLElement) loading.style.display = "flex";
        if (errorMessage instanceof HTMLElement) errorMessage.style.display = "none";
        if (warningMessage instanceof HTMLElement) warningMessage.style.display = "none";

        try {
            setTimeout(() => {
                updateMascotMessage("Creating challenging math problems...", true);
            }, 3000);

            setTimeout(() => {
                updateMascotMessage("Almost ready! Finalizing your quiz...", true);
            }, 6000);

            const response = await fetch("/generateQuiz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    selectedClasses: selectedMathClasses,
                    numquestions: numQuestions,
                    difficulty: difficulty,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate quiz");
            }

            updateMascotMessage("Quiz ready! Let's ace these questions!", true);

            // Check if some questions were filtered out due to validation
            if (data.quiz.questions.length < numQuestions) {
                showWarning(`Generated ${data.quiz.questions.length} questions instead of ${numQuestions} due to quality validation.`);
            }
            currentQuiz = data.quiz;
            displayQuiz(currentQuiz);
        } catch (error) {
            console.error("Error generating quiz:", error);
            showError("Failed to generate quiz. Please try again.");
            updateMascotMessage("Oops! Something went wrong. Let's try again!", true);
        } finally {
            btn.disabled = false;
            btn.textContent = "Generate Quiz!";
            if (loading instanceof HTMLElement) loading.style.display = "none";
        }
    });
}

/**
 * @param {any} quiz
 */
function displayQuiz(quiz) {
    const quizInfo = document.getElementById("quizInfo");
    const questionsContainer = document.getElementById("questionsContainer");

    // Hide mascot area for quiz page
    const mascotArea = document.querySelector(".mascot-area");
    if (mascotArea instanceof HTMLElement) {
        mascotArea.style.display = "none";
    }

    const contentArea = document.querySelector(".content-area");
    if (contentArea instanceof HTMLElement) {
        contentArea.style.flex = "1";
    }
    updateMascotMessage("", true);
    // Populate quiz info
    if (quizInfo) {
        quizInfo.innerHTML = `
            <div class="quiz-info-item">${quiz.selectedClasses.join(", ")}</div>
            <div class="quiz-info-item">${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)} Level</div>
            <div class="quiz-info-item">${quiz.questions.length} Questions</div>
        `;
    }
    if (questionsContainer) {
        questionsContainer.innerHTML = quiz.questions
            .map(
                /** @param {any} question @param {number} index */ (question, index) => `
            <div class="question ${index === 0 ? "question-with-mascot" : ""}">
                ${
                    index === 0
                        ? `
                    <div class="question-mascot">
                        <img src="/public/assets/Brainy.svg" alt="Brainy Mascot" class="brainy-mascot">
                    </div>
                `
                        : ""
                }
                <div class="question-content-wrapper">
                    <h3>Question ${question.id || index + 1}: ${question.question}</h3>
                    <div class="options">
                        ${Object.entries(question.options)
                            .map(
                                /** @param {[string, string]} entry */ ([key, value]) => `
                            <div class="option">
                                <input type="radio" id="q${index}_${key}" name="question_${index}" value="${key}">
                                <label for="q${index}_${key}">${key}. ${value}</label>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            </div>
        `
            )
            .join("");
    }
    const generatorCard = document.getElementById("generatorCard");
    const quizCard = document.getElementById("quizCard");
    const quizContainer = document.getElementById("quizContainer");

    if (generatorCard instanceof HTMLElement) generatorCard.style.display = "none";
    if (quizCard instanceof HTMLElement) quizCard.style.display = "block";
    if (quizContainer instanceof HTMLElement) quizContainer.style.display = "block";
}

const quizForm = document.getElementById("quizForm");
if (quizForm instanceof HTMLFormElement) {
    quizForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        //@ts-ignore
        if (!currentQuiz) {
            alert("No quiz to submit");
            return;
        }
        updateMascotMessage("Checking your answers...", true);
        // Collect answers
        const studentAnswers = [];
        for (let i = 0; i < currentQuiz.questions.length; i++) {
            const selectedOption = document.querySelector(`input[name="question_${i}"]:checked`);
            if (selectedOption instanceof HTMLInputElement) {
                studentAnswers.push(selectedOption.value);
            } else {
                studentAnswers.push("");
            }
        }
        const unanswered = studentAnswers.filter(/** @param {string} answer */ (answer) => answer === "").length;
        if (unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
                updateMascotMessage("Take your time! Answer all questions when ready.", true);
                return;
            }
        }

        try {
            const response = await fetch("/gradeQuiz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quiz: currentQuiz,
                    studentAnswer: studentAnswers,
                }),
            });

            const results = await response.json();

            if (!response.ok) {
                throw new Error(results.error || "Failed to grade quiz");
            }

            displayResults(results);
        } catch (error) {
            console.error("Error grading quiz:", error);
            alert("Error grading quiz. Please try again.");
            updateMascotMessage("Hmm, trouble grading. Let's try that again! 🔄", true);
        }
    });
}

/**
 * @param {any} results
 */
function displayResults(results) {
    const mascotArea = document.querySelector(".mascot-area");
    if (mascotArea instanceof HTMLElement) {
        mascotArea.style.display = "none";
    }
    const contentArea = document.querySelector(".content-area");
    if (contentArea instanceof HTMLElement) {
        contentArea.style.flex = "1";
    }
    const percentage = results.percentage;
    if (percentage >= 80) {
        updateMascotMessage("Outstanding work! You're SAT ready!", true);
    } else if (percentage >= 60) {
        updateMascotMessage("Good job! Keep practicing!", true);
    } else {
        updateMascotMessage("Don't give up! Practice makes perfect!", true);
    }
    const resultsContent = results.results
        .map(
            /** @param {any} result @param {number} index */ (result, index) => {
                if (!currentQuiz) return "";
                const question = currentQuiz.questions[index];
                const isCorrect = result.correct;
                const statusClass = isCorrect ? "correct" : "incorrect";
                const statusIcon = isCorrect ? "✅" : "❌";
                const showCorrectAnswer = !isCorrect;

                return `
            <div class="question-result ${statusClass} ${index === 0 ? "question-result-with-mascot" : ""}">
                ${
                    index === 0
                        ? `
                    <div class="result-mascot">
                        <img src="/public/assets/Brainy.svg" alt="Brainy Mascot" class="brainy-mascot">
                    </div>
                `
                        : ""
                }
                
                <div class="result-content-wrapper">
                    <div class="question-header">
                        <div class="status-icon ${statusClass}">
                            ${statusIcon}
                        </div>
                        <div class="question-content">
                            <div class="question-title">
                                <strong>Question ${question.id}:</strong> ${question.question}
                            </div>
                        </div>
                    </div>

                    <div class="answer-comparison">
                        <!-- Student Answer -->
                        <div class="answer-item student-answer ${isCorrect ? "correct" : "incorrect"}">
                            <div class="answer-icon ${isCorrect ? "correct" : "incorrect"}">
                                ${isCorrect ? "✓" : "✗"}
                            </div>
                            <div>
                                <div class="answer-label">Your Answer</div>
                                <div class="answer-text">
                                    <strong>${result.studentAnswer || "No answer selected"}</strong>
                                    ${result.studentAnswer ? ` - ${question.options[result.studentAnswer] || "Invalid option"}` : ""}
                                </div>
                            </div>
                        </div>

                        <!-- Correct Answer (only show if student was wrong) -->
                        ${
                            showCorrectAnswer
                                ? `
                            <div class="answer-item correct-answer">
                                <div class="answer-icon correct">✓</div>
                                <div>
                                    <div class="answer-label">Correct Answer</div>
                                    <div class="answer-text">
                                        <strong>${result.correctAnswer}</strong> - ${question.options[result.correctAnswer]}
                                    </div>
                                </div>
                            </div>
                        `
                                : ""
                        }
                    </div>

                    <!-- Explanation -->
                    <div class="explanation-section">
                        <div class="explanation-header">
                            <span>💡</span>
                            <span>Explanation</span>
                        </div>
                        <div class="explanation-text">
                            ${result.explanation}
                        </div>
                    </div>
                </div>
            </div>
        `;
            }
        )
        .join("");
    const resultsCard = document.getElementById("resultsCard");
    if (resultsCard) {
        resultsCard.innerHTML = `
            <div class="results" id="results">
                <div class="results-main-wrapper">
                    <div class="results-content-area">
                        <div class="results-header">
                            <h2>Quiz Results</h2>
                            <div class="score-display">
                                ${results.score}/${results.total}
                            </div>
                            <p class="score-subtitle">Your Performance Analysis</p>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value">${results.score}</div>
                                    <div class="stat-label">Correct</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${results.total - results.score}</div>
                                    <div class="stat-label">Incorrect</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${results.percentage}%</div>
                                    <div class="stat-label">Score</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="results-actions">
                            <button class="action-btn btn-secondary" id="backBtn">
                                ← Generate New Quiz
                            </button>
                        </div>
                        
                        <div id="resultsContainer">
                            ${resultsContent}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Re-attach event listeners after updating HTML
        const backBtn = document.getElementById("backBtn");
        if (backBtn) {
            backBtn.addEventListener("click", function () {
                const mascotArea = document.querySelector(".mascot-area");
                if (mascotArea instanceof HTMLElement) {
                    mascotArea.style.display = "flex";
                }

                // Restore content area width
                const contentArea = document.querySelector(".content-area");
                if (contentArea instanceof HTMLElement) {
                    contentArea.style.flex = "2";
                }
                const resultsCard = document.getElementById("resultsCard");
                const generatorCard = document.getElementById("generatorCard");
                if (resultsCard) resultsCard.style.display = "none";
                if (generatorCard) generatorCard.style.display = "block";

                currentQuiz = null;

                // Reset mascot message and restart rotation (no text)
                updateMascotMessage("Ready to ace your SAT Math? Let's get started!");
                startPhraseRotation();

                selectedMathClasses = [];

                // Reset ALL checkboxes including select-all
                document.querySelectorAll('.multi-select-option input[type="checkbox"]').forEach(
                    /** @param {Element} cb */ (cb) => {
                        if (cb instanceof HTMLInputElement) {
                            cb.checked = false;
                            cb.indeterminate = false;
                        }
                    }
                );

                const dropdown = document.getElementById("mathClassesDropdown");
                const header = document.getElementById("mathClassesHeader");
                const arrow = header ? header.querySelector(".dropdown-arrow") : null;

                if (dropdown) dropdown.classList.remove("open");
                if (arrow) arrow.classList.remove("rotated");
                if (header) header.classList.remove("active");

                updateSelectedClasses();

                const numQuestionsInput = document.getElementById("numQuestions");
                const questionCount = document.getElementById("questionCount");
                if (numQuestionsInput instanceof HTMLInputElement) numQuestionsInput.value = "5";
                if (questionCount) questionCount.textContent = "5 Questions";

                document.querySelectorAll('input[name="difficulty"]').forEach(
                    /** @param {Element} radio */ (radio) => {
                        if (radio instanceof HTMLInputElement) {
                            radio.checked = false;
                        }
                    }
                );
                const mediumRadio = document.querySelector('input[name="difficulty"][value="medium"]');
                if (mediumRadio instanceof HTMLInputElement) mediumRadio.checked = true;

                const errorMessage = document.getElementById("errorMessage");
                const warningMessage = document.getElementById("warningMessage");
                if (errorMessage) errorMessage.style.display = "none";
                if (warningMessage) warningMessage.style.display = "none";

                const quizContainer = document.getElementById("quizContainer");
                const results = document.getElementById("results");
                const quizCard = document.getElementById("quizCard");

                if (quizContainer) quizContainer.style.display = "none";
                if (results) results.style.display = "none";
                if (quizCard) quizCard.style.display = "none";

                const generateBtn = document.getElementById("generateBtn");
                if (generateBtn instanceof HTMLButtonElement) {
                    generateBtn.disabled = false;
                    generateBtn.textContent = "Generate Quiz!";
                }

                // Complete UI refresh
                setTimeout(() => {
                    window.scrollTo(0, 0);
                }, 100);
            });
        }
    }
    // Show results, hide quiz
    const quizCard = document.getElementById("quizCard");
    const resultsCardFinal = document.getElementById("resultsCard");
    const resultsFinal = document.getElementById("results");

    if (quizCard) quizCard.style.display = "none";
    if (resultsCardFinal) resultsCardFinal.style.display = "block";
    if (resultsFinal) resultsFinal.style.display = "block";
}
/**
 *
 * @param {string} message
 */
function showError(message) {
    const errorMessage = document.getElementById("errorMessage");
    const warningMessage = document.getElementById("warningMessage");

    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    }

    if (warningMessage) {
        warningMessage.style.display = "none";
    }
}

/**
 * @typedef {Object} WarningElements
 * @property {HTMLElement | null} warningMessage
 * @property {HTMLElement | null} errorMessage
 */

/**
 * @param {string} message
 */
function showWarning(message) {
    const warningMessage = document.getElementById("warningMessage");
    const errorMessage = document.getElementById("errorMessage");

    if (warningMessage) {
        warningMessage.textContent = message;
        warningMessage.style.display = "block";
    }

    if (errorMessage) {
        errorMessage.style.display = "none";
    }
}

// Start the phrase rotation when page loads
document.addEventListener("DOMContentLoaded", function () {
    startPhraseRotation();
    initializeModernDropdown();
});
