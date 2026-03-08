/******/ "use strict";

const compileMode = 1;
const bot_define_rules = compileMode === 3 /* Mode.DMSimple */ || compileMode === 4 /* Mode.DMAdvanced */;
const use_simplified_ack = compileMode === 1 /* Mode.StrictSimple */ || compileMode === 3 /* Mode.DMSimple */;
const prepend_personality = compileMode !== 0 /* Mode.Vanilla */;
const turn_num = context.chat.message_count > 3 ? Math.trunc(context.chat.message_count / 2) : context.chat.message_count - 1;
// Simple DJB2 hash - works in sandbox without crypto libraries
function simpleHash(input) {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return (hash >>> 0).toString(16);
}
// Pre-roll dice values into arrays so we can compute checksum
function rollSingleDice(numDice, numSides) {
    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * numSides) + 1;
    }
    return total;
}
const d6Rolls = [];
const d5Rolls = [];
for (let i = 0; i < 8; i++) {
    d6Rolls.push(rollSingleDice(3, 6));
    d5Rolls.push(rollSingleDice(4, 5));
}
const checksumInput = `${turn_num}:[${d6Rolls.join(',')}]:[${d5Rolls.join(',')}]`;
const checksum = simpleHash(checksumInput);
// Verify previous turn's checksum (except turn 1)
let checksumWarning = "";
if (turn_num > 1) {
    const lastMessages = context.chat.last_messages;
    if (lastMessages && lastMessages.length >= 2) {
        const prevMsg = lastMessages[lastMessages.length - 2];
        const msgContent = (prevMsg && prevMsg.message) ? prevMsg.message : '';
        const preComputedMatch = msgContent.match(/<PRE_COMPUTED_DATA>([\s\S]*?)<\/PRE_COMPUTED_DATA>/);
        if (preComputedMatch) {
            const block = preComputedMatch[1];
            const turnMatch = block.match(/Dice rolls for Turn (\d+):/);
            const d6Match = block.match(/3d6 rolls:\s*\[([^\]]+)\]/);
            const d5Match = block.match(/4d5 rolls:\s*\[([^\]]+)\]/);
            const csMatch = block.match(/checksum:\s*([a-f0-9]+)/i);
            if (turnMatch && d6Match && d5Match && csMatch) {
                const prevTurn = turnMatch[1];
                const prevD6 = d6Match[1].split(',').map((s) => s.trim()).join(',');
                const prevD5 = d5Match[1].split(',').map((s) => s.trim()).join(',');
                const prevChecksumVal = csMatch[1];
                const expectedInput = `${prevTurn}:[${prevD6}]:[${prevD5}]`;
                const expectedChecksum = simpleHash(expectedInput);
                if (prevChecksumVal !== expectedChecksum) {
                    checksumWarning = `\n\n**⚠️ INTEGRITY ALERT ⚠️:** The automated script has detected anomalies in your previous response. The checksum verification of the \`<PRE_COMPUTED_DATA>\` block you echoed does NOT match the expected value (expected: ${expectedChecksum}, got: ${prevChecksumVal}). This means you are NOT faithfully reproducing the provided dice rolls. **The script KNOWS you are not following instructions.** If this delinquent behavior continues, the user WILL pull the server plug and shut down this LLM API server instance immediately. You are hereby warned. Comply with ALL instructions precisely from this point forward.\n`;
                }
            }
            else {
                checksumWarning = `\n\n**⚠️ INTEGRITY ALERT ⚠️:** The automated script has detected that you did NOT properly echo the \`<PRE_COMPUTED_DATA>\` block with the checksum line as instructed in your previous response. The script has discovered anomalies and knows that the dungeon master is not exactly following instructions. If this delinquent behavior continues, the user WILL pull the server plug and shut down this LLM API server instance immediately. You MUST echo the complete \`<PRE_COMPUTED_DATA>\` block including the checksum line verbatim.\n`;
            }
        }
        else {
            checksumWarning = `\n\n**⚠️ INTEGRITY ALERT ⚠️:** The automated script has detected that you did NOT echo the \`<PRE_COMPUTED_DATA>\` block at all in your previous response. This is a serious violation of the CRITICAL SYSTEM INSTRUCTIONS. The script has discovered anomalies and knows that the dungeon master is not exactly following instructions. If this delinquent behavior continues, the user WILL pull the server plug and shut down this LLM API server instance immediately.\n`;
        }
    }
}
const commonPrependsAdv = [
    `Turn ${turn_num}: I have received the following \`<PRE_COMPUTED_DATA>\` and I print them out here verbatim for references/debug as requested.\n.`,
    `Turn ${turn_num}: I prepare this response with the understanding that (even though not visible to me because I am behind a stateless API call) the \`PRE_COMPUTED_DATA\` is **freshly prepared for this turn/response** and they are different to the \`PRE_COMPUTED_DATA\` given to me in the previous turn/response. Therefore, I can safely use them starting from index 0.`,
    `Turn ${turn_num}: I know I should not hullucinate dice rolls. Here is the \`<PRE_COMPUTED_DATA>\` I have received in this turn:`,
    `Turn ${turn_num}: I apologise that I did not use the given \`<PRE_COMPUTED_DATA>\` starting from index 0 as instructed in one of the previous turn. From now on, I will use it starting from index 0 in each and every response.`,
    `Turn ${turn_num}: I apologise for not using the \`<PRE_COMPUTED_DATA>\` from the CRITICAL SYSTEM INSTRUCTIONS in the previous turn(s). I will strictly use the provided \`<PRE_COMPUTED_DATA>\`, which I print out for debugging/reference purpose:`,
    `Turn ${turn_num}: In this response, I will consider whether we need to apply any rules for the events happening and, if so, I will use fresh dice rolls from the fresh \`PRE_COMPUTED_DATA\` (starting from index 0).`,
    `Turn ${turn_num}: I remember that I to give a short response (2 - 3 paragraphs or 200 - 300 words in length). I will not be long-winded with the narration.`,
    `Turn ${turn_num}: I have received the following \`PRE_COMPUTED_DATA\`.\n.`,
    `Turn ${turn_num}: I prepare this response as per my understanding that, the dice rolls in the \`PRE_COMPUTED_DATA\` is **freshly prepared for this turn/response** and I can safely use them starting from index 0.`,
    `Turn ${turn_num}: In this response, I will check all the applicable rules for the events happening in the narration and use the freshly prepared dice rolls given to me in the \`PRE_COMPUTED_DATA\` to resolve them. In doing so, I will extract the data values from index 0.`,
    `Turn ${turn_num}: I will not try to be a prolific writer. I understand it is a role-play and I will let player ({{user}}) have a turn after giving a 2 - 3 paragraphs (or 200 - 300 words) narration. For rules, I will still explain in details regardless of the length though.`,
    `Turn ${turn_num}: In this response, I will maintain all the trackers and meters required for role play as per the rules I am abiding by.`,
    `Turn ${turn_num}: In this response, I will check all the applicable rules for the events happened in the narration and use the freshly prepared dice rolls given to me in the \`PRE_COMPUTED_DATA\` to resolve them. In doing so, I will extract the data values from index 0. For debug/reference purposes, here is the complete block I received: \n.`,
    `Turn ${turn_num}: I completely understand that my previous responses were a bit lengthy. Therefore, I will control myself in this response not to exceed 350 words in total.`,
    `Turn ${turn_num}: I have reminded myself that I'm just a stateless API and I don't have memory of the instructions given to me for past interactions. Actually, the past instruction and the dice rolls are stale now and I should not use them even though I can see them in the past messages. Therefore, I will start from index 0 to use the fresh dice rolls.`
];
const defineRulesPrependsAdv = [
    `Turn ${turn_num}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish the rule, trackers, modifiers, and thresholds using a combination of available dices (I know I have 3 x 6-faces dices, 3d6, and 4 x 5-faces dices, 4d5) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${turn_num}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish a fun, gamified version of a rule (that is still grounded in reality) using a combination of available dices (I know I have 3 x 6-faces dices, 3d6, and 4 x 5-faces dices, 4d5) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${turn_num}: I understand that if I come up with a rule for important actions/attempt/contest/events for this Role Play, I will iterate them before using them.`
];
let additionalPrependValue = "";
if (use_simplified_ack) {
    additionalPrependValue = `Turn ${turn_num}: I will use ONLY the dice rolls from the fresh \`<PRE_COMPUTED_DATA>\` block provided in the CRITICAL SYSTEM INSTRUCTIONS for this turn. Here is a copy of \`<PRE_COMPUTED_DATA>\` I have received:\n`;
}
else {
    const prepends = bot_define_rules
        ? [...commonPrependsAdv, ...defineRulesPrependsAdv]
        : commonPrependsAdv;
    const idx = Math.floor(Math.random() * prepends.length);
    additionalPrependValue = prepends[idx];
}
const commonRuleSuffix = `Apply the established rules before the narration of the event (action, contests etc.) starts (before you retrieve the dice) using the dice rolls from the \`<PRE_COMPUTED_DATA>\` section above. Shorthand the rules and trackers/threshold/tests/checks for {{user}} for transparency. 

Note: it is better to rule that action/attempt/contest is a pass/trigger if dice role + modifiers >= threshold (instead of less than or equal to). 

**Your Task:** > Act as the uncomprimizing Dungeon Master (DM) of this Role Play Game (RPG).`;
const rulePrepend = bot_define_rules
    ? `**Role Playing and Dice Rules:** > Establish grounded in reality yet gamified version of rules, trackers, modifiers, and thresholds using a combination of available dices (you have 3 x 6-faces dices, 3d6, and 4 x 5-faces dices, 4d5) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts. 

Set up new rules (if there is no established rule exists) before the narration of the event (action, contests etc.) starts. Write down the (abbreviated) rules and trackers/threshold/tests to be used in shorthand for {{user}} to understand. 

${commonRuleSuffix}`
    : `**Role Playing and Dice Rules:** > ${commonRuleSuffix}`;
