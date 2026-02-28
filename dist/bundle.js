/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/context-parser.ts"
(__unused_webpack_module, exports) {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractStateFromMessage = extractStateFromMessage;
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
    return state;
}


/***/ },

/***/ "./src/markdown-evaluator.ts"
(__unused_webpack_module, exports) {


// src/utils/markdown-evaluator.ts
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Interpreter = void 0;
exports.evaluateMarkdownCodeBlocks = evaluateMarkdownCodeBlocks;
// Since we cannot use libraries and `eval` is dangerous in Janitor AI due to potential XSS,
// we are implementing a simplified custom AST Lexer, Parser, and Interpreter.
// The supported subset includes:
// - arithmetic and logical expression
// - string concatenation
// - simple if/else if/else
// - array and simple for loop (with 3 parts)
// - console.log()
// --- LEXER ---
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Number"] = 0] = "Number";
    TokenType[TokenType["String"] = 1] = "String";
    TokenType[TokenType["Identifier"] = 2] = "Identifier";
    TokenType[TokenType["Keyword"] = 3] = "Keyword";
    TokenType[TokenType["Operator"] = 4] = "Operator";
    TokenType[TokenType["Punctuation"] = 5] = "Punctuation";
    TokenType[TokenType["EOF"] = 6] = "EOF";
})(TokenType || (TokenType = {}));
const Keywords = ['var', 'let', 'const', 'if', 'else', 'for', 'true', 'false', 'null', 'undefined'];
const Operators = ['+', '-', '*', '/', '%', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '=', '++', '--', '+=', '-='];
const Punctuation = ['(', ')', '{', '}', '[', ']', ',', ';', '.', ':'];
class Lexer {
    constructor(code) {
        this.code = code;
        this.pos = 0;
        this.char = this.code.length > 0 ? this.code[0] : null;
    }
    advance() {
        this.pos++;
        if (this.pos < this.code.length) {
            this.char = this.code[this.pos];
        }
        else {
            this.char = null;
        }
    }
    peek() {
        if (this.pos + 1 < this.code.length) {
            return this.code[this.pos + 1];
        }
        return null;
    }
    skipWhitespace() {
        while (this.char !== null && /\s/.test(this.char)) {
            this.advance();
        }
    }
    skipComments() {
        if (this.char === '/' && this.peek() === '/') {
            while (this.char !== null && this.char !== '\n') {
                this.advance();
            }
        }
    }
    number() {
        let result = '';
        let hasDot = false;
        while (this.char !== null && (/\d/.test(this.char) || (this.char === '.' && !hasDot))) {
            if (this.char === '.')
                hasDot = true;
            result += this.char;
            this.advance();
        }
        return { type: TokenType.Number, value: result };
    }
    string(quoteChar) {
        let result = '';
        this.advance(); // Skip opening quote
        while (this.char !== null && this.char !== quoteChar) {
            if (this.char === '\\' && this.peek() === quoteChar) {
                result += quoteChar;
                this.advance();
                this.advance();
            }
            else {
                result += this.char;
                this.advance();
            }
        }
        this.advance(); // Skip closing quote
        return { type: TokenType.String, value: result };
    }
    identifierOrKeyword() {
        let result = '';
        while (this.char !== null && /[a-zA-Z0-9_]/.test(this.char)) {
            result += this.char;
            this.advance();
        }
        if (Keywords.indexOf(result) !== -1) {
            return { type: TokenType.Keyword, value: result };
        }
        return { type: TokenType.Identifier, value: result };
    }
    getNextToken() {
        while (this.char !== null) {
            this.skipWhitespace();
            this.skipComments();
            this.skipWhitespace();
            if (this.char === null)
                break;
            if (/\d/.test(this.char)) {
                return this.number();
            }
            if (/[a-zA-Z_]/.test(this.char)) {
                return this.identifierOrKeyword();
            }
            if (this.char === '"' || this.char === "'") {
                return this.string(this.char);
            }
            // Check multi-char operators first
            let multiCharOp = false;
            if (['=', '!', '<', '>'].indexOf(this.char) !== -1) {
                const next = this.peek();
                if (next === '=') {
                    const nextNext = this.pos + 2 < this.code.length ? this.code[this.pos + 2] : null;
                    if (nextNext === '=' && (this.char === '=' || this.char === '!')) {
                        const v = this.char + '==';
                        this.advance();
                        this.advance();
                        this.advance();
                        return { type: TokenType.Operator, value: v };
                    }
                    const v = this.char + '=';
                    this.advance();
                    this.advance();
                    return { type: TokenType.Operator, value: v };
                }
            }
            if (['+', '-'].indexOf(this.char) !== -1) {
                const next = this.peek();
                if (next === this.char || next === '=') {
                    const v = this.char + next;
                    this.advance();
                    this.advance();
                    return { type: TokenType.Operator, value: v };
                }
            }
            if (this.char === '&' && this.peek() === '&') {
                this.advance();
                this.advance();
                return { type: TokenType.Operator, value: '&&' };
            }
            if (this.char === '|' && this.peek() === '|') {
                this.advance();
                this.advance();
                return { type: TokenType.Operator, value: '||' };
            }
            if (Operators.indexOf(this.char) !== -1) {
                const v = this.char;
                this.advance();
                return { type: TokenType.Operator, value: v };
            }
            if (Punctuation.indexOf(this.char) !== -1) {
                const v = this.char;
                this.advance();
                return { type: TokenType.Punctuation, value: v };
            }
            throw new Error(`Lexer Error: Unexpected character: ${this.char}`);
        }
        return { type: TokenType.EOF, value: 'EOF' };
    }
}
// --- PARSER ---
class Parser {
    constructor(code) {
        this.lexer = new Lexer(code);
        this.currentToken = this.lexer.getNextToken();
    }
    error(msg) {
        throw new Error(`Parser Error: ${msg} (at token: ${this.currentToken.value})`);
    }
    eat(type, value) {
        if (this.currentToken.type === type && (!value || this.currentToken.value === value)) {
            this.currentToken = this.lexer.getNextToken();
        }
        else {
            this.error(`Expected ${TokenType[type]} ${value ? value : ''}, got ${TokenType[this.currentToken.type]} ${this.currentToken.value}`);
        }
    }
    parse() {
        return this.program();
    }
    program() {
        const statements = [];
        while (this.currentToken.type !== TokenType.EOF) {
            statements.push(this.statement());
        }
        return { type: 'Program', body: statements };
    }
    statement() {
        if (this.currentToken.type === TokenType.Keyword) {
            if (this.currentToken.value === 'var' || this.currentToken.value === 'let' || this.currentToken.value === 'const') {
                return this.variableDeclaration();
            }
            if (this.currentToken.value === 'if') {
                return this.ifStatement();
            }
            if (this.currentToken.value === 'for') {
                return this.forStatement();
            }
        }
        if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === '{') {
            return this.blockStatement();
        }
        return this.expressionStatement();
    }
    blockStatement() {
        this.eat(TokenType.Punctuation, '{');
        const statements = [];
        while (!(this.currentToken.type === TokenType.Punctuation && this.currentToken.value === '}')) {
            statements.push(this.statement());
        }
        this.eat(TokenType.Punctuation, '}');
        return { type: 'BlockStatement', body: statements };
    }
    variableDeclaration() {
        const kind = this.currentToken.value;
        this.eat(TokenType.Keyword); // let, var, const
        const declarations = [];
        let declaring = true;
        while (declaring) {
            const id = this.currentToken.value;
            this.eat(TokenType.Identifier);
            let init = null;
            if (this.currentToken.type === TokenType.Operator && this.currentToken.value === '=') {
                this.eat(TokenType.Operator, '=');
                init = this.expression();
            }
            declarations.push({ id, init });
            if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ',') {
                this.eat(TokenType.Punctuation, ',');
            }
            else {
                break;
            }
        }
        if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ';') {
            this.eat(TokenType.Punctuation, ';');
        }
        return { type: 'VariableDeclaration', kind, declarations };
    }
    ifStatement() {
        this.eat(TokenType.Keyword, 'if');
        this.eat(TokenType.Punctuation, '(');
        const test = this.expression();
        this.eat(TokenType.Punctuation, ')');
        const consequent = this.statement();
        let alternate = null;
        if (this.currentToken.type === TokenType.Keyword && this.currentToken.value === 'else') {
            this.eat(TokenType.Keyword, 'else');
            alternate = this.statement();
        }
        return { type: 'IfStatement', test, consequent, alternate };
    }
    forStatement() {
        this.eat(TokenType.Keyword, 'for');
        this.eat(TokenType.Punctuation, '(');
        let init = null;
        if (this.currentToken.type !== TokenType.Punctuation || this.currentToken.value !== ';') {
            if (this.currentToken.type === TokenType.Keyword && (this.currentToken.value === 'var' || this.currentToken.value === 'let')) {
                init = this.variableDeclaration(); // handles its own semicolon
            }
            else {
                init = this.expressionStatement(); // handles its own semicolon
            }
        }
        else {
            this.eat(TokenType.Punctuation, ';');
        }
        let test = null;
        if (this.currentToken.type !== TokenType.Punctuation || this.currentToken.value !== ';') {
            test = this.expression();
        }
        this.eat(TokenType.Punctuation, ';');
        let update = null;
        if (this.currentToken.type !== TokenType.Punctuation || this.currentToken.value !== ')') {
            update = this.expression();
        }
        this.eat(TokenType.Punctuation, ')');
        const body = this.statement();
        return { type: 'ForStatement', init, test, update, body };
    }
    expressionStatement() {
        const expr = this.expression();
        if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ';') {
            this.eat(TokenType.Punctuation, ';');
        }
        return { type: 'ExpressionStatement', expression: expr };
    }
    expression() {
        return this.assignment();
    }
    assignment() {
        let left = this.logicalOr();
        if (this.currentToken.type === TokenType.Operator &&
            ['=', '+=', '-='].indexOf(this.currentToken.value) !== -1) {
            const operator = this.currentToken.value;
            this.eat(TokenType.Operator);
            const right = this.assignment();
            left = { type: 'AssignmentExpression', operator, left, right };
        }
        return left;
    }
    logicalOr() {
        let node = this.logicalAnd();
        while (this.currentToken.type === TokenType.Operator && this.currentToken.value === '||') {
            this.eat(TokenType.Operator, '||');
            node = { type: 'LogicalExpression', operator: '||', left: node, right: this.logicalAnd() };
        }
        return node;
    }
    logicalAnd() {
        let node = this.equality();
        while (this.currentToken.type === TokenType.Operator && this.currentToken.value === '&&') {
            this.eat(TokenType.Operator, '&&');
            node = { type: 'LogicalExpression', operator: '&&', left: node, right: this.equality() };
        }
        return node;
    }
    equality() {
        let node = this.relational();
        while (this.currentToken.type === TokenType.Operator && ['==', '!=', '===', '!=='].indexOf(this.currentToken.value) !== -1) {
            const op = this.currentToken.value;
            this.eat(TokenType.Operator);
            node = { type: 'BinaryExpression', operator: op, left: node, right: this.relational() };
        }
        return node;
    }
    relational() {
        let node = this.additive();
        while (this.currentToken.type === TokenType.Operator && ['<', '<=', '>', '>='].indexOf(this.currentToken.value) !== -1) {
            const op = this.currentToken.value;
            this.eat(TokenType.Operator);
            node = { type: 'BinaryExpression', operator: op, left: node, right: this.additive() };
        }
        return node;
    }
    additive() {
        let node = this.multiplicative();
        while (this.currentToken.type === TokenType.Operator && ['+', '-'].indexOf(this.currentToken.value) !== -1) {
            const op = this.currentToken.value;
            this.eat(TokenType.Operator);
            node = { type: 'BinaryExpression', operator: op, left: node, right: this.multiplicative() };
        }
        return node;
    }
    multiplicative() {
        let node = this.unary();
        while (this.currentToken.type === TokenType.Operator && ['*', '/', '%'].indexOf(this.currentToken.value) !== -1) {
            const op = this.currentToken.value;
            this.eat(TokenType.Operator);
            node = { type: 'BinaryExpression', operator: op, left: node, right: this.unary() };
        }
        return node;
    }
    unary() {
        if (this.currentToken.type === TokenType.Operator && ['+', '-', '!'].indexOf(this.currentToken.value) !== -1) {
            const op = this.currentToken.value;
            this.eat(TokenType.Operator);
            return { type: 'UnaryExpression', operator: op, argument: this.unary() };
        }
        return this.updateOrCallOrMember();
    }
    updateOrCallOrMember() {
        let node = this.primary();
        let parsing = true;
        while (parsing) {
            if (this.currentToken.type === TokenType.Operator && ['++', '--'].indexOf(this.currentToken.value) !== -1) {
                const op = this.currentToken.value;
                this.eat(TokenType.Operator);
                node = { type: 'UpdateExpression', operator: op, argument: node, prefix: false };
            }
            else if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === '(') {
                this.eat(TokenType.Punctuation, '(');
                const args = [];
                if (!(this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ')')) {
                    args.push(this.expression());
                    while (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ',') {
                        this.eat(TokenType.Punctuation, ',');
                        args.push(this.expression());
                    }
                }
                this.eat(TokenType.Punctuation, ')');
                node = { type: 'CallExpression', callee: node, arguments: args };
            }
            else if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === '[') {
                this.eat(TokenType.Punctuation, '[');
                const property = this.expression();
                this.eat(TokenType.Punctuation, ']');
                node = { type: 'MemberExpression', object: node, property, computed: true };
            }
            else if (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === '.') {
                this.eat(TokenType.Punctuation, '.');
                const propertyStr = this.currentToken.value;
                this.eat(TokenType.Identifier);
                const property = { type: 'Identifier', name: propertyStr };
                node = { type: 'MemberExpression', object: node, property, computed: false };
            }
            else {
                parsing = false;
            }
        }
        return node;
    }
    primary() {
        const token = this.currentToken;
        if (token.type === TokenType.Number) {
            this.eat(TokenType.Number);
            return { type: 'Literal', value: parseFloat(token.value) };
        }
        if (token.type === TokenType.String) {
            this.eat(TokenType.String);
            return { type: 'Literal', value: token.value };
        }
        if (token.type === TokenType.Keyword) {
            if (token.value === 'true') {
                this.eat(TokenType.Keyword, 'true');
                return { type: 'Literal', value: true };
            }
            if (token.value === 'false') {
                this.eat(TokenType.Keyword, 'false');
                return { type: 'Literal', value: false };
            }
            if (token.value === 'null') {
                this.eat(TokenType.Keyword, 'null');
                return { type: 'Literal', value: null };
            }
            if (token.value === 'undefined') {
                this.eat(TokenType.Keyword, 'undefined');
                return { type: 'Identifier', name: 'undefined' }; // technically identifier in JS, mapped here to simplify
            }
        }
        if (token.type === TokenType.Identifier) {
            this.eat(TokenType.Identifier);
            return { type: 'Identifier', name: token.value };
        }
        if (token.type === TokenType.Punctuation && token.value === '(') {
            this.eat(TokenType.Punctuation, '(');
            const expr = this.expression();
            this.eat(TokenType.Punctuation, ')');
            return expr;
        }
        if (token.type === TokenType.Punctuation && token.value === '[') {
            this.eat(TokenType.Punctuation, '[');
            const elements = [];
            if (!(this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ']')) {
                elements.push(this.expression());
                while (this.currentToken.type === TokenType.Punctuation && this.currentToken.value === ',') {
                    this.eat(TokenType.Punctuation, ',');
                    elements.push(this.expression());
                }
            }
            this.eat(TokenType.Punctuation, ']');
            return { type: 'ArrayExpression', elements };
        }
        this.error(`Unexpected token in primary: ${token.value}`);
    }
}
// --- INTERPRETER ---
class Environment {
    constructor(parent = null) {
        this.parent = parent;
        this.record = {};
    }
    define(name, value) {
        this.record[name] = value;
    }
    assign(name, value) {
        if (this.record.hasOwnProperty(name)) {
            this.record[name] = value;
        }
        else if (this.parent) {
            this.parent.assign(name, value);
        }
        else {
            throw new Error(`ReferenceError: ${name} is not defined`);
        }
    }
    get(name) {
        if (this.record.hasOwnProperty(name)) {
            return this.record[name];
        }
        else if (this.parent) {
            return this.parent.get(name);
        }
        else {
            if (name === 'undefined')
                return undefined;
            throw new Error(`ReferenceError: ${name} is not defined`);
        }
    }
}
class Interpreter {
    constructor() {
        this.logs = [];
        this.env = new Environment();
        // Mock console.log
        const mockConsole = {
            log: (...args) => {
                this.logs.push(args.map(a => String(a)).join(' '));
            }
        };
        this.env.define('console', mockConsole);
        // Restricted Math subset
        const mockMath = {
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            max: Math.max,
            min: Math.min,
            random: Math.random
        };
        this.env.define('Math', mockMath);
        // Custom Dice Roll wrapper
        const rollHelper = (diceCount, faces) => {
            const numDice = Number(diceCount);
            const numFaces = Number(faces);
            if (isNaN(numDice) || isNaN(numFaces) || numDice < 1 || numFaces < 1)
                return 0;
            let sum = 0;
            for (let i = 0; i < numDice; i++) {
                sum += Math.floor(Math.random() * numFaces) + 1;
            }
            return sum;
        };
        this.env.define('roll', rollHelper);
        this.env.define('rollxdy', rollHelper);
    }
    evaluate(node, env = this.env) {
        if (!node)
            return undefined;
        switch (node.type) {
            case 'Program':
            case 'BlockStatement': {
                const blockEnv = new Environment(env);
                let res;
                for (const stmt of node.body) {
                    res = this.evaluate(stmt, blockEnv);
                }
                return res;
            }
            case 'VariableDeclaration': {
                for (const decl of node.declarations) {
                    const value = decl.init ? this.evaluate(decl.init, env) : undefined;
                    // For let/const we'd ideally define in block env, var in function, 
                    // but for this simple scoped wrapper blockEnv suffices.
                    env.define(decl.id, value);
                }
                return;
            }
            case 'ExpressionStatement': {
                return this.evaluate(node.expression, env);
            }
            case 'IfStatement': {
                if (this.evaluate(node.test, env)) {
                    return this.evaluate(node.consequent, env);
                }
                else if (node.alternate) {
                    return this.evaluate(node.alternate, env);
                }
                return;
            }
            case 'ForStatement': {
                const forEnv = new Environment(env);
                if (node.init) {
                    this.evaluate(node.init, forEnv);
                }
                while (!node.test || this.evaluate(node.test, forEnv)) {
                    this.evaluate(node.body, forEnv);
                    if (node.update) {
                        this.evaluate(node.update, forEnv);
                    }
                }
                return;
            }
            case 'AssignmentExpression': {
                const value = this.evaluate(node.right, env);
                if (node.left.type === 'Identifier') {
                    if (node.operator === '=') {
                        env.assign(node.left.name, value);
                    }
                    else if (node.operator === '+=') {
                        env.assign(node.left.name, env.get(node.left.name) + value);
                    }
                    else if (node.operator === '-=') {
                        env.assign(node.left.name, env.get(node.left.name) - value);
                    }
                    return value;
                }
                else if (node.left.type === 'MemberExpression') {
                    const obj = this.evaluate(node.left.object, env);
                    const prop = node.left.computed
                        ? this.evaluate(node.left.property, env)
                        : node.left.property.name;
                    if (node.operator === '=') {
                        obj[prop] = value;
                    }
                    else if (node.operator === '+=') {
                        obj[prop] += value;
                    }
                    else if (node.operator === '-=') {
                        obj[prop] -= value;
                    }
                    return value;
                }
                throw new Error("Invalid left-hand side in assignment");
            }
            case 'BinaryExpression': {
                const left = this.evaluate(node.left, env);
                const right = this.evaluate(node.right, env);
                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case '%': return left % right;
                    case '==': return left == right;
                    case '===': return left === right;
                    case '!=': return left != right;
                    case '!==': return left !== right;
                    case '<': return left < right;
                    case '<=': return left <= right;
                    case '>': return left > right;
                    case '>=': return left >= right;
                }
                throw new Error(`Unsupported binary operator ${node.operator}`);
            }
            case 'LogicalExpression': {
                const left = this.evaluate(node.left, env);
                if (node.operator === '&&')
                    return left && this.evaluate(node.right, env);
                if (node.operator === '||')
                    return left || this.evaluate(node.right, env);
                throw new Error(`Unsupported logical operator ${node.operator}`);
            }
            case 'UnaryExpression': {
                const arg = this.evaluate(node.argument, env);
                if (node.operator === '-')
                    return -arg;
                if (node.operator === '+')
                    return +arg;
                if (node.operator === '!')
                    return !arg;
                throw new Error(`Unsupported unary operator ${node.operator}`);
            }
            case 'UpdateExpression': {
                if (node.argument.type === 'Identifier') {
                    let val = env.get(node.argument.name);
                    const res = node.prefix
                        ? (node.operator === '++' ? ++val : --val)
                        : (node.operator === '++' ? val++ : val--);
                    env.assign(node.argument.name, val);
                    return res;
                }
                else if (node.argument.type === 'MemberExpression') {
                    const obj = this.evaluate(node.argument.object, env);
                    const prop = node.argument.computed
                        ? this.evaluate(node.argument.property, env)
                        : node.argument.property.name;
                    let val = obj[prop];
                    const res = node.prefix
                        ? (node.operator === '++' ? ++val : --val)
                        : (node.operator === '++' ? val++ : val--);
                    obj[prop] = val;
                    return res;
                }
                throw new Error("Invalid update argument");
            }
            case 'CallExpression': {
                const callee = this.evaluate(node.callee, env);
                const args = node.arguments.map((a) => this.evaluate(a, env));
                if (typeof callee === 'function') {
                    // Because we extract `console.log` object/member expr to its function,
                    // we lose `this`. For `console`, we can apply it.
                    let thisArg = null;
                    if (node.callee.type === 'MemberExpression') {
                        thisArg = this.evaluate(node.callee.object, env);
                    }
                    return callee.apply(thisArg, args);
                }
                throw new Error("TypeError: callee is not a function");
            }
            case 'MemberExpression': {
                const obj = this.evaluate(node.object, env);
                const prop = node.computed
                    ? this.evaluate(node.property, env)
                    : node.property.name;
                if (obj == null)
                    throw new Error(`TypeError: Cannot read properties of ${obj}`);
                const val = obj[prop];
                // Native array methods like push, string methods like split aren't explicitly bounded 
                // in this simple AST unless they are called.
                // CallExpression handles binding.
                return val;
            }
            case 'ArrayExpression': {
                return node.elements.map((e) => this.evaluate(e, env));
            }
            case 'Identifier': {
                return env.get(node.name);
            }
            case 'Literal': {
                return node.value;
            }
            default:
                throw new Error(`Unsupported AST Node: ${node.type}`);
        }
    }
}
exports.Interpreter = Interpreter;
/**
 * Searches for ```javascript ... ``` blocks in a markdown string,
 * evaluates the sandboxed code, and replaces the block with the accumulated
 * `console.log()` output.
 *
 * Supports a safe subset of ES5: arithmetic, strings, logic, arrays, if/for loops.
 */
