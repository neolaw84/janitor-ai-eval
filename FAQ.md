# Janitor AI Markdown Evaluator - FAQ

## General Questions (For Non-Coders & Bot Creators)

### What is this project?
This project is a small, specialized toolkit that lets Janitor AI bots run simple JavaScript code logic or generate real dice rolls *during* a roleplay. It allows you to create bots that can track health, roll stats, manage inventories, or act as uncompromising Dungeon Masters.

### How do I use it? Do I need my own server?
No server is needed! The code is compiled into a single file (`dist/bundle.js` or one of the `dist/dice-replacer-*.js` files) that you paste directly into your Advanced Script box and attach to your bot. When the Janitor AI website loads your bot, it automatically reads the code and runs the logic before it sends the chat to the AI.

### I don't know JavaScript or TypeScript. How do I make use of it?
You don't need to know how to code to use this! The pre-compiled `.js` files are already included in this GitHub repository. You can simply copy the text from `dist/bundle.js` or a `dist/dice-replacer-*.js` variant and paste it directly into the Advanced Script box and attach to your bot.

For the actual bot development (setting up the rules in your Personality and Scenario), you can:
1. Upload the files from this GitHub repository to the Google Gemini app (as code) and ask it to write the bot logic for you.
2. Use an agentic IDE (like Antigravity) to help you build the bot.

*Disclaimer: This repository and project have no official relationship or affiliation with Google.*

### What is the "LLM as Router, Script as Authority" philosophy?
In this design, you write rigid JavaScript inside your scenario that dictates *exactly* what happens (e.g., "If health drops below 5, give player status 'Injured'"). The AI reads the chat, decides what action the player took, and then simply connects that action to the pre-written consequence. The AI is not allowed to make up the rules.

### What is the "LLM Free Reign / Dice-Replacer" philosophy?
Some AI models (like DeepSeek) have a hard time following strict scripting rules and want to narrate deeply. Instead of fighting them, the `dice-replacer` gives the AI true random dice rolls (e.g., `<PRE_COMPUTED_DATA> 3d6: [9, 14, 5...]`). You then instruct the AI to act as a Dungeon Master, invent the rules dynamically, and use the dice rolls one by one to determine if the player succeeds.

*Note: The "Router" philosophy and the "Dice-Replacer" philosophy are generally two distinct ways to build a bot using this repo. You typically choose exactly one philosophy, but advanced users can learn how to combine them sequentially (see the "Advanced Usage" section in the README).*

### Can I use both the Javascript evaluator and the dice replacer together?
Yes, using an advanced sequence. You can copy the contents of `dist/bundle.js` and `dist/dice-replacer-vanilla.js` into your bot's script box sequentially. Depending on which script is placed on top, you can either have the dice roll first (so your javascript can read the random number) or have your javascript evaluate first (and output raw `<<xdy>>` templates for the dice replacer to process last). **Do not use the `dm` or `strict` dice-replacers for this—only the `vanilla` variant.**

### What is the `Mode` enum in `dice-replacer.ts`?
By default, there are 5 different `Mode` enums used to compile 5 variants of the `dice-replacer` pattern.

*   **`DM` vs `Strict`**: If `DM`, the AI acts as the DM and invents the rules on the fly. You can leave your `scenario.md` blank. If `Strict`, the AI is instructed to act merely as a narrator that *strictly follows the rules* you have manually written.
*   **`Simple` vs `Advanced`**: The simple modes prepend a static stateless API bypass acknowledgment. Advamced modes use a rotating, turn-based nuanced response to improve instruction salience.
*   **`Vanilla`**: Completely vanilla dice replacement without any prepends or rules injected.

---

## Technical Questions (For Developers)

### Why write a custom AST parser instead of just using `eval()` or `new Function()`? 
Janitor AI's execution environment strictly prohibits the use of `eval()` and `new Function()` for security reasons. Attempting to use either will crash the script silently. Thus, a custom library-free Lexer, Parser, and Interpreter had to be built from scratch to safely execute embedded code blocks.

### Why are `function` keywords and ternaries (`? :`) not supported?
The custom AST parser is lightweight and explicitly built to support a *small subset* of JavaScript necessary for game logic.
*   **Functions:** The Lexer has trouble differentiating between trailing brackets and statements, leading to orphan semicolon parsing errors. Inline your logic instead.
*   **Ternaries:** The sandbox crashes on the `?` token. Stick to standard `if/else if/else` blocks natively.

### What is exposed to the sandbox?
Only a tightly controlled set of globals is allowed. You have access to:
*   A shared `state` object (to persist variables across executed blocks).
*   A safe subset of `Math`: `floor`, `ceil`, `round`, `max`, `min`, `abs`, `random`.
*   Global helpers: `roll(x, y)` and `rollxdy(x, y)` for quick simulated dice rolls.
*   Native prototype methods for built-in types like Arrays (`[1,2].push()`) and Strings (`toUpperCase()`).
Anything outside of this (like `fetch` or `window`) immediately fails.

### How does the `dice-replacer` bypass the statelessness of the API?
When the LLM receives the prompt, it doesn't know if the chat is new or old—it's stateless. If we provide an array of dice rolls, the LLM might look at the chat history and say "I used index 0 and 1 last turn, so I should use index 2 now." However, the script evaluates *fresh* dice on every turn. 

To trick the LLM into discarding the chat history's state, the parser dynamically cycles through a list of "prepends" (e.g., "Turn 5: I prepare this response knowing these dice are freshly prepared. I will use them starting from index 0."). This creates high "instruction salience" forcing the LLM to restart its index tracking securely.

### My script isn't working or doing anything. How do I figure out what's wrong?
Because the evaluator is a completely isolated sandbox, a syntax error or an illegal action will silently fail to prevent breaking the chat output. However, it *does* securely log the error to your browser (if you open the "Edit Script" dialog box, there is a debug window at bottom right). 
Look at the Console tab, and you will see the exact syntax error or exception thrown by the AST parser.

### How do I make sure the bot remembers my health/inventory between turns?
The system utilizes a `state` object that persists between JS block evaluations. **However, there is a major trap:** The `state` is entirely reconstructed from the LLM's text output in the chat history. 
If the LLM forgets to print `hp: 50` in its response, the `state.hp` variable will evaluate as `undefined` on the very next player turn! You must strictly prompt the LLM to *always* output the complete, current state at the bottom of its messages.

### Can my bot connect to the internet, fetch data from an API, or save things permanently to a database?
No. For strict security and privacy reasons, `fetch`, `XMLHttpRequest`, and browser DOM APIs (`window`, `document`) are completely blocked from the evaluation environment. The bot's "memory" exists solely within the text of the current chat session's history.

### Is it safe to paste someone else's script into my bot?
Yes. Because the custom AST evaluator acts as a strict whitelist, it is structurally impossible for a script to steal access tokens, manipulate the Janitor website, or perform malicious browser actions. The sandbox can only perform math and modify the specific string text inside the bot's prompt. 

### Why do I get an error when I use `const`, `let`, or `var`?
The AST parser evaluates a very simplified subset of JavaScript. You do not need to (and cannot) declare variables using `const`, `let`, or `var`. Instead, directly assign your variables to the persistent `state` object (e.g., use `state.tempValue = 5;` instead of `let tempValue = 5;`).
