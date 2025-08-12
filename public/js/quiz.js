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
const idlePhrases = [
    // Quadratic Formula & Algebra
    "Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$",
    "Perfect squares: $(a±b)^2 = a^2 ± 2ab + b^2$",
    "Difference of squares: $a^2 - b^2 = (a+b)(a-b)$",
    "Slope formula: $m = \\frac{y_2-y_1}{x_2-x_1}$",

    // Geometry & Area Formulas
    "Circle area: $A = \\pi r^2$, Circumference: $C = 2\\pi r$",
    "Triangle area: $A = \\frac{1}{2}bh$ or $A = \\frac{1}{2}ab\\sin C$",
    "Pythagorean theorem: $a^2 + b^2 = c^2$",
    "30-60-90 triangle sides: $x : x\\sqrt{3} : 2x$",
    "45-45-90 triangle sides: $x : x : x\\sqrt{2}$",

    // Trigonometry
    "SOH-CAH-TOA: $\\sin = \\frac{opp}{hyp}$, $\\cos = \\frac{adj}{hyp}$, $\\tan = \\frac{opp}{adj}$",
    "Pythagorean identity: $\\sin^2\\theta + \\cos^2\\theta = 1$",
    "Unit circle: $(\\cos\\theta, \\sin\\theta)$ at angle $\\theta$",

    // Exponents & Logarithms
    "Exponent rules: $a^m \\cdot a^n = a^{m+n}$, $(a^m)^n = a^{mn}$",
    "Logarithm properties: $\\log(ab) = \\log a + \\log b$",
    "$\\log_a(a^x) = x$ and $a^{\\log_a x} = x$",

    // Statistics & Probability
    "Mean = $\\frac{\\text{sum of values}}{\\text{number of values}}$",
    "Standard deviation measures spread from the mean",
    "Probability: $P(A) = \\frac{\\text{favorable outcomes}}{\\text{total outcomes}}$",

    // Problem-Solving Tips
    "When stuck, try plugging in answer choices (backsolving)!",
    "Draw diagrams for geometry problems - visualize the solution",
    "Check units in word problems - they guide your setup",
    "Estimate first, then calculate for reasonableness checks",
    "Factor before using the quadratic formula - might be easier!",

    // Logic & Strategy
    "If two triangles share angles, they're similar (AA similarity)",
    "Perpendicular lines have slopes that multiply to -1",
    "Zero product property: If $ab = 0$, then $a = 0$ or $b = 0$",
    "Distance formula: $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$",

    // Function & Graph Facts
    "Vertex form: $f(x) = a(x-h)^2 + k$ has vertex at $(h,k)$",
    "Horizontal line test determines if a function has an inverse",
    "Domain restrictions often come from denominators and square roots",
    "Even functions: $f(-x) = f(x)$, Odd functions: $f(-x) = -f(x)$",

    // Special Numbers & Constants
    "$\\pi \\approx 3.14159$, $e \\approx 2.718$, $\\sqrt{2} \\approx 1.414$",
    "Sum of angles in any triangle always equals $180°$",

    // Advanced Tips
    "Synthetic division is faster than long division for polynomials",
    "Completing the square: $x^2 + bx + (\\frac{b}{2})^2$",
    "Law of cosines: $c^2 = a^2 + b^2 - 2ab\\cos C$",
    "Arithmetic sequence: $a_n = a_1 + (n-1)d$",
    "Geometric sequence: $a_n = a_1 \\cdot r^{n-1}$",
];

let currentPhraseIndex = 0;
/**
 * @type {string | number | NodeJS.Timeout | undefined}
 */
let phraseInterval;
let isUserAction = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let speechVisible = true;
let isMinimized = false;
let isPausedByUser = false;
let isAutoRotating = true;

