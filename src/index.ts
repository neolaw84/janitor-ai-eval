import { evaluateMarkdownCodeBlocks } from './markdown-evaluator';
import { extractStateFromMessage } from './context-parser';

declare var context: any;

let injectedState = {};
if (typeof context !== 'undefined' && context.chat && Array.isArray(context.chat) && context.chat.length >= 2) {
    const targetMsg = context.chat[context.chat.length - 2];
    if (targetMsg && targetMsg.content) {
        injectedState = extractStateFromMessage(targetMsg.content);
    }
}

if (typeof context !== 'undefined' && context.character) {
    if (context.character.personality) {
        context.character.personality = evaluateMarkdownCodeBlocks(context.character.personality, injectedState);
    }
    if (context.character.scenario) {
        context.character.scenario = evaluateMarkdownCodeBlocks(context.character.scenario, injectedState);
    }
}
