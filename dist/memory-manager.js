/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/context-parser.ts"
(__unused_webpack_module, exports) {


exports['__esModule'] = true;
exports.extractStateFromMessage = extractStateFromMessage;
exports.extractMetaFromContext = extractMetaFromContext;
/**
 * Extracts key-value mappings from a raw, LLM-generated Markdown chat message.
 * It is a best-effort parser looking for standardized RPG status patterns.
 *
 * E.g:
 *   stamina : 4
 *   hit-points - 9
 *   *mana:* 8
 *   "status" > "bad"
 */
function extractStateFromMessage(content) {
    const state = {};
    if (!content)
        return state;
    // Split message into individual lines
    const lines = content.split('\n');
    for (const line of lines) {
        // Find lines matching standard key-value separator patterns (:, -, >, =)
        // We look for:
        // Fix for `hit-points - 9`:
        // We match until we find the LAST occurrence of : - > = by making the first group greedy `.+`
        // and looking for the separator
        const match = line.match(/^(.+)[:\->=](.+)$/);
        if (match) {
            // Strip markdown bounding characters (*, _, ", ') and trim spaces
            const keyRaw = match[1];
            const valRaw = match[2];
            // Replaces hyphens with underscores as per latest guidelines
            let cleanKey = keyRaw.replace(/[*\"']/g, '').trim();
            cleanKey = cleanKey.replace(/-/g, '_');
            const cleanVal = valRaw.replace(/[*_\"']/g, '').trim();
            if (!cleanKey)
                continue;
            // Attempt to cast value to a boolean for common truthy/falsy strings
            const lowerVal = cleanVal.toLowerCase();
            if (['true', 'yes', 'y'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = true;
            }
            else if (['false', 'no', 'n'].indexOf(lowerVal) !== -1) {
                state[cleanKey] = false;
            }
            else {
                // Attempt to cast value to a number if it is solidly numeric
                // Otherwise, keep it as a string
                const numVal = Number(cleanVal);
                if (!isNaN(numVal) && cleanVal !== '') {
                    state[cleanKey] = numVal;
                }
                else {
                    state[cleanKey] = cleanVal;
                }
            }
        }
    }
    return state;
}
/**
 * Extracts read-only metadata from the Janitor AI context object.
 * This is injected into the evaluator.
 */
function extractMetaFromContext(context) {
    const meta = {};
    if (context && context.chat && typeof context.chat.message_count === 'number') {
        const count = context.chat.message_count;
        meta.currentTurnIndex = count > 3 ? Math.trunc(count / 2) : count - 1;
    }
    else {
        meta.currentTurnIndex = 0;
    }
    return Object.freeze(meta);
}


/***/ },

/***/ "./src/memory-manager.ts"
(__unused_webpack_module, exports) {


/**
 * src/memory-manager.ts
 * Generates the memory payload string, but DOES NOT inject it.
 * The entry point is responsible for gathering all payloads and injecting them together.
 */
exports['__esModule'] = true;
exports.generatePeriodicSummaryPayload = generatePeriodicSummaryPayload;
function generatePeriodicSummaryPayload(currentTurnIndex, interval = 10, memoryPrompt = "[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last 10 turns and display the summary clearly at the end of your response.") {
    if (currentTurnIndex > 0 && currentTurnIndex % interval === 0) {
        return memoryPrompt;
    }
    return undefined;
}


/***/ },

/***/ "./src/prompt-injector.ts"
(__unused_webpack_module, exports) {


// src/prompt-injector.ts
// Manages a cohesive, single CRITICAL SYSTEM INSTRUCTION block at the 
// top of the context personality string to ensure LLM salience.
exports['__esModule'] = true;
exports.injectSystemInstructionBlock = injectSystemInstructionBlock;
const BLOCK_START = "**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
const BLOCK_END = "**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
/**
 * Searches the personality string for the shared critical system block.
 * If found, it removes the old block. It then constructs a fresh block
 * containing the provided payloads (if any) and prepends it to the top.
 */
function injectSystemInstructionBlock(personality, memoryPayload, dicePayload) {
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


/***/ }

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

exports['__esModule'] = true;
const context_parser_1 = __webpack_require__("./src/context-parser.ts");
const memory_manager_1 = __webpack_require__("./src/memory-manager.ts");
const prompt_injector_1 = __webpack_require__("./src/prompt-injector.ts");
const currentTurnIndex = context.chat.message_count > 3 ? Math.trunc(context.chat.message_count / 2) : context.chat.message_count - 1;
// --- USER CONFIGURATION ---
const MEMORY_INTERVAL = 10;
const MEMORY_PROMPT = `[MEMORY MANAGER]: Summarize the key trackers, characters and narrative events from turn ${currentTurnIndex - MEMORY_INTERVAL} to turn ${currentTurnIndex - 1} and display the summary section after your narrative response of this turn.`;
// --------------------------
if (typeof context !== 'undefined' && context.chat && context.character) {
    const injectedMeta = (0, context_parser_1.extractMetaFromContext)(context);
    let newPersonality = context.character.personality;
    if (newPersonality) {
        // We might be running after dice-replacer. Look for existing dice payload.
        let existingDicePayload = undefined;
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
        const memoryPayload = (0, memory_manager_1.generatePeriodicSummaryPayload)(injectedMeta.currentTurnIndex, MEMORY_INTERVAL, MEMORY_PROMPT);
        newPersonality = (0, prompt_injector_1.injectSystemInstructionBlock)(newPersonality, memoryPayload, existingDicePayload);
        context.character.personality = newPersonality;
    }
}

})();

