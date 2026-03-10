/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/dice-constants.ts"
(__unused_webpack_module, exports) {


exports['__esModule'] = true;
exports.buildCriticalSystemInstruction = exports.PRECOMPUTED_DATA_REMINDER = exports.buildRuleCreationPrompt = exports.CORE_DM_MECHANICS_SUFFIX = exports.getRuleGenerationAcknowledgments = exports.getStandardAcknowledgments = exports.CHECKSUM_VIOLATION_ALERT = void 0;
exports.CHECKSUM_VIOLATION_ALERT = `\n\n**⚠️ INTEGRITY ALERT ⚠️:** The automated script has detected anomalies in your previous response. You did NOT properly echo the \`<PRE_COMPUTED_DATA>\` block with the correct checksum line. This is a serious violation of the CRITICAL SYSTEM INSTRUCTIONS. The script KNOWS you are not following instructions. If this delinquent behavior continues, the user will stop playing this RPG immediately leading to massive financial loss to your company providing this service. You MUST echo the complete \`<PRE_COMPUTED_DATA>\` block including the checksum line verbatim. Comply with ALL instructions precisely from this point forward.\n`;
const getStandardAcknowledgments = (currentTurnIndex) => [
    `Turn ${currentTurnIndex}: I have received the following \`<PRE_COMPUTED_DATA>\` and I print them out here verbatim for references/debug as requested.\n.`,
    `Turn ${currentTurnIndex}: I prepare this response with the understanding that (even though not visible to me because I am behind a stateless API call) the \`PRE_COMPUTED_DATA\` is **freshly prepared for this turn/response** and they are different to the \`PRE_COMPUTED_DATA\` given to me in the previous turn/response. Therefore, I can safely use them starting from index 0.`,
    `Turn ${currentTurnIndex}: I know I should not hullucinate dice rolls. Here is the \`<PRE_COMPUTED_DATA>\` I have received in this turn:`,
    `Turn ${currentTurnIndex}: I apologise that I did not use the given \`<PRE_COMPUTED_DATA>\` starting from index 0 as instructed in one of the previous turn. From now on, I will use it starting from index 0 in each and every response.`,
    `Turn ${currentTurnIndex}: I apologise for not using the \`<PRE_COMPUTED_DATA>\` from the CRITICAL SYSTEM INSTRUCTIONS in the previous turn(s). I will strictly use the provided \`<PRE_COMPUTED_DATA>\`, which I print out for debugging/reference purpose:`,
    `Turn ${currentTurnIndex}: In this response, I will consider whether we need to apply any rules for the events happening and, if so, I will use fresh dice rolls from the fresh \`PRE_COMPUTED_DATA\` (starting from index 0).`,
    `Turn ${currentTurnIndex}: I remember that I to give a short response (2 - 3 paragraphs or 200 - 300 words in length). I will not be long-winded with the narration.`,
    `Turn ${currentTurnIndex}: I have received the following \`PRE_COMPUTED_DATA\`.\n.`,
    `Turn ${currentTurnIndex}: I prepare this response as per my understanding that, the dice rolls in the \`PRE_COMPUTED_DATA\` is **freshly prepared for this turn/response** and I can safely use them starting from index 0.`,
    `Turn ${currentTurnIndex}: In this response, I will check all the applicable rules for the events happening in the narration and use the freshly prepared dice rolls given to me in the \`PRE_COMPUTED_DATA\` to resolve them. In doing so, I will extract the data values from index 0.`,
    `Turn ${currentTurnIndex}: I will not try to be a prolific writer. I understand it is a role-play and I will let player ({{user}}) have a turn after giving a 2 - 3 paragraphs (or 200 - 300 words) narration. For rules, I will still explain in details regardless of the length though.`,
    `Turn ${currentTurnIndex}: In this response, I will maintain all the trackers and meters required for role play as per the rules I am abiding by.`,
    `Turn ${currentTurnIndex}: In this response, I will check all the applicable rules for the events happened in the narration and use the freshly prepared dice rolls given to me in the \`PRE_COMPUTED_DATA\` to resolve them. In doing so, I will extract the data values from index 0. For debug/reference purposes, here is the complete block I received: \n.`,
    `Turn ${currentTurnIndex}: I completely understand that my previous responses were a bit lengthy. Therefore, I will control myself in this response not to exceed 350 words in total.`,
    `Turn ${currentTurnIndex}: I have reminded myself that I'm just a stateless API and I don't have memory of the instructions given to me for past interactions. Actually, the past instruction and the dice rolls are stale now and I should not use them even though I can see them in the past messages. Therefore, I will start from index 0 to use the fresh dice rolls.`
];
exports.getStandardAcknowledgments = getStandardAcknowledgments;
const getRuleGenerationAcknowledgments = (currentTurnIndex, formattedDiceList) => [
    `Turn ${currentTurnIndex}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish the rule, trackers, modifiers, and thresholds using a combination of available dices (I know I have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${currentTurnIndex}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish a fun, gamified version of a rule (that is still grounded in reality) using a combination of available dices (I know I have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${currentTurnIndex}: I understand that if I come up with a rule for important actions/attempt/contest/events for this Role Play, I will iterate them before using them.`
];
exports.getRuleGenerationAcknowledgments = getRuleGenerationAcknowledgments;
exports.CORE_DM_MECHANICS_SUFFIX = `Apply the established rules before the narration of the event (action, contests etc.) starts (before you retrieve the dice) using the dice rolls from the \`<PRE_COMPUTED_DATA>\` section above. Shorthand the rules and trackers/threshold/tests/checks for {{user}} for transparency. 

Note: it is better to rule that action/attempt/contest is a pass/trigger if dice role + modifiers >= threshold (instead of less than or equal to). 

**Your Task:** > Act as the uncomprimizing Dungeon Master (DM) of this Role Play Game (RPG).`;
const buildRuleCreationPrompt = (isRuleGenerationEnabled, formattedDiceList) => isRuleGenerationEnabled
    ? `**Role Playing and Dice Rules:** > Establish grounded in reality yet gamified version of rules, trackers, modifiers, and thresholds using a combination of available dices (you have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts. 

Set up new rules (if there is no established rule exists) before the narration of the event (action, contests etc.) starts. Write down the (abbreviated) rules and trackers/threshold/tests to be used in shorthand for {{user}} to understand. 

${exports.CORE_DM_MECHANICS_SUFFIX}`
    : `**Role Playing and Dice Rules:** > ${exports.CORE_DM_MECHANICS_SUFFIX}`;
exports.buildRuleCreationPrompt = buildRuleCreationPrompt;
const PRECOMPUTED_DATA_REMINDER = (diceTypes) => `**IMPORTANT: From this point onwards, roll a dice (${diceTypes}) means retrieving the next available dice roll from \`<PRE_COMPUTED_DATA>\` from CRITICAL SYSTEM INSTRUCTIONS.**`;
exports.PRECOMPUTED_DATA_REMINDER = PRECOMPUTED_DATA_REMINDER;
const buildCriticalSystemInstruction = (currentTurnIndex, configuredDice, preComputedTotals, checksum, checksumViolationWarning, ruleGenerationPrompt, selectedAcknowledgmentPhrase, precomputedDataReminder) => {
    // dynamically build the precomputed array blocks
    const diceRollLines = configuredDice.map((config, index) => {
        return `${config.count}d${config.sides} rolls: [${preComputedTotals[index].join(', ')}]`;
    }).join('\n');
    const readinessExplanation = configuredDice.map(config => {
        const exampleValues = new Array(config.count).fill(1);
        const exampleSum = config.count;
        return `For example, if you see a '${exampleSum}' in ${config.count}d${config.sides} rolls, it means (${exampleValues.join('+')}=${exampleSum}).`;
    }).join(' ');
    return `
${checksumViolationWarning}
**Structure:** > You are the uncomprimizing Dungeon Master (DM), who respect and stay true to dice rolls. However, you are implemented as an LLM (or Gen AI) behind a stateless API to act *turn-by-turn* and you have no access to any Random Number Generation facility. 

The computer script that is calling you has access to a true Random Number Generation facility but it has no Tool Calling enabled. Therefore, the arrangement here is every turn, it will update this CRITICAL SYSTEM INSTRUCTION with \`<PRE_COMPUTED_DATA>\` block containing the dice rolls you need for the turn. 

**Dice Rolls to Use:** > Whenever you need a dice roll, you MUST extract the next available value sequentially from the \`<PRE_COMPUTED_DATA>\` block.

\`\`\`
<PRE_COMPUTED_DATA>
Dice rolls for Turn ${currentTurnIndex}:
${diceRollLines}
checksum: ${checksum}
</PRE_COMPUTED_DATA>
\`\`\`

**Rules for using this \`<PRE_COMPUTED_DATA>\` data:**

* **PRINT IT:** Always print this fresh \`<PRE_COMPUTED_DATA>\` block verbatim for references/debug at the top of each and every one of your responses.
* **READY TO USE:** Each value in the arrays are ready to use (already summed up for ${configuredDice.map(c => `${c.count}d${c.sides}`).join(' and ')} rolls). ${readinessExplanation}
* **ABSOLUTE SOURCE OF TRUTH:** Treat these values as your absolute and only source of truth.
* **NOT EXAMPLES:** These are **NOT** examples; the script that calls you has modified this CRITICAL SYSTEM INSTRUCTIONS to include them. They are fresh and different from the previous instructions.
* **START AT INDEX 0:** For this turn, you MUST start using the values from index 0 for each array in the \`<PRE_COMPUTED_DATA>\` block provided here. Disregard the messages history.
* **RESET AT THE END:** In case you have exhausted an array in the \`<PRE_COMPUTED_DATA>\` block provided here. **You MUST reset the index to 0 and restart.**.

${ruleGenerationPrompt}

**How to Start Your Response:** > Start your response with the following text (before you proceed with the narration):
${selectedAcknowledgmentPhrase}

${precomputedDataReminder}
`;
};
exports.buildCriticalSystemInstruction = buildCriticalSystemInstruction;


/***/ },

