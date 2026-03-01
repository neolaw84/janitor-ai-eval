# Janitor AI Markdown Evaluator

This project is a standalone, lightweight JavaScript AST evaluator designed to securely execute a whitelist subset of JavaScript embedded within Markdown code blocks.

## Purpose

This utility was created specifically for the Janitor AI environment to safely evaluate JavaScript embedded in `context.character.personality` and `context.character.scenario`. 

Because LLM cannot be trusted with mathematically complex code, and `eval()` or creating sandboxes are NOT allowed (silently crashes), this utility implements a library-free Lexer, Parser, and Interpreter from scratch that allows bot creators to write simple JavaScript code blocks that are executed in Janitor AI Scripting environment.

## Features Supported
The Custom AST environment enforces the following JavaScript subset:
- Arithmetic and Logical expressions
- String concatenation
- Arrays and native Javascript prototype methods (e.g. `[1,2].push(3)` or `"str".toUpperCase()`)
- `if`/`else if`/`else` branches
- Basic `for` loops
- A mock `console.log()` whose output replaces the code block in the Markdown.

### Exposed Globals
To aid RPG bot creation, the sandbox natively provides:
- **`Math`**: A safe subset of operators: `Math.floor`, `Math.ceil`, `Math.round`, `Math.max`, `Math.min`, `Math.abs`, and `Math.random`
- **`roll(x, y)`** (and alias **`rollxdy(x, y)`**): Easily simulate rolling `x` dice with `y` sides.

**Security Guarantee:** Any commands attempting to use external API functions (like `fetch`, `window`, etc.) immediately fail. Infinite loops and literal `while(true)` operations are also structurally avoided or rewritten for Janitor AI compatibility.
If a codeblock is fundamentally malformed or attempts an illegal sandbox breakout, the Evaluator catches the exception, logs it securely to the native underlying browser console, and silently skips processing the block so it does not destroy standard text output.

### Strict Syntax Limitations (Important!)
Because the AST parser is exceptionally strict, it will crash and throw exceptions if you violate these rules:
- **No `function` declarations**: Do not try to declare helper macros (e.g., `state.myFunc = function() {}`). It causes trailing semicolon parsing errors. Write everything inline.
- **No Ternary Operators**: Do not use `condition ? a : b`. Only use standard `if/else` clusters.
- **No Semicolons in Strings**: Do not place semicolons inside string concatenations (e.g. `console.log("value: " + val + ";")`). The lexer chokes on inner punctuation.

## Example Bot Usage
The sandbox automatically extracts variables out of the chat history and makes them available globally via the `state` object.

### 1. LLM Output Example
If the last message from the bot (i.e. second-to-last message in chat history) says:
```text
situation: gloom
stamina - 4
```

### 2. Personality Prompt
You can write instructions in your bot's personality utilizing these variables directly:
~~~
In the current situation, {{char}} will act as follows:

```javascript
if (state.situation === null || state.situation === undefined) {
    console.log("she does not know the situation yet.");
} else if (state.situation === "happy") {
    console.log("she is joyful and dancing.");
} else if (state.situation === "gloom") {
    console.log("she is almost cry. this is bad");
}

// Logic based on other extracted states
if (state.stamina < 5) {
    console.log("she is very tired.");
}
```
~~~

### 3. Example Output
```text
she does not know the situation yet.
she is very tired.
```

## Usage
The entry script located at `src/index.ts` automatically runs `evaluateMarkdownCodeBlocks` on the global Janitor AI `context`.

To build the minified browser-ready payload:
```bash
npm install
npm run build
```
This produces `dist/bundle.js` which can be injected directly into the Janitor AI platform without dependencies.

## Testing
The behavior of the Abstract Syntax Tree evaluator has comprehensive Jest coverage.
```bash
npm run test
```