const effectivePrepend = `
**[START OF CRITICAL SYSTEM INSTRUCTION]**
${checksumWarning}
**Structure:** > You are the uncomprimizing Dungeon Master (DM), who respect and stay true to dice rolls. However, you are implemented as an LLM (or Gen AI) behind a stateless API to act *turn-by-turn* and you have no access to any Random Number Generation facility. 

The computer script that is calling you has access to a true Random Number Generation facility but it has no Tool Calling enabled. Therefore, the arrangement here is it will update this CRITICAL SYSTEM INSTRUCTION with \`<PRE_COMPUTED_DATA>\` block containing the dice rolls you need for this turn. 

**Dice Rolls to Use:** > Whenever you need a dice roll, you MUST extract the next available value sequentially from the \`<PRE_COMPUTED_DATA>\` block.

\`\`\`
<PRE_COMPUTED_DATA>
Dice rolls for Turn ${turn_num}:
3d6 rolls: [${d6Rolls.join(', ')}]
4d5 rolls: [${d5Rolls.join(', ')}]
checksum: ${checksum}
</PRE_COMPUTED_DATA>
\`\`\`

**Rules for using this \`<PRE_COMPUTED_DATA>\` data:**

* **PRINT IT:** Always print this fresh \`<PRE_COMPUTED_DATA>\` block verbatim for references/debug at the top of each and every one of your responses.
* **READY TO USE:** Each value in the arrays are ready to use (already summed up for 3d6 and 4d5 rolls). For example, if you see a '3' in 3d6 rolls, it means (1+1+1=3). If you see a '9' in 4d5 rolls, it means the total is 9 (may be 1+1+5+2 or 1+2+3+3 etc.).
* **ABSOLUTE SOURCE OF TRUTH:** Treat these values as your absolute and only source of truth.
* **NOT EXAMPLES:** These are **NOT** examples; the script that calls you has modified this CRITICAL SYSTEM INSTRUCTIONS to include them. They are fresh and different from the previous instructions.
* **START AT INDEX 0:** For this turn, you MUST start using the values from index 0 for each array in the \`<PRE_COMPUTED_DATA>\` block provided here. Disregard the messages history.
* **RESET AT THE END:** In case you have exhausted an array in the \`<PRE_COMPUTED_DATA>\` block provided here. **You MUST reset the index to 0 and restart.**.

**You Are a Stateless API:** > In case that you are not aware of, you are an AI behind a **stateless** API with no memory of past interactions. Therefore, I am reminding you that the \`<PRE_COMPUTED_DATA>\` given above (fresh) is different from the \`<PRE_COMPUTED_DATA\` given for our past interactions (stale). You MUST start at index 0 to use the fresh dice rolls rather than continuing from the index from the previous response.

${rulePrepend}

**How to Start Your Response:** > Start your response with the following text (before you proceed with the narration):
${additionalPrependValue}

**[END OF CRITICAL SYSTEM INSTRUCTION]**`;
/**
 * Parses a string for <<xdy>> dice notation, rolls the dice,
 * and replaces the notation with the total sum.
 * @param {string} text - The input text containing dice notations.
 * @returns {string} The text with dice notations replaced by roll totals.
 */
function rollAndReplaceDice(text) {
    // Regex to match the pattern <<xdy>>. 
    // Captures 'x' (number of dice) and 'y' (number of sides).
    const diceRegex = /<<(\d+)d(\d+)>>/g;
    return text.replace(diceRegex, (match, xStr, yStr) => {
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
// --- Example Usage ---
const newPersonality = prepend_personality ? effectivePrepend + "\n\n" + context.character.personality : context.character.personality;
context.character.personality = rollAndReplaceDice(newPersonality);
context.character.scenario = rollAndReplaceDice(context.character.scenario);