function loadKaTeX() {
    return new Promise((resolve, reject) => {
        // Check if KaTeX is already loaded
        //@ts-ignore
        if (window.katex && window.renderMathInElement) {
            console.log("KaTeX already loaded");
            resolve(undefined);
            return;
        }

        console.log("Loading KaTeX from CDN...");

        // Load KaTeX CSS from CDN
        const katexCSS = document.createElement("link");
        katexCSS.rel = "stylesheet";
        katexCSS.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
        katexCSS.onload = () => console.log("KaTeX CSS loaded from CDN");
        katexCSS.onerror = () => console.error("Failed to load KaTeX CSS from CDN");
        document.head.appendChild(katexCSS);
        // Load main KaTeX script from CDN
        const katexScript = document.createElement("script");
        katexScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
        katexScript.onload = () => {
            console.log("KaTeX main script loaded from CDN");
            // Load auto-render extension from CDN
            const autoRenderScript = document.createElement("script");
            autoRenderScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
            autoRenderScript.onload = () => {
                console.log("KaTeX auto-render loaded from CDN");

                // Double-check that everything is available
                //@ts-ignore
                if (window.renderMathInElement) {
                    console.log("KaTeX fully loaded and ready!");
                    setTimeout(() => resolve(undefined), 100);
                } else {
                    console.error("KaTeX loaded but renderMathInElement not available");
                    reject(new Error("renderMathInElement not available"));
                }
            };
            autoRenderScript.onerror = (error) => {
                console.error("Failed to load auto-render from CDN:", error);
                reject(error);
            };
            document.head.appendChild(autoRenderScript);
        };
        katexScript.onerror = (error) => {
            console.error("Failed to load KaTeX main script from CDN:", error);
            reject(error);
        };
        document.head.appendChild(katexScript);
    });
}

// KaTeX rendering configuration
const katexConfig = {
    delimiters: [
        { left: "$$", right: "$$", display: true }, // Block math
        { left: "$", right: "$", display: false }, // Inline math
        { left: "\\(", right: "\\)", display: false }, // Inline math
        { left: "\\[", right: "\\]", display: true }, // Block math
    ],
    throwOnError: false,
    errorColor: "#cc0000",
};

// Function to render math expressions
function renderMath(element = document.body) {
    console.log("Attempting to render math...");
    //@ts-ignore
    if (!window.renderMathInElement) {
        console.error("renderMathInElement not found");
        return;
    }
    try {
        //@ts-ignore
        window.renderMathInElement(element, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false },
                { left: "\\[", right: "\\]", display: true },
            ],
            throwOnError: false,
            errorColor: "#cc0000",
            // Add these options for better compatibility
            fleqn: false,
            macros: {},
            colorIsTextColor: false,
            maxSize: Infinity,
            maxExpand: 1000,
            strict: "warn",
            trust: false,
        });
        console.log("Math rendering completed");
    } catch (error) {
        console.error("Error rendering math:", error);
    }
}

function startPhraseRotation() {
    if (isUserAction || !isAutoRotating) return;

    phraseInterval = setInterval(() => {
        if (!isUserAction) {
            updateMascotMessage(idlePhrases[currentPhraseIndex]);
            currentPhraseIndex = (currentPhraseIndex + 1) % idlePhrases.length;
        }
    }, 10000);
}

function resetToAutoMode() {
    isAutoRotating = true;
    stopPhraseRotation();
    updateMascotMessage("Ready to ace your SAT Math? Let's go!");
    setTimeout(() => {
        startPhraseRotation();
    }, 3000);
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
        speechBubble.classList.remove("hidden");
        speechVisible = true;
        setTimeout(() => {
            renderMath(speechBubble);
        }, 50);
    }

    isUserAction = isAction;

    if (isAction) {
        stopPhraseRotation();

        // Add attention animation to widget
        const widget = document.getElementById("brainyWidget");
        if (widget) {
            widget.classList.add("attention");
        }

        setTimeout(() => {
            isUserAction = false;
            startPhraseRotation();
            if (widget) {
                widget.classList.remove("attention");
            }
        }, 5000);
    }
}

