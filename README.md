# Janitor AI Markdown Evaluator

A standalone, dependency-free JavaScript sandbox for the [Janitor AI](https://janitorai.com) scripting environment. It lets you embed simple JavaScript blocks inside your bot's Personality and Scenario prompts to drive deterministic game logic—health tracking, dice rolls, branching consequences—without relying on the LLM to do the math.

> **Don't know how to code?** You don't need to build this yourself. The pre-compiled files (`dist/bundle.js`, `dist/dice-replacer.js`) are already included in this repository. Copy the contents of whichever file matches your chosen bot pattern and paste it into your bot's Advanced Script box on Janitor AI.

---

## Table of Contents

1. [Why This Exists](#why-this-exists)
2. [How It Works](#how-it-works)
3. [The Sandbox](#the-sandbox)
4. [Two Bot Philosophies](#two-bot-philosophies)
5. [Building a Bot](#building-a-bot)
6. [Quick Example](#quick-example)
7. [Build & Test](#build--test)

---

## Why This Exists

Janitor AI's scripting environment prohibits `eval()` and `new Function()`—both crash silently. This project implements a custom Lexer, Parser, and Interpreter (a lightweight AST evaluator) entirely from scratch so that bots can execute safe JavaScript logic without any of those banned constructs.

---

## How It Works

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

### 2. LLM Free Reign / Dungeon Master (`dice-replacer`)

**Use this with:** `dist/dice-replacer.js` or `dist/dice-replacer-strict.js`

Instead of making the LLM follow a rigid script, this pattern injects freshly-rolled dice arrays into the personality prompt *before* the LLM call. The LLM is instructed to act as an uncompromising Dungeon Master—inventing or applying rules, then consuming the pre-computed dice sequentially to resolve them.

**Strengths:** Works well with narrative-heavy or hard-to-control LLMs.  
**Weaknesses:** Less mathematically deterministic than the Script as Authority approach.

**How the dice injection works:**

The source text may contain `<<xdy>>` placeholders (e.g. `<<3d6>>`). Before the prompt is assembled, `rollAndReplaceDice()` evaluates each placeholder and replaces it with a rolled total. The compiled engine also automatically prepends the `<PRE_COMPUTED_DATA>` block and the DM system instructions to `context.character.personality` at runtime—**do not add these manually** to your personality file.

Currently supported dice types in the pre-computed block: `3d6` and `4d5`.

**Stateless API bypass:** Because the LLM API is stateless, it might try to continue dice index counting from the chat history. The engine combats this by prepending a rotating "Turn N: I acknowledge the fresh dice, starting at index 0" instruction on every call, creating high instruction salience.

#### Choosing an Engine

The build step `npm run build:dice` produces two output files based on the `bot_define_rules` flag in `src/dice-replacer.ts`:

| Engine file | `bot_define_rules` | LLM behavior |
|---|---|---|
| `dice-replacer.js` | `true` (default) | LLM invents game rules dynamically (full DM mode). Leave `scenario.md` mostly empty. |
| `dice-replacer-strict.js` | `false` | LLM follows rules you have written explicitly. `scenario.md` must define all mechanics, thresholds, and formulas in detail. |

For `dice-replacer-strict.js`, you must also manually seed the top of `first_message.md` with the "Turn 0" acknowledgement statement (see `src/dice-replacer.ts` for the `followRulesAdditionalPrepend` string and a fully-summed `<PRE_COMPUTED_DATA>` example block).

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
| `npm run build` | `dist/bundle.js` | "LLM as Router, Script as Authority" pattern |
| `npm run build:dice` | `dist/dice-replacer.js`, `dist/dice-replacer-strict.js` | "LLM Free Reign / DM" pattern |

Paste the contents of the appropriate output file into the Advanced Script box in Janitor AI.

### Test

The AST evaluator has comprehensive Jest coverage:

```bash
npm run test
```
