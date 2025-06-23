//@ts-check
import OpenAI from "openai";
import { VocabWord } from "./vocabword.mjs";
import { getWordOfDay, getDefinition } from "./wordapi.mjs";
import express from "express";
const app = express();
const port = 3000;
/** @type {VocabWord[]} **/
let vocabwords = [];
let currentword = "";
app.get("/", async (_req, res) => {
    const today = await getWordOfDay();
    currentword = today;
    res.send(`Word of the day: ${today}`);
    let word = new VocabWord(today, "A word of the day:");
    vocabwords.push(word);
});

app.get("/vocabwords", async (_req, res) => {
    if (!currentword) {
        currentword = await getWordOfDay();
    }
    const def = await getDefinition(currentword);
    res.send(def);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

vocabwords.forEach((vocabword) => {
    console.log(vocabword.word);
    console.log(vocabword.definition);
});
