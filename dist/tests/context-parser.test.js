"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_parser_1 = require("../src/context-parser");
describe('extractStateFromMessage', () => {
    it('should correctly parse colon, hyphen, gt, and equals format', () => {
        const text = `
stamina : 4
hit-points - 9
*mana:* 8
"status" > "bad"
level = 2
        `;
        const state = (0, context_parser_1.extractStateFromMessage)(text);
        expect(state).toEqual({
            stamina: 4,
            hit_points: 9,
            mana: 8,
            status: 'bad',
            level: 2
        });
    });
    it('should skip unmatchable lines gracefully', () => {
        const text = "A generic description without values.\n\nsome_key : 5";
        const state = (0, context_parser_1.extractStateFromMessage)(text);
        expect(state).toEqual({
            some_key: 5
        });
    });
    it('should parse boolean values case-insensitively', () => {
        const text = `
is_active: TRUE
has_item: false
ready: yes
done: NO
flag1: y
flag2: n
        `;
        const state = (0, context_parser_1.extractStateFromMessage)(text);
        expect(state).toEqual({
            is_active: true,
            has_item: false,
            ready: true,
            done: false,
            flag1: true,
            flag2: false
        });
    });
});