function showNextFact() {
    currentPhraseIndex = (currentPhraseIndex + 1) % idlePhrases.length;
    const currentFact = idlePhrases[currentPhraseIndex];
    updateMascotMessage(currentFact, true);
}

function toggleSpeechRotation() {
    stopPhraseRotation();
    isAutoRotating = false;
    showNextFact();
}

function initializeWidget() {
    const widget = document.getElementById("brainyWidget");
    const speech = document.getElementById("mascotSpeech");
    const mascot = document.getElementById("widgetMascot");
    const toggleSpeechBtn = document.getElementById("toggleSpeechBtn");
    const minimizeBtn = document.getElementById("minimizeBtn");
    if (!widget) return;

    widget.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", endDrag);

    if (toggleSpeechBtn) {
        toggleSpeechBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSpeech();
        });
    }
    if (minimizeBtn) {
        minimizeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            minimizeWidget();
        });
    }
    if (mascot) {
        mascot.addEventListener("click", (e) => {
            if (!isDragging) {
                e.stopPropagation();
                toggleSpeechRotation();
            }
        });
    }
    /**
     * @type any
     */
    let speechTimeout;
    function autoHideSpeech() {
        clearTimeout(speechTimeout);
        speechTimeout = setTimeout(() => {
            if (speechVisible && !isMinimized && speech) {
                speech.classList.add("hidden");
            }
        }, 8000);
    }

    widget.addEventListener("mouseenter", () => {
        clearTimeout(speechTimeout);
        if (speechVisible && !isMinimized && speech) {
            speech.classList.remove("hidden");
        }
    });

    widget.addEventListener("mouseleave", () => {
        autoHideSpeech();
    });

    autoHideSpeech();
}

function startDrag(/** @type {any} */ e) {
    if (e.target.classList.contains("control-btn")) return;

    const widget = document.getElementById("brainyWidget");
    if (!widget) return;

    isDragging = true;
    widget.classList.add("dragging");

    const rect = widget.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    e.preventDefault();
}

function drag(/** @type {any} */ e) {
    if (!isDragging) return;

    const widget = document.getElementById("brainyWidget");
    if (!widget) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - widget.offsetWidth;
    const maxY = window.innerHeight - widget.offsetHeight;

    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));

    widget.style.left = constrainedX + "px";
    widget.style.top = constrainedY + "px";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
}

function endDrag() {
    isDragging = false;
    const widget = document.getElementById("brainyWidget");
    if (widget) {
        widget.classList.remove("dragging");
    }
}

function toggleSpeech() {
    speechVisible = !speechVisible;
    const speech = document.getElementById("mascotSpeech");
    if (speech) {
        speech.classList.toggle("hidden", !speechVisible);
    }
}

function minimizeWidget() {
    isMinimized = !isMinimized;
    const widget = document.getElementById("brainyWidget");
    const speech = document.getElementById("mascotSpeech");

    if (widget) {
        widget.classList.toggle("minimized", isMinimized);
    }
    if (speech) {
        speech.classList.toggle("hidden", isMinimized);
    }
}

