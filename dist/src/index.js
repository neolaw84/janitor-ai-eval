"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const markdown_evaluator_1 = require("./markdown-evaluator");
const context_parser_1 = require("./context-parser");
let injectedState = {};
if (typeof context !== 'undefined' && context.chat && Array.isArray(context.chat) && context.chat.length >= 2) {
    const targetMsg = context.chat[context.chat.length - 2];
    if (targetMsg && targetMsg.content) {
        injectedState = (0, context_parser_1.extractStateFromMessage)(targetMsg.content);
    }
}
if (typeof context !== 'undefined' && context.character) {
    if (context.character.personality) {
        context.character.personality = (0, markdown_evaluator_1.evaluateMarkdownCodeBlocks)(context.character.personality, injectedState);
    }
    if (context.character.scenario) {
        context.character.scenario = (0, markdown_evaluator_1.evaluateMarkdownCodeBlocks)(context.character.scenario, injectedState);
    }
}
