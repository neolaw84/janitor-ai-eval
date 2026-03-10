# Janitor AI Markdown Evaluator

A standalone, dependency-free JavaScript sandbox for the [Janitor AI](https://janitorai.com) scripting environment. It lets you embed simple JavaScript blocks inside your bot's Personality and Scenario prompts to drive deterministic game logic—health tracking, dice rolls, branching consequences—without relying on the LLM to do the math.

> **Don't know how to code or dread writing long prompts?** Fret not, we have prepared everything for you:
> 1. **Just copy a compiled script.** The pre-compiled files are already included in this repository. Copy the contents of whichever script matches your chosen pattern (see [Choosing Your Script](#choosing-your-script)) and paste it into your bot's Advanced Script box on Janitor AI.
> 2. **Use an agentic IDE.** Tools like Antigravity *(no association with this repository)* can read the agent skills bundled in this repo and write all your bot files from a single conversational prompt. See [No-Code Bot Creation with an Agentic IDE](#no-code-bot-creation-with-an-agentic-ide).

---

## Table of Contents

1. [Why This Exists](#why-this-exists)
2. [Choosing Your Script](#choosing-your-script)
3. [How It Works (`bundle.js`)](#how-it-works-bundlejs)
4. [The Sandbox](#the-sandbox)
5. [Two Bot Philosophies](#two-bot-philosophies)
6. [The Dice-Replacer Scripts (Standalone Alternatives)](#the-dice-replacer-scripts-standalone-alternatives)
7. [Building a Bot](#building-a-bot)
8. [No-Code Bot Creation with an Agentic IDE](#no-code-bot-creation-with-an-agentic-ide)
9. [Quick Example](#quick-example)
10. [Build & Test](#build--test)

---

## Why This Exists

Janitor AI's scripting environment prohibits `eval()` and `new Function()`—both crash silently. This project implements a custom Lexer, Parser, and Interpreter (a lightweight AST evaluator) entirely from scratch so that bots can execute safe JavaScript logic without any of those banned constructs.

---

## Choosing Your Script

Three compiled script patterns are available in `dist/`. In most simple setups, you will load **exactly one** per bot—they are generally mutually exclusive. However, you can combine them for complex workflows (see [Advanced Usage](#advanced-usage-combining-scripts)).

| Script | Build command | When to use |
|--------|--------------|-------------|
| `dist/markdown-evaluator.js` | `npm run build` | You want to embed JavaScript blocks directly in your bot's Personality/Scenario and have the evaluator run deterministic game logic before every LLM response. |
| `dist/dice-replacer-dm-simple.js`<br>`dist/dice-replacer-dm-advanced.js` | `npm run build:dice` | You want the LLM to act as a free-form Dungeon Master and invent rules on the fly. Fresh dice rolls are injected automatically; the LLM decides how to apply them. Advanced uses rotating prepends. |
| `dist/dice-replacer-strict-simple.js`<br>`dist/dice-replacer-strict-advanced.js` | `npm run build:dice` | Same injection mechanism as above, but the LLM is told to follow rules you have written explicitly rather than invent them. |
| `dist/dice-replacer-vanilla.js` | `npm run build:dice` | Completely vanilla dice replacement without any prepends or rules injected. |
| `dist/memory-manager.js` | `npm run build:memory` | *Advanced*: Run sequentially with other scripts to periodically instruct the LLM to summarize the narrative context (every 10 turns) to act as long-term memory. |

> `markdown-evaluator.js` uses the full custom AST evaluator described in [How It Works](#how-it-works-markdown-evaluatorjs) and [The Sandbox](#the-sandbox).  
> The `dice-replacer` scripts are **standalone alternatives** with an entirely different pipeline—see [The Dice-Replacer Scripts](#the-dice-replacer-scripts-standalone-alternatives).

---

## How It Works (`markdown-evaluator.js`)

Every time a player sends a message, the script runs **before** the LLM generates its reply:

1. **State Extraction** – The script reads the bot's most recent message (`context.chat.last_messages`) and parses it for key-value pairs (e.g. `hp: 50`, `poisoned - yes`). These become the global `state` object.
2. **Code Block Evaluation** – Every ` ```js ` or ` ```javascript ` block found in `context.character.personality` and then `context.character.scenario` is executed sequentially. All blocks share the same `state` object, so a change made in Block A is visible in Block B.
3. **Output Injection** – Each `console.log()` call inside a block produces a line of output. The entire code block is replaced by those output lines in the prompt. The LLM only sees the resulting text, not the original script.
4. **LLM Call** – Janitor AI concatenates the mutated Personality and Scenario into the final prompt and sends it to the LLM.

### State Parsing Rules

The parser supports multiple separator styles (case-insensitive):

| Format | Example |
|--------|---------|
| `key : value` | `hp : 50` |
| `key - value` | `stamina - 4` |
| `key > value` | `status > bad` |
| `key = value` | `poisoned = true` |

Markdown formatting characters (`*`, `_`, `"`, `'`) are stripped from keys and values. Hyphens in key names are converted to underscores.

Values are automatically typed:
- `true`, `false`, `yes`, `no`, `y`, `n` → JavaScript boolean
- Numeric strings → JavaScript number
- Everything else → string

---

## The Sandbox

### Supported JavaScript Subset

- Arithmetic and logical expressions
- String concatenation
- Arrays and select native prototype methods (e.g. `[1, 2].push(3)`, `"str".toUpperCase()`)
- `if` / `else if` / `else` branches
- Basic `for` loops
- `console.log()` — outputs are collected and replace the code block in the prompt

### Available Globals

| Global | What it provides |
|--------|-----------------|
| `state` | Shared object that persists values across all executed blocks in a single turn. Populated from the LLM's previous message. |
| `Math` | Safe subset: `floor`, `ceil`, `round`, `max`, `min`, `abs`, `random` |
| `roll(count, sides)` | Rolls `count` dice with `sides` faces and returns the total (e.g. `roll(2, 6)`) |
| `rollxdy(count, sides)` | Alias for `roll()` |

Everything outside this list (`fetch`, `window`, `document`, `XMLHttpRequest`, etc.) will throw immediately and be silently caught.

### Syntax Limitations

The parser is intentionally minimal. These patterns will cause exceptions:

| ❌ Not Supported | ✅ Use Instead |
|-----------------|---------------|
| `function` keyword (`state.fn = function() {}`) | Inline all logic |
| Ternary operator (`condition ? a : b`) | `if` / `else` blocks |
| Semicolons inside string literals (`console.log("val;")`) | Avoid `;` in strings |
| `const`, `let`, `var` declarations | Assign directly to `state` (e.g. `state.x = 5`) |
| `Array.prototype.includes()` | `indexOf() !== -1` |
| ES6+ features (classes, promises, arrow functions) | ES5-compatible syntax only |

**On failure:** If a code block throws, the error is logged to the browser console (visible in the Janitor AI "Edit Script" debug window) and the block is silently removed. This prevents broken scripts from corrupting chat output.

> **Debugging tip:** Open the Janitor AI "Edit Script" dialog and check the Console tab in the debug window at the bottom right to see any exception messages from the AST parser.

---

## Two Bot Philosophies

You must pick **exactly one** of the following patterns for any bot you build. They are not meant to be mixed.

---

### 1. LLM as Router, Script as Authority

**Use this with:** `dist/bundle.js`

The JavaScript evaluates *before* the LLM responds. The script cannot know what action the player will take, so the design pre-calculates the mechanical outcome of *every possible action* and writes all of them into the Scenario. The LLM reads the player's message, picks which branch is narratively appropriate, and narrates only that branch's `console.log()` output.

**Strengths:** Deterministic, math-accurate, LLM cannot hallucinate stats.  
**Weaknesses:** Less effective with hard-to-control LLMs (e.g. DeepSeek) that over-narrate or ignore routing instructions.

**Key points:**
- The `scenario.md` file holds all the JS logic blocks (one block per possible player intent).
- The `personality.md` tells the LLM it must narrate *only* what the script outputs, not invent outcomes.
- State persistence depends entirely on the LLM printing all tracked variables at the end of every message. If it omits a variable, `state.that_variable` will be `undefined` on the next turn.

---

### 2. LLM Free Reign / Dungeon Master

**Use this with:** `dist/dice-replacer-dm-simple.js`, `dist/dice-replacer-dm-advanced.js`, `dist/dice-replacer-strict-simple.js`, or `dist/dice-replacer-strict-advanced.js` *(standalone scripts — see [The Dice-Replacer Scripts](#the-dice-replacer-scripts-standalone-alternatives))*

Instead of making the LLM follow a rigid script, this pattern injects freshly-rolled dice arrays into the personality prompt *before* the LLM call. The LLM is instructed to act as an uncompromising Dungeon Master—inventing or applying rules, then consuming the pre-computed dice sequentially to resolve them. Because the dice are real random numbers rather than LLM-hallucinated ones, outcomes remain unpredictable and fair even when the LLM has full narrative freedom.

**Strengths:** Works well with narrative-heavy or hard-to-control LLMs (e.g. DeepSeek).  
**Weaknesses:** Less mathematically deterministic than the Script as Authority approach; game logic lives in the LLM's head, not in code.

> **Important:** This philosophy uses a completely different runtime than `markdown-evaluator.js`. The AST evaluator, `state` object, and JS code blocks described above are **not involved**. See [The Dice-Replacer Scripts](#the-dice-replacer-scripts-standalone-alternatives) for the full technical details.

---

## The Dice-Replacer Scripts (Standalone Alternatives)

The `dice-replacer-*.js` scripts are **drop-in replacements for `markdown-evaluator.js`**. They share no code with the AST evaluator. Instead of parsing JS blocks, they:

1. **Replace `<<xdy>>` placeholders** — The source text (personality, scenario) may contain notation like `<<3d6>>`. The script rolls that dice expression and substitutes the summed total in place before the prompt is assembled.
2. **Inject `<PRE_COMPUTED_DATA>`** — The script automatically prepends a block of fresh dice arrays and the full DM system instructions to `context.character.personality` at runtime. **Do not add this block or the DM prompts manually to your personality file.**
3. **Prepend a stateless-API acknowledgement** — The LLM API is stateless and cannot tell whether a dice array is fresh or stale from chat history. The script prepends a rotating "Turn N: I acknowledge these fresh dice, starting at index 0" statement on every call to force the LLM to reset its index tracking.

### Configuring Dice Arrays

By default, the injection script generates two dice sets: `3d6` (for players) and `4d5` (for NPCs). You can completely customize these! 

Open `src/dice-replacer-entry.ts` before building and locate the **USER CONFIGURATION** block at the top:
```typescript
// --- USER CONFIGURATION ---
const configuredDice: DiceConfig[] = [
    { count: 3, sides: 6, amountToRoll: 8 },
    { count: 4, sides: 5, amountToRoll: 8 }
];
```
Change this array to `[{ count: 1, sides: 20, amountToRoll: 10 }]` to switch your bot to a standard d20 system. The script will automatically calculate new checksums and rewrite the DM system instructions to tell the LLM it only has d20s available.

### Choosing an Engine

`npm run build:dice` produces five output files controlled by the `Mode` enum in `src/dice-replacer.ts`:

| Engine file | `bot_define_rules` | LLM behavior | `scenario.md` |
|---|---|---|---|
| `dice-replacer-dm-advanced.js`<br>`dice-replacer-dm-simple.js` | `true` | LLM invents game rules dynamically (full DM mode) | can be left mostly empty |
| `dice-replacer-strict-advanced.js`<br>`dice-replacer-strict-simple.js` | `false` | LLM follows rules you have written explicitly | Must define all mechanics, thresholds, and formulas in detail |
| `dice-replacer-vanilla.js` | `N/A` | Vanilla dice replacement only with no prepends. | N/A |

### `dice-replacer-strict-*.js` First-Message Seeding

For the strict engine, you must manually seed the top of `first_message.md` with the "Turn 0" acknowledgement statement. This ensures the bot understands the fresh-dice paradigm from the very first LLM response. Copy the `followRulesAdditionalPrepend` string from `src/dice-replacer.ts` and add a fully-summed `<PRE_COMPUTED_DATA>` example block (e.g. all 10s for `3d6`, all 12s for `4d5`) at the top of `first_message.md`.

### What to Put in Your Bot Files (Dice-Replacer)

| File | `dice-replacer-dm-*.js` (DM mode) | `dice-replacer-strict-*.js` (Strict Narrator) |
|------|------------------------------|---------------------------------------------|
| `personality.md` | Character traits, world-building, tracking format. Keep short. | Character traits, world constraints, and explicit game mechanics. Keep short; delegate math to `scenario.md`. |
| `scenario.md` | Can be left blank or hold brief location flavour text. | **Required.** Deterministic rules, stat formulas, phased encounter loops, dice thresholds. Leave no room for LLM interpretation. |
| `first_message.md` | Opening narration and initial state. | Opening narration, initial state, **plus** the Turn 0 seeding block (see above). |

---

## Advanced Usage: Combining Scripts

While the three main script philosophies are typically used individually, advanced bot creators can chain `markdown-evaluator.js` (the AST evaluator) and `dice-replacer-vanilla.js` (the raw dice parser) in the Bot update screen in the Script Edit view. Depending on the order you chain them, you dictate the execution priority:

### Pattern A: `dice-replacer-vanilla.js` top -> `bundle.js` bottom

In this pattern, the dice-replacer runs **first**. It scans the entire prompt and replaces any `<<xdy>>` placeholders with hard integers.

*Afterward*, `markdown-evaluator.js` executes. Because the dice have already been replaced, your AST JavaScript logic blocks can actually read those hard numbers from the code block, execute state logic on them internally, and determine the output. 

**Example:**
If you have a block `var d = <<3d6>>; if(d > 10){ console.log("Hit!"); }`, the dice-replacer evaluates it to `var d = 14; if(d > 10)...` and the AST parsed logic subsequently sees and executes `var d = 14`.

### Pattern B: `markdown-evaluator.js` top -> `dice-replacer-vanilla.js` bottom

In this pattern, the AST evaluator runs **first**. It executes all game logic and evaluates all `if/else` conditions without any inherent dice math. However, the `console.log()` statements it prints can be formatted to output `<<xdy>>` tags.

*Afterward*, the `dice-replacer` executes. It scans the LLM's final prompt—which now includes the raw `<<xdy>>` tags the AST evaluator just `console.log()`'d into the text—and rolls them right before sending the prompt to the AI.

**Example:**
Your JS code `if (state.hp < 10) console.log("Took <<3d6>> damage!");` prints raw tags. The dice-replacer then intercepts that and turns it into `Took 12 damage!` for the LLM to narrate.

> **Important:** Only combine `dist/markdown-evaluator.js` with `dist/dice-replacer-vanilla.js`. Do not combine `markdown-evaluator.js` with the `dm` or `strict` engine variables, as their auto-prepends and system instructions will conflict entirely with the AST paradigm.

### Pattern C: Incorporating `memory-manager.js`

If you are using the `dist/memory-manager.js` compiled script, it should be appended at the end of your workflow chaining. This script waits until turn `N` (default: 10), and then prepends an instruction to the LLM's system prompt to summarize the narrative history.

#### Configuring the Memory Manager

By default, the injection script triggers every `10` turns and uses a generic summary prompt. You can customize the interval and the prompt!

Open `src/memory-manager-entry.ts` before building and locate the **USER CONFIGURATION** block at the top:
```typescript
// --- USER CONFIGURATION ---
const MEMORY_INTERVAL = 10;
const MEMORY_PROMPT = \`[MEMORY MANAGER]: The narrative context window is getting long. Summarize the key narrative events of the last \${MEMORY_INTERVAL} turns and display the summary clearly at the end of your response.\`;
// --------------------------
```
Change the interval to 20, or update the prompt to specify exactly what the LLM should care about (e.g., _"Summarize the development of the romance between {{user}} and {{char}}"_). Run `npm run build:memory` to save your changes.

---

## Building a Bot

Every Janitor AI bot built with this system requires three files. Paste each file's content into the corresponding field in the Janitor AI bot editor.

### The Three Files

| File | Janitor AI field | Purpose |
|------|-----------------|---------|
| `personality.md` | Personality | Character definition, system instructions, LLM behavioral rules, state tracking format |
| `scenario.md` | Scenario | JS game logic blocks (Script as Authority) or world-building context (DM pattern) |
| `first_message.md` | First Message | Opening narration and initial state values |

See the template files in `.agent/skills/janitor-ai-bot-development/assets/` for ready-to-use starting points.

### State Persistence

> **Critical:** The `state` object is rebuilt entirely from the LLM's text output on every turn. If the LLM does not print a tracked variable (e.g. `hp : 50`) in its message, `state.hp` will be `undefined` on the next turn.

In `personality.md`, explicitly instruct the LLM to append a tracking block at the end of every response. Specify the exact format:

```
hp : [value]
gold : [value]
poison_active = [true/false]
```

Every variable you need to survive between turns must appear in this block.

### Writing JavaScript Blocks

Use ` ```js ` or ` ```javascript ` fences in `personality.md` or `scenario.md`:

```javascript
// Read state from the previous turn
if (state.hp === undefined) {
    state.hp = 100;
    console.log("HP initialized to 100.");
}

// Modify state
if (state.hp < 30) {
    console.log("Warning: HP critically low.");
}

// Roll dice
var dmg = roll(2, 6);
state.hp = state.hp - dmg;
console.log("Took " + dmg + " damage. HP is now " + state.hp);
```

### Janitor AI Text Macros

Use these built-in placeholders anywhere in your prompts and `console.log()` output:

| Macro | Resolves to |
|-------|------------|
| `{{user}}` | Player character's name |
| `{{char}}` | Bot's name |
| `{{sub}}` | Subjective pronoun (he/she/they) |
| `{{obj}}` | Objective pronoun (him/her/them) |
| `{{poss}}` | Possessive pronoun (his/her/their) |
| `{{poss_p}}` | Plural possessive (his/hers/theirs) |
| `{{ref}}` | Reflexive pronoun (himself/herself/themselves) |

---

## No-Code Bot Creation with an Agentic IDE

> **Don't want to write code or craft detailed prompts yourself?** Agentic IDEs—tools that use an AI agent to perform coding and writing tasks on your behalf—can build your entire bot from a single conversational request. Antigravity *(no association with this repository)* is one such tool that supports the skill definitions packaged in this repo.

This repository ships two agent skills under `.agent/skills/`. An agentic IDE compatible with the [agentskills.io](https://agentskills.io) specification will automatically load the right skill when it detects your intent, then generate all three bot files (`personality.md`, `scenario.md`, `first_message.md`) for you, ready to paste into the Janitor AI bot editor.

---

### Skill 1: `janitor-ai-bot-development` — Script as Authority

**Use when:** You want `dist/markdown-evaluator.js` and deterministic, code-driven game logic.

The skill activates whenever you ask the agent to **create, modify, or structure a Janitor AI bot**.

**Example prompts:**

```
Create a Janitor AI RPG bot where the player fights zombies.
Track HP and gold. Use the Script as Authority pattern.
```

```
Build a Janitor AI dungeon bot with a 20-sided-die attack system.
The script should handle all the math, not the LLM.
```

```
Make a Janitor AI bot for a text adventure with stamina and poison mechanics.
```

The agent will produce all three files, including JS logic blocks in `scenario.md` that pre-calculate every possible outcome and instruct the LLM to narrate only the correct branch.

---

### Skill 2: `janitor-ai-dm-bot-development` — DM Free Mode and Strict Narrator Mode

**Use when:** You want `dist/dice-replacer-dm-*.js` or `dist/dice-replacer-strict-*.js`.

The skill activates whenever you ask the agent to **create an unstructured Janitor AI DM or RPG game loop**. Within this skill, the agent chooses between the two engine variants based on whether you ask for **free, open-ended rules** or **strict, deterministic rules**—so your phrasing drives the engine selection.

#### Free DM Mode (`dice-replacer-dm-simple.js`) — LLM invents rules on the fly

**Example prompts:**

```
Create an unstructured Janitor AI DM bot set in a grimdark fantasy world.
Let the LLM invent the rules dynamically.
```

```
Build a Janitor AI Dungeon Master bot for a horror setting.
Use the dice-replacer engine in free DM mode.
```

```
Make a Janitor AI DM bot for a sci-fi RPG.
I don't want to write any game rules—let the AI figure it out.
```

The agent will create a minimal `personality.md` and `first_message.md` (and leave `scenario.md` mostly blank). The `dice-replacer-dm-simple.js` engine automatically injects the DM system instructions and fresh dice arrays at runtime—you do not need to add them.

#### Strict Narrator Mode (`dice-replacer-strict-simple.js`) — LLM follows rules you define

Including phrases like **"strict"**, **"deterministic rules"**, or **"follow rules explicitly"** tells the agent to use the strict engine variant and to write a fully-specified `scenario.md`.

**Example prompts:**

```
Create an unstructured Janitor AI DM bot with strict deterministic rules.
I want explicit damage formulas and phase-based encounter loops.
Use the dice-replacer-strict engine.
```

```
Build a Janitor AI strict narrator bot for a fantasy RPG.
Define all combat math in the scenario file.
The LLM must follow the rules, not invent them.
```

```
Make a Janitor AI DM bot where every rule is written down explicitly.
Use the strict dice-replacer mode so the LLM cannot freelance the numbers.
```

The agent will produce a detailed `personality.md`, a fully-specified `scenario.md` (with damage formulas, encounter phases, and NPC archetype tables), and a `first_message.md` that includes the required Turn 0 seeding block for the stateless-API bypass.

---

## Quick Example

**Bot's last message (LLM output):**
```
situation: gloom
stamina - 4
```

**Personality prompt (excerpt):**
~~~
```javascript
if (state.situation === undefined) {
    console.log("{{char}} does not know the situation yet.");
} else if (state.situation === "happy") {
    console.log("{{char}} is joyful and dancing.");
} else if (state.situation === "gloom") {
    console.log("{{char}} is on the verge of tears. Things are bad.");
}

if (state.stamina < 5) {
    console.log("{{char}} is exhausted.");
}
```
~~~

**What the LLM sees in its prompt (after evaluation):**
```
{{char}} is on the verge of tears. Things are bad.
{{char}} is exhausted.
```

See `examples/rpg-personality.md` for a more complete multi-block example with cross-block state persistence.

---

## Build & Test

### Prerequisites

```bash
npm install
```

### Build

| Command | Output | Use for |
|---------|--------|---------|
| `npm run build` | `dist/markdown-evaluator.js` | "LLM as Router, Script as Authority" — the full AST evaluator |
| `npm run build:dice` | `dist/dice-replacer-dm-advanced.js`<br>`dist/dice-replacer-dm-simple.js` | "LLM Free Reign / DM" — standalone dice-injection, DM invents rules |
| `npm run build:dice` | `dist/dice-replacer-strict-advanced.js`<br>`dist/dice-replacer-strict-simple.js` | "LLM Free Reign / Strict Narrator" — standalone dice-injection, rules written by you |
| `npm run build:dice` | `dist/dice-replacer-vanilla.js` | "Vanilla" — standalone dice-injection only, no rules injected |
| `npm run build:memory`| `dist/memory-manager.js` | Periodic summary instructions for long-term memory handling |

Paste the contents of the appropriate output file into the Advanced Script box in Janitor AI.

### Test

The AST evaluator has comprehensive Jest coverage:

```bash
npm run test
```
