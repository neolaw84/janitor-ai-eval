import { extractMetaFromContext } from './context-parser';
import { generatePeriodicSummaryPayload } from './memory-manager';
import { injectSystemInstructionBlock } from './prompt-injector';

declare var context: any;

const currentTurnIndex = context.chat.message_count > 3 ? Math.trunc(context.chat.message_count / 2) : context.chat.message_count - 1;

// --- USER CONFIGURATION ---
const MEMORY_INTERVAL = 10;
const MEMORY_PROMPT = `[MEMORY MANAGER]: Summarize the key trackers, characters and narrative events from turn ${currentTurnIndex - MEMORY_INTERVAL} to turn ${currentTurnIndex - 1} and display the summary section after your narrative response of this turn.`;
// --------------------------

if (typeof context !== 'undefined' && context.chat && context.character) {
    const injectedMeta = extractMetaFromContext(context);
    let newPersonality = context.character.personality;

    if (newPersonality) {
        // We might be running after dice-replacer. Look for existing dice payload.
        let existingDicePayload: string | undefined = undefined;
        const precomputedDataMatch = newPersonality.match(/(<PRE_COMPUTED_DATA>[\s\S]*?<\/PRE_COMPUTED_DATA>\s*.*?(?:index 0|references\/debug).*?\n)/m);
        // Better yet, in the new architecture, let's just let the entry script handle it if they chain.
        // Actually, if memory-manager is chained AFTER dice-replacer, the easiest thing is to just 
        // prepend the memory payload directly to the personality string below the block.
        // But wait! `injectSystemInstructionBlock` just wipes the whole block.
        // If we want them to chain flawlessly without ordering issues, we need to extract the existing payloads.
        // Let's modify prompt-injector later, for now we will extract it here:
        const blockMatch = newPersonality.match(/\*\*\[START OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*\n([\s\S]*?)\n\*\*\[END OF CRITICAL SYSTEM INSTRUCTION BLOCK\]\*\*/);
        if (blockMatch) {
            const blockContent = blockMatch[1];
            if (blockContent.includes('<PRE_COMPUTED_DATA>')) {
                existingDicePayload = blockContent;
            }
        }

        const memoryPayload = generatePeriodicSummaryPayload(
            injectedMeta.currentTurnIndex,
            MEMORY_INTERVAL,
            MEMORY_PROMPT
        );

        newPersonality = injectSystemInstructionBlock(newPersonality, memoryPayload, existingDicePayload);

        context.character.personality = newPersonality;
    }
}
