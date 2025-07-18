// @ts-check
/**
 * @typedef {"easy" | "medium" | "hard"} Difficulty
 */
export const mathClasses = {
    "Algebra I": ["Linear Equations", "Polynomials", "Factoring", "Systems of Equations", "Inequalities"],
    Geometry: ["Area and Perimeter", "Triangles", "Circles", "Volume", "Coordinate Geometry"],
    "Algebra II": ["Quadratic Functions", "Exponential Functions", "Logarithms", "Rational Functions", "Complex Numbers"],
    Trigonometry: ["Trigonometric Functions", "Unit Circle", "Identities", "Law of Sines", "Law of Cosines"],
    "Pre-Calculus": ["Polynomial Functions", "Sequences and Series", "Conic Sections", "Matrices", "Limits"],
};

export const difficultyClassification = {
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
 * Validate if selected math classes are valid
 * @param {string[]} classes
 * @returns {boolean}
 */
export function isValidMathClasses(classes = []) {
    return Array.isArray(classes) && classes.length > 0 && classes.length <= 5 && classes.every((cls) => Object.prototype.hasOwnProperty.call(mathClasses, cls));
}

/**
 * Validate if difficulty level is valid
 * @param {string} difficulty
 * @returns {difficulty is Difficulty}
 */
export function isValidDifficulty(difficulty = "") {
    return /** @type {string[]} */ (["easy", "medium", "hard"]).includes(difficulty);
}

/**
 * Validate if number of questions is valid
 * @param {number} num
 * @returns {boolean}
 */
export function isValidNumQuestions(num = 0) {
    return Number.isInteger(num) && num > 0 && num <= 10;
}
