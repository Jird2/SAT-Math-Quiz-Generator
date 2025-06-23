export class VocabWord {
    constructor(word = "", definition = "") {
        this.word = word;
        this.definition = definition;
    }
}
export class addVocabWord {
    constructor(word = "", definition = "") {
        this.vocabword = new VocabWord(word, definition);
    }
}
export async function getWordOfDay() {
    try {
        const randomWord = await fetch("https://random-word-api.herokuapp.com/word?number=1");
        const word = await randomWord.json();
        return word[0];
    } catch (e) {
        console.error("Error fetching word of the day:", e);
        return null;
    }
}