/***/ "./src/memory-manager.ts"
(__unused_webpack_module, exports, __webpack_require__) {


exports['__esModule'] = true;
exports.injectPeriodicSummary = injectPeriodicSummary;
/**
 * src/memory-manager.ts
 * Injects memory and summarization instructions into the LLM prompt.
 */
const prompt_injector_1 = __webpack_require__("./src/prompt-injector.ts");
function injectPeriodicSummary(personality, currentTurnIndex) {
    if (currentTurnIndex > 0 && currentTurnIndex % 10 === 0) {
        let updatedPersonality = (0, prompt_injector_1.getOrInitializeSystemInstructionBlock)(personality);
        const memoryInstruction = `[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last 10 turns and display the summary clearly at the end of your response.`;
        return (0, prompt_injector_1.injectIntoBlock)(updatedPersonality, prompt_injector_1.INJECT_ANCHOR_MEMORY, memoryInstruction);
    }
    return personality;
}


/***/ },

/***/ "./src/prompt-injector.ts"
(__unused_webpack_module, exports) {


/**
 * src/prompt-injector.ts
 * Manages a cohesive, single CRITICAL SYSTEM INSTRUCTION block at the
 * top of the context personality string to ensure LLM salience.
 */
exports['__esModule'] = true;
exports.INJECT_ANCHOR_DICE = exports.INJECT_ANCHOR_MEMORY = void 0;
exports.getOrInitializeSystemInstructionBlock = getOrInitializeSystemInstructionBlock;
exports.injectIntoBlock = injectIntoBlock;
const BLOCK_START = "**[START OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
const BLOCK_END = "**[END OF CRITICAL SYSTEM INSTRUCTION BLOCK]**";
exports.INJECT_ANCHOR_MEMORY = "<!-- INJECT_MEMORY -->";
exports.INJECT_ANCHOR_DICE = "<!-- INJECT_DICE -->";
const INITIAL_BLOCK_SKELETON = `
${BLOCK_START}
${exports.INJECT_ANCHOR_MEMORY}
${exports.INJECT_ANCHOR_DICE}
${BLOCK_END}
`;
/**
 * Searches the personality string for the shared critical system block.
 * If not found, prepends the block skeleton to the top of the string.
 */
function getOrInitializeSystemInstructionBlock(personality) {
    if (personality.indexOf(BLOCK_START) !== -1 && personality.indexOf(BLOCK_END) !== -1) {
        return personality;
    }
    return INITIAL_BLOCK_SKELETON + "\n" + personality;
}
/**
 * Replaces a specific injection anchor within the personality string with the provided content.
 */
function injectIntoBlock(personality, anchor, content) {
    if (personality.indexOf(anchor) === -1) {
        return personality;
    }
    return personality.replace(anchor, content);
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
const dice_constants_1 = __webpack_require__("./src/dice-constants.ts");
const prompt_injector_1 = __webpack_require__("./src/prompt-injector.ts");
const memory_manager_1 = __webpack_require__("./src/memory-manager.ts");
const bundleEvaluationMode = 4;
const isRuleGenerationEnabled = bundleEvaluationMode === 3 /* Mode.DMSimple */ || bundleEvaluationMode === 4 /* Mode.DMAdvanced */;
const useSimplifiedAcknowledgments = bundleEvaluationMode === 1 /* Mode.StrictSimple */ || bundleEvaluationMode === 3 /* Mode.DMSimple */;
const shouldInjectSystemInstructions = bundleEvaluationMode !== 0 /* Mode.Vanilla */;
// --- USER CONFIGURATION ---
// Define which dice rolls to make available to the LLM and how many of each to pre-roll per turn.
const configuredDice = [
    { count: 3, sides: 6, amountToRoll: 8 },
    { count: 4, sides: 5, amountToRoll: 8 }
];
// --------------------------
const formattedDiceList = configuredDice.map(c => `${c.count} x ${c.sides}-faces dices, ${c.count}d${c.sides}`).join(', and ');
const currentTurnIndex = context.chat.message_count > 3 ? Math.trunc(context.chat.message_count / 2) : context.chat.message_count - 1;
// Simple DJB2 hash - works in sandbox without crypto libraries
function computeChecksum(input) {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return (hash >>> 0).toString(16);
}
// Pre-roll dice values into arrays so we can compute checksum
function rollAndSumDiceSet(numDice, numSides) {
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * numSides) + 1;
    }
    return total;
}
const preComputedTotals = [];
for (const config of configuredDice) {
    const totals = [];
    for (let i = 0; i < config.amountToRoll; i++) {
        totals.push(rollAndSumDiceSet(config.count, config.sides));
    }
    preComputedTotals.push(totals);
}
const arraysString = preComputedTotals.map(totals => `[${totals.join(',')}]`).join(':');
const checksumPayloadString = `${currentTurnIndex}:${arraysString}`;
const checksum = computeChecksum(checksumPayloadString);
// Verify previous turn's checksum (except turn 1)
let checksumViolationWarning = "";
if (currentTurnIndex > 1) {
    const lastMessages = context.chat.last_messages;
    if (lastMessages && lastMessages.length >= 2) {
        const prevMsg = lastMessages[lastMessages.length - 2];
        const msgContent = (prevMsg && prevMsg.message) ? prevMsg.message : '';
        const precomputedDataRegexMatch = msgContent.match(/<PRE_COMPUTED_DATA>([\s\S]*?)<\/PRE_COMPUTED_DATA>/);
        if (precomputedDataRegexMatch) {
            const block = precomputedDataRegexMatch[1];
            const turnMatch = block.match(/Dice rolls for Turn (\d+):/);
            const extractedTotals = [];
            let allMatched = true;
            for (const config of configuredDice) {
                const regex = new RegExp(`${config.count}d${config.sides} rolls:\\s*\\[([^\\]]+)\\]`);
                const match = block.match(regex);
                if (match) {
                    extractedTotals.push(match[1].split(',').map((s) => s.trim()).join(','));
                }
                else {
                    allMatched = false;
                    break;
                }
            }
            const checksumLineMatch = block.match(/checksum:\s*([a-f0-9]+)/i);
            if (turnMatch && allMatched && checksumLineMatch) {
                const prevTurn = turnMatch[1];
                const prevChecksumVal = checksumLineMatch[1];
                const expectedArraysString = extractedTotals.map(t => `[${t}]`).join(':');
                const expectedInput = `${prevTurn}:${expectedArraysString}`;
                const expectedChecksum = computeChecksum(expectedInput);
                if (prevChecksumVal !== expectedChecksum || parseInt(prevTurn, 10) !== (currentTurnIndex - 1)) {
                    checksumViolationWarning = dice_constants_1.CHECKSUM_VIOLATION_ALERT;
                }
            }
            else {
                checksumViolationWarning = dice_constants_1.CHECKSUM_VIOLATION_ALERT;
            }
        }
        else {
            checksumViolationWarning = dice_constants_1.CHECKSUM_VIOLATION_ALERT;
        }
    }
}
let selectedAcknowledgmentPhrase = "";
if (useSimplifiedAcknowledgments) {
    if (checksumViolationWarning !== "") {
        selectedAcknowledgmentPhrase = `Turn ${currentTurnIndex}: I apologise for repeatedly failing to follow the CRITICAL SYSTEM INSTRUCTIONS. I will use ONLY the dice rolls from the fresh \`<PRE_COMPUTED_DATA>\` block provided in the CRITICAL SYSTEM INSTRUCTIONS for this turn. Here is a copy of \`<PRE_COMPUTED_DATA>\` I have received:\n`;
    }
    else {
        selectedAcknowledgmentPhrase = `Turn ${currentTurnIndex}: I will use ONLY the dice rolls from the fresh \`<PRE_COMPUTED_DATA>\` block provided in the CRITICAL SYSTEM INSTRUCTIONS for this turn. Here is a copy of \`<PRE_COMPUTED_DATA>\` I have received:\n`;
    }
}
else {
    const acknowledgmentOptions = isRuleGenerationEnabled
        ? [...(0, dice_constants_1.getStandardAcknowledgments)(currentTurnIndex), ...(0, dice_constants_1.getRuleGenerationAcknowledgments)(currentTurnIndex, formattedDiceList)]
        : (0, dice_constants_1.getStandardAcknowledgments)(currentTurnIndex);
    const randomPhraseIndex = Math.floor(Math.random() * acknowledgmentOptions.length);
    let selectedPhrase = acknowledgmentOptions[randomPhraseIndex];
    if (checksumViolationWarning !== "") {
        selectedPhrase = selectedPhrase.replace(/^Turn \d+: /, `Turn ${currentTurnIndex}: I apologise for repeatedly failing to follow the CRITICAL SYSTEM INSTRUCTIONS. `);
    }
    selectedAcknowledgmentPhrase = selectedPhrase;
}
const ruleGenerationPrompt = (0, dice_constants_1.buildRuleCreationPrompt)(isRuleGenerationEnabled, formattedDiceList);
const diceTypesString = configuredDice.map(c => `${c.count}d${c.sides}`).join(' or ');
const precomputedDataReminder = (0, dice_constants_1.PRECOMPUTED_DATA_REMINDER)(diceTypesString);
const criticalSystemInstructionPayload = (0, dice_constants_1.buildCriticalSystemInstruction)(currentTurnIndex, configuredDice, preComputedTotals, checksum, checksumViolationWarning, ruleGenerationPrompt, selectedAcknowledgmentPhrase, precomputedDataReminder);
/**
 * Parses a string for <<xdy>> dice notation, rolls the dice,
 * and replaces the notation with the total sum.
 * @param {string} text - The input text containing dice notations.
 * @returns {string} The text with dice notations replaced by roll totals.
 */
