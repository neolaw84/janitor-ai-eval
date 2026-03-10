import { extractMetaFromContext } from './context-parser';
import { injectPeriodicSummary } from './memory-manager';

declare var context: any;

// --- USER CONFIGURATION ---
const MEMORY_INTERVAL = 10;
const MEMORY_PROMPT = `[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last ${MEMORY_INTERVAL} turns and display the summary clearly at the end of your response.`;
// --------------------------

if (typeof context !== 'undefined' && context.chat && context.character) {
    const injectedMeta = extractMetaFromContext(context);
    let newPersonality = context.character.personality;

    if (newPersonality) {
        newPersonality = injectPeriodicSummary(
            newPersonality, 
            injectedMeta.currentTurnIndex, 
            MEMORY_INTERVAL,
            MEMORY_PROMPT
        );
        
        // Ensure unused HTML comment anchors from prompt-injector are wiped from final output 
        // to prevent LLM confusion if they are left dangling.
        newPersonality = newPersonality.replace(/<!-- INJECT_[\w]+ -->/g, '');
        
        context.character.personality = newPersonality;
    }
}
