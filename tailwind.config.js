/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./quiz.html", "./public/js/quiz.js", "./quiz.js"],
    theme: {
        extend: {
            colors: {
                "brand-orange": "#FFA500",
                "brand-blue": "#00BFFF",
                "brand-teal": "#40E0D0",
            },
            fontFamily: {
                sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
            },
        },
    },
    plugins: [],
};
