// src/prompt-injector.ts
// Manages a cohesive, single CRITICAL SYSTEM INSTRUCTION block at the 
// top of the context personality string to ensure LLM salience.

const BLOCK_START = "**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
const BLOCK_END = "**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";

/**
 * Searches the personality string for the shared critical system block. 
 * If found, it removes the old block. It then constructs a fresh block
 * containing the provided payloads (if any) and prepends it to the top.
 */
export function injectSystemInstructionBlock(
    personality: string, 
    memoryPayload?: string, 
    dicePayload?: string
): string {
    let cleanPersonality = personality;

    // Strip out the old block if it exists
    const startIndex = cleanPersonality.indexOf(BLOCK_START);
    const endIndex = cleanPersonality.indexOf(BLOCK_END);

    if (startIndex !== -1 && endIndex !== -1) {
        // Remove everything from BLOCK_START to BLOCK_END (plus the length of BLOCK_END itself)
        cleanPersonality = cleanPersonality.substring(0, startIndex) + cleanPersonality.substring(endIndex + BLOCK_END.length);
        cleanPersonality = cleanPersonality.trim();
    }

    // If neither payload exists, do not inject anything
    if (!memoryPayload && !dicePayload) {
        return cleanPersonality;
    }

    // Build the new block dynamically
    let newBlock = `\n${BLOCK_START}\n`;
    
    if (memoryPayload) {
        newBlock += `${memoryPayload}\n`;
    }
    
    if (dicePayload) {
        newBlock += `${dicePayload}\n`;
    }

    newBlock += `${BLOCK_END}\n\n`;

    // Prepend the fresh block to the clean personality
    return newBlock + cleanPersonality;
}
