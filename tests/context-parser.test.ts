import { extractStateFromMessage } from '../src/context-parser';

describe('extractStateFromMessage', () => {
    it('should correctly parse colon, hyphen, gt, and equals format', () => {
        const text = `
stamina : 4
hit-points - 9
*mana:* 8
"status" > "bad"
level = 2
        `;
        const state = extractStateFromMessage(text);
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
        const state = extractStateFromMessage(text);
        expect(state).toEqual({
            some_key: 5
        });
    });
});