function evaluateMarkdownCodeBlocks(markdown, state = {}) {
    const rx = /```(?:javascript|js)\n([\s\S]*?)```/gi;
    return markdown.replace(rx, (match, code) => {
        try {
            const parser = new Parser(code);
            const ast = parser.parse();
            const interpreter = new Interpreter();
            // Inject state variable into the sandbox
            interpreter['env'].define('state', state);
            interpreter.evaluate(ast);
            return interpreter.logs.join('\n');
        }
        catch (e) {
            // Gracefully log error via native console to aid bot creators.
            console.log("Markdown Evaluator Error:", e.message);
            // Return empty string to essentially strip the broken js and avoid breaking JanitorAI UI.
            return "";
        }
    });
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

Object.defineProperty(exports, "__esModule", ({ value: true }));
const markdown_evaluator_1 = __webpack_require__("./src/markdown-evaluator.ts");
const context_parser_1 = __webpack_require__("./src/context-parser.ts");
let injectedState = {};
if (typeof context !== 'undefined' && context.chat && Array.isArray(context.chat) && context.chat.length >= 2) {
    const targetMsg = context.chat[context.chat.length - 2];
    if (targetMsg && targetMsg.content) {
        injectedState = (0, context_parser_1.extractStateFromMessage)(targetMsg.content);
    }
}
if (typeof context !== 'undefined' && context.character) {
    if (context.character.personality) {
        context.character.personality = (0, markdown_evaluator_1.evaluateMarkdownCodeBlocks)(context.character.personality, injectedState);
    }
    if (context.character.scenario) {
        context.character.scenario = (0, markdown_evaluator_1.evaluateMarkdownCodeBlocks)(context.character.scenario, injectedState);
    }
}

})();

