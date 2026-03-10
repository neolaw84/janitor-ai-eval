/**
 * src/memory-manager.ts
 * Injects memory and summarization instructions into the LLM prompt.
 */
import { getOrInitializeSystemInstructionBlock, injectIntoBlock, INJECT_ANCHOR_MEMORY } from "./prompt-injector";

export function injectPeriodicSummary(personality: string, currentTurnIndex: number): string {
    if (currentTurnIndex > 0 && currentTurnIndex % 10 === 0) {
        let updatedPersonality = getOrInitializeSystemInstructionBlock(personality);
        const memoryInstruction = `[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last 10 turns and display the summary clearly at the end of your response.`;
        return injectIntoBlock(updatedPersonality, INJECT_ANCHOR_MEMORY, memoryInstruction);
    }
    
    return personality;
}
