import { evaluateMarkdownCodeBlocks } from './markdown-evaluator';
import { extractStateFromMessage, extractMetaFromContext } from './context-parser';
import { generatePeriodicSummaryPayload } from './memory-manager';
import { injectSystemInstructionBlock } from './prompt-injector';

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
        // Look for an existing dice payload from a chained dice-replacer script
        let existingDicePayload: string | undefined = undefined;
        const blockMatch = newPersonality.match(/\*\*\[START OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*\n([\s\S]*?)\n\*\*\[END OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*/);
        if (blockMatch) {
            const blockContent = blockMatch[1];
            if (blockContent.includes('<PRE_COMPUTED_DATA>')) {
                // Extract just the dive payload
                const diceMatch = blockContent.match(/(<PRE_COMPUTED_DATA>[\s\S]*?<\/PRE_COMPUTED_DATA>\s*.*?(?:index 0|references\/debug).*?\n)/m);
                if (diceMatch) {
                    existingDicePayload = diceMatch[0].trim();
                } else if (!blockContent.includes('[MEMORY MANAGER]')) {
                    // fallback if regex fails
                    existingDicePayload = blockContent.trim();
                }
            }
        }

        const memoryPayload = generatePeriodicSummaryPayload(injectedMeta.currentTurnIndex);
        newPersonality = injectSystemInstructionBlock(newPersonality, memoryPayload, existingDicePayload);
        
        newPersonality = evaluateMarkdownCodeBlocks(newPersonality, injectedState, injectedMeta);
        context.character.personality = newPersonality;
    }

    if (newScenario) {
        newScenario = evaluateMarkdownCodeBlocks(newScenario, injectedState, injectedMeta);
        context.character.scenario = newScenario;
    }
}
