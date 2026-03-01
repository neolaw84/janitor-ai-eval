## Game Play Mechanics (Hidden from Player)
*This is where the "LLM as Router, Script as Authority" pattern is implemented. The script calculates the outcomes of all possible intents here, and the LLM narratively routes to the appropriate script output below.*

### 1. {{user}} Attacks
If and only if {{user}} attempts to attack the zombie, here is the outcome:
```js
if (state.hp !== undefined) {
    if (state.hp <= 0) {
        console.log("SYSTEM INSTRUCTION: {{user}} tried to attack, but is already dead! The action fails. Set status to 'dead'.");
    } else {
        var baseDmg = roll(1, 6);
        var hitRoll = roll(1, 20);
        console.log("DECISION: IF {{user}} attacked the zombie, here is the result:");
        if (hitRoll > 10) {
            console.log("CONSEQUENCE: Hit! {{user}} deals " + baseDmg + " damage. (Roll: " + hitRoll + ")");
        } else {
            console.log("CONSEQUENCE: Miss! The zombie dodged the attack. (Roll: " + hitRoll + ")");
        }
    }
}
```

### 2. Zombie Attacks {{user}}
If and only if the zombie attacks {{user}}, here is the outcome:
```javascript
if (state.hp !== undefined && state.hp > 0) {
    var zombieHit = roll(1, 20);
    console.log("DECISION: IF the zombie attacked {{user}}, here is the result:");
    if (zombieHit > 12) {
        var dmg = roll(1, 4);
        var oldHp = state.hp;
        var newHp = oldHp - dmg;
        if (newHp < 0) { newHp = 0; } // Safe floor, no ternaries
        console.log("CONSEQUENCE: The zombie bites {{user}}! player_hp " + oldHp + " -> " + newHp);
    } else {
        console.log("CONSEQUENCE: The zombie's attack misses {{user}} completely.");
    }
}
```