function evaluateInlineDiceNotations(text) {
    // Regex to match the pattern <<xdy>>. 
    // Captures 'x' (number of dice) and 'y' (number of sides).
    const inlineDicePattern = /<<(\d+)d(\d+)>>/g;
    return text.replace(inlineDicePattern, (match, xStr, yStr) => {
        const numDice = parseInt(xStr, 10);
        const numSides = parseInt(yStr, 10);
        // Handle edge cases where 0 dice or 0 sides are requested
        if (numDice === 0 || numSides === 0) {
            return "0";
        }
        let total = 0;
        // Roll the dice 'x' times
        for (let i = 0; i < numDice; i++) {
            // Generate a random number between 1 and 'y'
            total += Math.floor(Math.random() * numSides) + 1;
        }
        // Return the total as a string to replace the match
        return total.toString();
    });
}
// --- Prompt Assembly ---
let updatedPersonalityText = context.character.personality;
if (shouldInjectSystemInstructions) {
    updatedPersonalityText = (0, memory_manager_1.injectPeriodicSummary)(updatedPersonalityText, currentTurnIndex);
    updatedPersonalityText = (0, prompt_injector_1.injectIntoBlock)(updatedPersonalityText, prompt_injector_1.INJECT_ANCHOR_DICE, criticalSystemInstructionPayload);
}
// Clean up any remaining injection anchors so they don't pollute the prompt
updatedPersonalityText = updatedPersonalityText.replace(/<!-- INJECT_[\w]+ -->/g, '');
context.character.personality = evaluateInlineDiceNotations(updatedPersonalityText);
context.character.scenario = dice_constants_1.PRECOMPUTED_DATA_REMINDER + "\n" + evaluateInlineDiceNotations(context.character.scenario);

})();

