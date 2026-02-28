const { evaluateMarkdownCodeBlocks } = require('./dist/bundle.js');
console.log(evaluateMarkdownCodeBlocks('`\`\`javascript\nlet a = {"x": 1, "y": 2};\nconsole.log(a.x !== undefined);\n`\`\`'));
