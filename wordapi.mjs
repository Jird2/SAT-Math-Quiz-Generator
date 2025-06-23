export async function getWordOfDay() {
    try {
        const randomWord = await fetch("https://random-word-api.herokuapp.com/word");
        const word = await randomWord.json();
        return word[0];
    } catch (e) {
        console.error("Error fetching word of the day:", e);
        return null;
    }
}
export async function getDefinition(word = "") {
    try {
        const def = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (def.ok) {
            const data = await def.json();
            return data[0].meanings[0].definitions[0].definition;
        } else {
            console.error("Error fetching word definition:", def.statusText);
            return null;
        }
    } catch (e) {
        console.error("Error fetching word definition:", e);
        return null;
    }
}
