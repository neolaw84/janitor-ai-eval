import { extractMetaFromContext } from './context-parser';
import { injectPeriodicSummary } from './memory-manager';

declare var context: any;

if (typeof context !== 'undefined' && context.chat && context.character) {
    const injectedMeta = extractMetaFromContext(context);
    let newPersonality = context.character.personality;

    if (newPersonality) {
        newPersonality = injectPeriodicSummary(newPersonality, injectedMeta.currentTurnIndex);
        
        // Ensure unused HTML comment anchors from prompt-injector are wiped from final output 
        // to prevent LLM confusion if they are left dangling.
        newPersonality = newPersonality.replace(/<!-- INJECT_[\w]+ -->/g, '');
        
        context.character.personality = newPersonality;
    }
}