function initializeModernDropdown() {
    const dropdownSelected = document.getElementById("dropdownSelected");
    const dropdownList = document.getElementById("dropdownList");
    const selectedTags = document.getElementById("selectedClassesTags");

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
                    question: "Solve for x: $x^2 - 5x + 6 = 0$",
                    options: {
                        A: "$x = 2, x = 3$",
                        B: "$x = 1, x = 6$",
                        C: "$x = -2, x = -3$",
                        D: "$x = 0, x = 5$",
                    },
                    correctAnswer: "A",
                    explanation: "Factor the quadratic equation to $(x - 2)(x - 3) = 0$, leading to $x = 2$ or $x = 3$.",
                },
                {
                    id: 2,
                    question: "If $\\sin \\theta = \\frac{3}{5}$ and $\\theta$ is in the second quadrant, what is $\\cos \\theta$?",
                    options: {
                        A: "$\\frac{4}{5}$",
                        B: "$-\\frac{4}{5}$",
                        C: "$\\frac{3}{4}$",
                        D: "$-\\frac{3}{4}$",
                    },
                    correctAnswer: "B",
                    explanation: "Use the Pythagorean identity: $\\sin^2\\theta + \\cos^2\\theta = 1$. Since $\\theta$ is in the second quadrant, cosine is negative. Therefore, $\\cos \\theta = -\\frac{4}{5}$.",
                },
                {
                    id: 3,
                    question: "Simplify: $\\log_3(27) + \\log_3(9)$",
                    options: {
                        A: "$5$",
                        B: "$4$",
                        C: "$6$",
                        D: "$3$",
                    },
                    correctAnswer: "A",
                    explanation: "$\\log_3(27) = 3$ and $\\log_3(9) = 2$, so the sum is $3 + 2 = 5$.",
                },
                {
                    id: 4,
                    question: "Given matrix $A = \\begin{bmatrix} 3 & 1 \\\\ 2 & 4 \\end{bmatrix}$, what is the value of the element in row 2, column 1?",
                    options: {
                        A: "$2$",
                        B: "$3$",
                        C: "$4$",
                        D: "$1$",
                    },
                    correctAnswer: "A",
                    explanation: "In matrix $A$, the element in row 2, column 1 is $2$.",
                },
            ],
        };

        // Mock results with some correct and incorrect answers (Demo purposes)
        const mockResults = {
            score: 3,
            total: 3,
            percentage: 100,
            results: [
                {
                    questionId: 1,
                    correct: true,
                    studentAnswer: "A",
                    correctAnswer: "A",
                    explanation: "Factor the quadratic equation to $(x - 2)(x - 3) = 0$, leading to $x = 2$ or $x = 3$.",
                },
                {
                    questionId: 2,
                    correct: false,
                    studentAnswer: "A",
                    correctAnswer: "B",
                    explanation: "Use the Pythagorean identity: $\\sin^2\\theta + \\cos^2\\theta = 1$. Since $\\theta$ is in the second quadrant, cosine is negative. Therefore, $\\cos \\theta = -\\frac{4}{5}$.",
                },
                {
                    questionId: 3,
                    correct: true,
                    studentAnswer: "A",
                    correctAnswer: "A",
                    explanation: "$\\log_3(27) = 3$ and $\\log_3(9) = 2$, so the sum is $3 + 2 = 5$.",
                },
                {
                    questionId: 4,
                    correct: false,
                    studentAnswer: "B",
                    correctAnswer: "A",
                    explanation: "In matrix $A$, the element in row 2, column 1 is $2$.",
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

    updateMascotMessage("", true);

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
                /** @param {QuizQuestion} question @param {number} index */ (question, index) => `
        <div class="question">
            <h3>Question ${question.id || index + 1}: ${question.question}</h3>
            <div class="options">
                ${Object.entries(question.options)
                    .map(
                        ([key, value]) => `
                    <div class="option">
                        <input type="radio" id="q${index}_${key}" name="question_${index}" value="${key}">
                        <label for="q${index}_${key}">${key}. ${value}</label>
                    </div>
                `
                    )
                    .join("")}
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

    // Wait for DOM to update, then render math
    setTimeout(() => {
        //@ts-ignore
        renderMath(questionsContainer);
    }, 100);
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
            updateMascotMessage("Hmm, trouble grading. Let's try that again!", true);
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
    let performanceClass = "";
    let performanceMessage = "";
    const percentage = results.percentage;
    if (percentage >= 80) {
        performanceClass = "performance-success";
        performanceMessage = "Excellent!";
    } else if (percentage >= 60) {
        performanceClass = "performance-warning";
        performanceMessage = "You're getting there, c'mon!";
    } else {
        performanceClass = "performance-info";
        performanceMessage = "Keep on learning! Practice makes perfect!";
    }
    const resultsContent = results.results
        .map(
            /** @param {any} result @param {number} index */ (result, index) => {
                if (!currentQuiz) return "";
                const question = currentQuiz.questions[index];
                const isCorrect = result.correct;
                const statusClass = isCorrect ? "correct" : "incorrect";
                const statusIcon = isCorrect ? "<i class='bi bi-check-lg'></i>" : "<i class='bi bi-x-lg'></i>";
                const showCorrectAnswer = !isCorrect;

                return `
    <div class="question-result ${statusClass}">
                <div class="result-content-wrapper">
                    <div class="question-header">
                        <div class="status-icon ${statusClass}">
                            ${statusIcon}
                        </div>
                        <div class="question-content">
                            <div class="question-title">
                                <strong>${question.id}.</strong> ${question.question}
                            </div>
                        </div>
                    </div>

                    <div class="answer-comparison">
    ${["A", "B", "C", "D"]
        .map((letter) => {
            const optionText = question.options[letter];
            if (!optionText) return ""; // Skip if option doesn't exist

            const isUserAnswer = result.studentAnswer === letter;
            const isCorrectAnswer = result.correctAnswer === letter;

            let answerClass = "answer-item";
            let iconSymbol = letter;
            let labelText = `${letter}`;

            if (isCorrectAnswer) {
                answerClass += " correct-answer";
                iconSymbol = "✓";
                labelText = "Correct Answer";
            }

            if (isUserAnswer && !isCorrectAnswer) {
                answerClass += " student-answer incorrect";
                iconSymbol = "✗";
                labelText = "Your Answer";
            }

            if (isUserAnswer && isCorrectAnswer) {
                answerClass += " student-answer correct";
                iconSymbol = "✓";
                labelText = "Your Answer";
            }

            return `
            <div class="${answerClass}">
                <div class="answer-icon ${isCorrectAnswer ? "correct" : isUserAnswer ? "incorrect" : ""}">${iconSymbol}</div>
                <div class="answer-text">
                    <div class="answer-label"></div>
                    ${letter}: ${optionText}
                </div>
            </div>
        `;
        })
        .join("")}
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
                        <div class="results-header ${performanceClass}">
                            <h2>Quiz Results</h2>
                            <div class="score-display">
                                ${results.score}/${results.total}
                            </div>
                            <p class="score-subtitle">${performanceMessage}</p>
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
    setTimeout(() => {
        console.log("Rendering math on results page...");
        const resultsContainer = document.getElementById("resultsContainer");
        if (resultsContainer) {
            renderMath(resultsContainer);
        } else {
            renderMath(); // Fallback to entire document
        }
    }, 200);
}

/**
 * @typedef {Object} QuestionOption
 * @property {HTMLInputElement} input
 * @property {HTMLElement} option
 * @property {string} optionValue
 */

/**
 * @param {number} questionIndex
 * @param {string} selectedAnswer
 */
function revealAnswers(questionIndex, selectedAnswer) {
    if (!currentQuiz) return;

    const question = currentQuiz.questions[questionIndex];
    const correctAnswer = question.correctAnswer || question.correctAnswer;

    // Get all options for this question
    const options = document.querySelectorAll(`input[name="question_${questionIndex}"]`).forEach(
        /** @param {Element} input */ (input) => {
            if (!(input instanceof HTMLInputElement)) return;

            const option = input.closest(".option");
            if (!(option instanceof HTMLElement)) return;

            const optionValue = input.value;

            // Mark correct answer
            if (optionValue === correctAnswer) {
                option.classList.add("correct");
            }
            // Mark user's incorrect answer
            else if (optionValue === selectedAnswer && selectedAnswer !== correctAnswer) {
                option.classList.add("incorrect");
            }

            // Disable further clicks
            option.classList.add("disabled");
        }
    );
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
document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadKaTeX();
        console.log("KaTeX loaded successfully");
        renderMath(); // Initial render
    } catch (error) {
        console.error("Failed to load KaTeX:", error);
    }
    isAutoRotating = true;
    startPhraseRotation();
    initializeModernDropdown();
    initializeWidget();
});
