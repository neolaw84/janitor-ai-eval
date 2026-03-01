import { evaluateMarkdownCodeBlocks } from './markdown-evaluator';
import { extractStateFromMessage } from './context-parser';

declare var context: any;

let injectedState = {};
if (typeof context !== 'undefined' && context.chat && context.chat.last_messages && Array.isArray(context.chat.last_messages) && context.chat.last_messages.length >= 2) {
    const targetMsg = context.chat.last_messages[context.chat.last_messages.length - 2];
    if (targetMsg && targetMsg.message) {
        injectedState = extractStateFromMessage(targetMsg.message);
    }
}

if (typeof context !== 'undefined' && context.character) {
    let newPersonality = context.character.personality;
    let newScenario = context.character.scenario;

    if (newPersonality) {
        newPersonality = evaluateMarkdownCodeBlocks(newPersonality, injectedState);
        context.character.personality = newPersonality;
    }

    if (newScenario) {
        newScenario = evaluateMarkdownCodeBlocks(newScenario, injectedState);
        context.character.scenario = newScenario;
    }
}
