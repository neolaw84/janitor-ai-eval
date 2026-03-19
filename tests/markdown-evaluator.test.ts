import { evaluateMarkdownCodeBlocks } from '../src/markdown-evaluator';

describe('evaluateMarkdownCodeBlocks', () => {
    it('should ignore non-js blocks', () => {
        const md = "```python\nprint('hello')\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe(md);
    });

    it('should evaluate and replace simple arithmetic and console.log', () => {
        const md = "Hello\n```javascript\nlet a = 10; let b = 20; console.log(a + b);\n```\nWorld";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("Hello\n30\nWorld");
    });

    it('should evaluate string concatenation', () => {
        const md = "```javascript\nconst greet = \"Hello, \" + \"World!\"; console.log(greet);\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("Hello, World!");
    });

    it('should handle if/else if/else logic', () => {
        const md = "```js\nlet hp = 50;\nif (hp > 80) {\n  console.log('Healthy');\n} else if (hp > 30) {\n  console.log('Injured');\n} else {\n  console.log('Dying');\n}\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("Injured");
    });

    it('should handle for loop and arrays', () => {
        const md = "```javascript\nlet arr = [1, 2, 3];\nlet sum = 0;\nfor(let i = 0; i < 3; i++) {\n  sum += arr[i];\n}\nconsole.log('Sum: ' + sum);\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("Sum: 6");
    });

    it('should handle multiple console logs', () => {
        const md = "```javascript\nconsole.log('First');\nconsole.log('Second');\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("First\nSecond");
    });

    it('should handle multiple blocks', () => {
        const md = "Block 1: ```js\nconsole.log(1+1);\n``` Block 2: ```javascript\nconsole.log('A'+'B');\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("Block 1: 2 Block 2: AB");
    });

    it('should evaluate Math and custom roll functions', () => {
        const md = "```javascript\nconst d20 = roll(1, 20);\nconst maxVal = Math.max(10, 5);\nconsole.log(maxVal);\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("10");

        const md2 = "```javascript\nconsole.log(rollxdy(2, 6) >= 2);\n```";
        expect(evaluateMarkdownCodeBlocks(md2)).toBe("true");
    });

    it('should natively execute Array and String methods via MemberExpression', () => {
        const md = "```javascript\nconst text = 'hello world'.toUpperCase();\nconst arr = [1, 2, 3];\narr.push(4);\nconsole.log(text, arr.join('-'));\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("HELLO WORLD 1-2-3-4");
    });

    it('should correctly evaluate null and undefined checks', () => {
        const md = "```javascript\nlet a = null;\nlet b;\nconsole.log(a === null, b === undefined, a == undefined);\n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("true true true");
    });

    it('should gracefully handle invalid JS within blocks by returning an empty string', () => {
        const md = "```javascript\n console.log( 10 + ); \n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("");
    });

    it('should forbid unwhitelisted functions/objects completely and fail gracefully', () => {
        const md = "```javascript\n fetch('http://evil.com'); \n```";
        expect(evaluateMarkdownCodeBlocks(md)).toBe("");
    });

    it('should inject readonly state properties based on secondary argument', () => {
        const injectedState = { hp: 50, status: "poisoned" };
        const md = "```js\nif (state.hp > 20) { console.log(state.status); }\n```";
        expect(evaluateMarkdownCodeBlocks(md, injectedState)).toBe("poisoned");
    });

    it('allows reassignment to the state object natively', () => {
        const injectedState = { hp: 50 };
        const md = "```js\nstate.hp = 99;\nconsole.log(state.hp);\n```";
        expect(evaluateMarkdownCodeBlocks(md, injectedState)).toBe("99");
    });

    it('should share state mutations across multiple blocks', () => {
        const injectedState: Record<string, string | number | boolean> = { hp: 50 };
        const md = '```js\nstate.hp = 99;\n```\n separator \n```javascript\nconsole.log(state.hp);\n```';
        expect(evaluateMarkdownCodeBlocks(md, injectedState)).toBe('\n separator \n99');
    });

    it('should persist state across separate evaluations when the state object reference is shared (simulating Personality + Scenario separate calls)', () => {
        const sharedState: Record<string, string | number | boolean> = { hp: 100 };
        const personalitySrc = '```js\nstate.hp -= 30;\n```';
        const scenarioSrc = '```javascript\nconsole.log(state.hp);\n```';

        evaluateMarkdownCodeBlocks(personalitySrc, sharedState);
        const result = evaluateMarkdownCodeBlocks(scenarioSrc, sharedState);
        expect(result).toBe('70');
    });

    it('should forbid object creation (object literals) and fail gracefully', () => {
        const md = '```javascript\nlet a = {"x": 1, "y": 2};\nconsole.log(a.x !== undefined);\n```';
        expect(evaluateMarkdownCodeBlocks(md)).toBe("");
    });

    it('should correctly handle general property lookup with spaces and fallback logic', () => {
        const state = { "Primary Key": "Value A" };
        const md = "```js\n" +
            "var val = (state[\"Primary Key\"] || state[\"Primary_Key\"] || \"default\").toString().toLowerCase();\n" +
            "console.log(val);\n" +
            "```";
        expect(evaluateMarkdownCodeBlocks(md, state)).toBe("value a");

        const state2 = { "Primary_Key": "Value B" };
        expect(evaluateMarkdownCodeBlocks(md, state2)).toBe("value b");

        const state3 = { "Other": "X" };
        expect(evaluateMarkdownCodeBlocks(md, state3)).toBe("default");
    });

    it('should handle numeric and boolean values via .toString() in the lookup chain', () => {
        const state = { "Num": 123, "Bool": true };
        const md = "```js\n" +
            "console.log((state.Num || 0).toString(), (state.Bool || false).toString());\n" +
            "```";
        expect(evaluateMarkdownCodeBlocks(md, state)).toBe("123 true");
    });
});
