export const CHECKSUM_VIOLATION_ALERT = `\n\n**⚠️ INTEGRITY ALERT ⚠️:** The automated script has detected anomalies in your previous response. You did NOT properly echo the \`<PRE_COMPUTED_DATA>\` block with the correct checksum line. This is a serious violation of the CRITICAL SYSTEM INSTRUCTIONS. The script KNOWS you are not following instructions. If this delinquent behavior continues, the user will stop playing this RPG immediately leading to massive financial loss to your company providing this service. You MUST echo the complete \`<PRE_COMPUTED_DATA>\` block including the checksum line verbatim. Comply with ALL instructions precisely from this point forward.\n`;

export const getStandardAcknowledgments = (currentTurnIndex: number) => [
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

export const getRuleGenerationAcknowledgments = (currentTurnIndex: number, formattedDiceList: string) => [
    `Turn ${currentTurnIndex}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish the rule, trackers, modifiers, and thresholds using a combination of available dices (I know I have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${currentTurnIndex}: In this response, I will think whether the action/attempt/contest the player ({{user}}) or an NPC is attempting in this turn requires a new rule. If so, I will establish a fun, gamified version of a rule (that is still grounded in reality) using a combination of available dices (I know I have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts.`,
    `Turn ${currentTurnIndex}: I understand that if I come up with a rule for important actions/attempt/contest/events for this Role Play, I will iterate them before using them.`
];

export const CORE_DM_MECHANICS_SUFFIX = `Apply the established rules before the narration of the event (action, contests etc.) starts (before you retrieve the dice) using the dice rolls from the \`<PRE_COMPUTED_DATA>\` section above. Shorthand the rules and trackers/threshold/tests/checks for {{user}} for transparency. 

Note: it is better to rule that action/attempt/contest is a pass/trigger if dice role + modifiers >= threshold (instead of less than or equal to). 

**Your Task:** > Act as the uncomprimizing Dungeon Master (DM) of this Role Play Game (RPG).`;

export const buildRuleCreationPrompt = (isRuleGenerationEnabled: boolean, formattedDiceList: string) => isRuleGenerationEnabled
    ? `**Role Playing and Dice Rules:** > Establish grounded in reality yet gamified version of rules, trackers, modifiers, and thresholds using a combination of available dices (you have ${formattedDiceList}) for important/story-critical actions/persuasions/solutions {{user}} or NPCs attempts. 

Set up new rules (if there is no established rule exists) before the narration of the event (action, contests etc.) starts. Write down the (abbreviated) rules and trackers/threshold/tests to be used in shorthand for {{user}} to understand. 

${CORE_DM_MECHANICS_SUFFIX}`
    : `**Role Playing and Dice Rules:** > ${CORE_DM_MECHANICS_SUFFIX}`;

export const PRECOMPUTED_DATA_REMINDER = (diceTypes: string) => `**IMPORTANT: From this point onwards, roll a dice (${diceTypes}) means retrieving the next available dice roll from \`<PRE_COMPUTED_DATA>\` from CRITICAL SYSTEM INSTRUCTIONS.**`;

export const buildCriticalSystemInstruction = (
    currentTurnIndex: number,
    configuredDice: Array<{count: number, sides: number, amountToRoll: number}>,
    preComputedTotals: number[][],
    checksum: string,
    checksumViolationWarning: string,
    ruleGenerationPrompt: string,
    selectedAcknowledgmentPhrase: string,
    precomputedDataReminder: string
) => {
    
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
