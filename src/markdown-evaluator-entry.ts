import { evaluateMarkdownCodeBlocks } from './markdown-evaluator';
import { extractStateFromMessage, extractMetaFromContext } from './context-parser';
import { injectPeriodicSummary } from './memory-manager';

declare var context: any;

let injectedState = {};
if (typeof context !== 'undefined' && context.chat && context.chat.last_messages && Array.isArray(context.chat.last_messages) && context.chat.last_messages.length >= 2) {
    const targetMsg = context.chat.last_messages[context.chat.last_messages.length - 2];
    if (targetMsg && targetMsg.message) {
        injectedState = extractStateFromMessage(targetMsg.message);
    }
}

if (typeof context !== 'undefined' && context.character) {
    const injectedMeta = extractMetaFromContext(context);
    let newPersonality = context.character.personality;
    let newScenario = context.character.scenario;

    if (newPersonality) {
        newPersonality = injectPeriodicSummary(newPersonality, injectedMeta.currentTurnIndex);
        
        // Ensure unused HTML comment anchors from prompt-injector are wiped from final output 
        // to prevent LLM confusion if they are left dangling.
        newPersonality = newPersonality.replace(/<!-- INJECT_[\w]+ -->/g, '');
        
        newPersonality = evaluateMarkdownCodeBlocks(newPersonality, injectedState, injectedMeta);
        context.character.personality = newPersonality;
    }

    if (newScenario) {
        newScenario = evaluateMarkdownCodeBlocks(newScenario, injectedState, injectedMeta);
        context.character.scenario = newScenario;
    }
}
