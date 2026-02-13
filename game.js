// Game state
let gameState = {
    location: 'start',
    inventory: [],
    hasKey: false,
    hasSword: false,
    dragonDefeated: false
};

// Current choice mapping
let currentChoices = {};
let isTyping = false;
let typingQueue = [];

// Audio context for typing sound (optional - can be enabled)
let canPressKey = true;

// Smooth scroll to bottom
function scrollToBottom() {
    const terminalBody = document.getElementById('terminal-body');
    terminalBody.scrollTo({
        top: terminalBody.scrollHeight,
        behavior: 'smooth'
    });
}

// Typing effect - character by character like Pokemon/Zelda
async function typeText(element, text, speed = 30) {
    isTyping = true;
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        
        // Scroll as we type
        scrollToBottom();
        
        // Wait before next character
        await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    isTyping = false;
    
    // Process next in queue if any
    if (typingQueue.length > 0) {
        const next = typingQueue.shift();
        await typeText(next.element, next.text, next.speed);
    }
}

// Add line to output with typing effect
async function addOutputLine(text, className = 'story-line', speed = 30) {
    const output = document.getElementById('output');
    const line = document.createElement('p');
    line.className = className;
    output.appendChild(line);
    
    scrollToBottom();
    
    if (isTyping) {
        // Queue this text
        typingQueue.push({ element: line, text: text, speed: speed });
    } else {
        await typeText(line, text, speed);
    }
}

// Add instant line (no typing effect)
function addInstantLine(text, className = 'story-line') {
    const output = document.getElementById('output');
    const line = document.createElement('p');
    line.className = className;
    line.textContent = text;
    output.appendChild(line);
    scrollToBottom();
}

// Clear choices
function clearChoices() {
    document.getElementById('choices').innerHTML = '';
    document.getElementById('choices').style.display = 'none';
    currentChoices = {};
}

// Show choices after typing is done
function showChoices() {
    const choicesDiv = document.getElementById('choices');
    choicesDiv.style.display = 'flex';
    scrollToBottom();
}

// Add choice button
function addChoice(text, value, number) {
    const choicesDiv = document.getElementById('choices');
    const button = document.createElement('button');
    button.className = 'cmd-button';
    button.textContent = `[${number}] ${text}`;
    button.onclick = () => executeChoice(value, number);
    button.setAttribute('data-key', number);
    choicesDiv.appendChild(button);
    
    // Map the number to the choice value
    currentChoices[number.toString()] = value;
}

// Wait for typing to finish, then show choices
async function waitForTypingThenShowChoices() {
    // Wait for typing to complete
    while (isTyping || typingQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    showChoices();
}

// Execute a choice
async function executeChoice(choice, keyNumber) {
    if (isTyping) return; // Prevent input during typing
    
    // Show what the user selected
    addInstantLine(`C:\\ADVENTURE> ${keyNumber}`, 'system-text');
    
    // Clear the input
    document.getElementById('command-input').value = '';
    
    // Make the choice
    await makeChoice(choice);
}

// Update status bar
function updateStatus(status) {
    document.getElementById('status').textContent = `STATUS: ${status}`;
}

// Update inventory display
function updateInventoryDisplay() {
    const inventoryDisplay = document.getElementById('inventory-display');
    if (gameState.inventory.length === 0) {
        inventoryDisplay.textContent = 'INVENTORY: [EMPTY]';
    } else {
        inventoryDisplay.textContent = `INVENTORY: [${gameState.inventory.join(', ').toUpperCase()}]`;
    }
}

// Add item to inventory
async function addToInventory(item) {
    if (!gameState.inventory.includes(item)) {
        gameState.inventory.push(item);
        updateInventoryDisplay();
        await addOutputLine(`>> ITEM ACQUIRED: ${item.toUpperCase()}`, 'success-text', 25);
    }
}

// Keyboard input handler
document.getElementById('command-input').addEventListener('input', function(e) {
    if (isTyping) {
        e.target.value = '';
        return; // Ignore input while typing
    }
    
    const input = e.target.value;
    
    if (input && currentChoices[input]) {
        // Valid choice entered
        executeChoice(currentChoices[input], input);
    } else if (input) {
        // Invalid choice
        addInstantLine(`ERROR: Invalid command '${input}'`, 'error-text');
        e.target.value = '';
        scrollToBottom();
    }
});

// Keep input focused
document.addEventListener('click', function() {
    document.getElementById('command-input').focus();
});

// Main choice logic
async function makeChoice(choice) {
    clearChoices();
    addInstantLine('════════════════════════════════════════════════════════════', 'system-text');
    
    // Start location
    if (gameState.location === 'start') {
        if (choice === 'left') {
            gameState.location = 'cave';
            updateStatus('EXPLORING');
            await addOutputLine('> You venture left into the darkness...', 'story-line', 35);
            await addOutputLine('> A dark cave looms before you.', 'story-line', 35);
            await addOutputLine('> You hear growling sounds from deep within.', 'story-line', 35);
            await addOutputLine('> A shiny object glints near the cave entrance.', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Pick up the object', 'pickupSword', 1);
            addChoice('Enter the cave', 'enterCave', 2);
            addChoice('Go back to the forest', 'goBack', 3);
            waitForTypingThenShowChoices();
        } else if (choice === 'right') {
            gameState.location = 'village';
            updateStatus('EXPLORING');
            await addOutputLine('> You walk right along the forest path...', 'story-line', 35);
            await addOutputLine('> You discover a small village.', 'story-line', 35);
            await addOutputLine('> An old man in a hooded cloak approaches you.', 'story-line', 35);
            await addOutputLine('> "Take this key, brave one. You will need it..."', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Take the key', 'takeKey', 1);
            addChoice('Refuse and explore the village', 'exploreVillage', 2);
            waitForTypingThenShowChoices();
        }
    }
    
    // Cave location
    else if (gameState.location === 'cave') {
        if (choice === 'pickupSword') {
            gameState.hasSword = true;
            await addOutputLine('> You pick up the shiny object...', 'story-line', 35);
            await addToInventory('Sword');
            await addOutputLine('> It\'s a sword! The blade gleams with ancient power.', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Enter the cave', 'enterCave', 1);
            addChoice('Go back to the forest', 'goBack', 2);
            waitForTypingThenShowChoices();
        } else if (choice === 'enterCave') {
            if (gameState.hasSword) {
                gameState.location = 'dragon';
                updateStatus('IN COMBAT');
                await addOutputLine('> You step into the darkness...', 'story-line', 35);
                await addOutputLine('> Your eyes adjust to the dim light.', 'story-line', 35);
                await addOutputLine('> A MASSIVE DRAGON blocks your path!', 'error-text', 30);
                await addOutputLine('> Its eyes glow red in the darkness.', 'story-line', 35);
                await addOutputLine('> You grip your sword tightly.', 'story-line', 35);
                addInstantLine('', 'story-line');
                await addOutputLine('What do you do?', 'prompt-line', 35);
                addChoice('Fight the dragon', 'fightDragon', 1);
                addChoice('Try to sneak past it', 'sneakPast', 2);
                addChoice('Run away!', 'goBack', 3);
                waitForTypingThenShowChoices();
            } else {
                await addOutputLine('> You step into the cave...', 'story-line', 35);
                await addOutputLine('> ERROR: WEAPON NOT FOUND', 'error-text', 30);
                await addOutputLine('> It\'s too dangerous without a weapon!', 'story-line', 35);
                await addOutputLine('> You quickly retreat.', 'story-line', 35);
                addInstantLine('', 'story-line');
                await addOutputLine('What do you do?', 'prompt-line', 35);
                addChoice('Go back to the forest', 'goBack', 1);
                waitForTypingThenShowChoices();
            }
        } else if (choice === 'goBack') {
            gameState.location = 'start';
            updateStatus('READY');
            await addOutputLine('> You return to the forest entrance.', 'story-line', 35);
            await addOutputLine('> The path still splits in two directions.', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Go Left', 'left', 1);
            addChoice('Go Right', 'right', 2);
            waitForTypingThenShowChoices();
        }
    }
    
    // Village location
    else if (gameState.location === 'village') {
        if (choice === 'takeKey') {
            gameState.hasKey = true;
            await addOutputLine('> You accept the mysterious key.', 'story-line', 35);
            await addToInventory('Key');
            await addOutputLine('> The old man nods and vanishes into the mist.', 'story-line', 35);
            await addOutputLine('> "Defeat the beast... claim your treasure..."', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Explore the village', 'exploreVillage', 1);
            addChoice('Head to the cave', 'goToCave', 2);
            waitForTypingThenShowChoices();
        } else if (choice === 'exploreVillage') {
            await addOutputLine('> You explore the quiet village.', 'story-line', 35);
            await addOutputLine('> The buildings are empty and abandoned.', 'story-line', 35);
            await addOutputLine('> Nothing of value here.', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Head to the cave', 'goToCave', 1);
            addChoice('Rest at the inn (END GAME)', 'restInn', 2);
            waitForTypingThenShowChoices();
        } else if (choice === 'goToCave') {
            gameState.location = 'cave';
            updateStatus('EXPLORING');
            await addOutputLine('> You travel back through the forest to the cave.', 'story-line', 35);
            await addOutputLine('> The dark entrance awaits.', 'story-line', 35);
            await addOutputLine('> You see a shiny object near the entrance.', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Pick up the object', 'pickupSword', 1);
            addChoice('Enter the cave', 'enterCave', 2);
            waitForTypingThenShowChoices();
        }
    }
    
    // Dragon encounter
    else if (gameState.location === 'dragon') {
        if (choice === 'fightDragon') {
            if (gameState.hasSword) {
                gameState.dragonDefeated = true;
                updateStatus('VICTORIOUS');
                await addOutputLine('> You charge at the dragon!', 'story-line', 35);
                await addOutputLine('> Your sword clashes with its scales!', 'story-line', 35);
                await addOutputLine('> The battle is fierce...', 'story-line', 35);
                await addOutputLine('> With a final strike, the dragon falls!', 'success-text', 30);
                await addOutputLine('> Behind the dragon, you see a locked treasure chest.', 'story-line', 35);
                addInstantLine('', 'story-line');
                if (gameState.hasKey) {
                    await addOutputLine('> You have the key!', 'success-text', 30);
                    await addOutputLine('What do you do?', 'prompt-line', 35);
                    addChoice('Open the chest with the key', 'openChest', 1);
                    waitForTypingThenShowChoices();
                } else {
                    await addOutputLine('> ERROR: KEY NOT FOUND', 'error-text', 30);
                    await addOutputLine('> The chest is locked tight!', 'story-line', 35);
                    await addOutputLine('What do you do?', 'prompt-line', 35);
                    addChoice('Leave the cave', 'goBack', 1);
                    waitForTypingThenShowChoices();
                }
            }
        } else if (choice === 'sneakPast') {
            await addOutputLine('> You attempt to sneak past the dragon...', 'story-line', 35);
            await addOutputLine('> Your foot hits a loose rock!', 'story-line', 35);
            await addOutputLine('> The dragon turns its head toward you!', 'error-text', 30);
            await addOutputLine('> You run for your life!', 'story-line', 35);
            addInstantLine('', 'story-line');
            await addOutputLine('What do you do?', 'prompt-line', 35);
            addChoice('Run back to the forest', 'goBack', 1);
            waitForTypingThenShowChoices();
        } else if (choice === 'openChest') {
            endGame('win');
        }
    }
    
    // End game scenarios
    if (choice === 'restInn') {
        endGame('rest');
    }
}

// End game function
async function endGame(outcome) {
    clearChoices();
    addInstantLine('════════════════════════════════════════════════════════════', 'system-text');
    
    if (outcome === 'win') {
        updateStatus('GAME COMPLETE');
        await addOutputLine('> You insert the key into the lock...', 'story-line', 35);
        await addOutputLine('> *CLICK*', 'success-text', 50);
        await addOutputLine('> The chest opens, revealing mountains of gold!', 'success-text', 30);
        await addOutputLine('> Precious gems sparkle in the torchlight!', 'success-text', 30);
        await addOutputLine('> YOU ARE VICTORIOUS!', 'success-text', 25);
        addInstantLine('', 'story-line');
        addInstantLine('════════════════════════════════════════════════════════════', 'system-text');
        await addOutputLine('GAME OVER - VICTORY ACHIEVED', 'success-text', 30);
    } else if (outcome === 'rest') {
        updateStatus('GAME OVER');
        await addOutputLine('> You decide to rest at the village inn.', 'story-line', 35);
        await addOutputLine('> The adventure ends here...', 'story-line', 35);
        await addOutputLine('> Perhaps another time, brave adventurer.', 'story-line', 35);
        addInstantLine('', 'story-line');
        addInstantLine('════════════════════════════════════════════════════════════', 'system-text');
        await addOutputLine('GAME OVER - PEACEFUL ENDING', 'system-text', 30);
    }
    
    addInstantLine('', 'story-line');
    await addOutputLine('Press R to restart...', 'prompt-line', 35);
    
    // Enable restart with R key
    document.addEventListener('keydown', function restartHandler(e) {
        if (e.key.toLowerCase() === 'r') {
            location.reload();
        }
    });
}

// Initialize game with typing effect
async function initGame() {
    await addOutputLine('> Welcome, adventurer! You stand at the edge of a dark forest.', 'story-line', 35);
    await addOutputLine('> The path splits in two directions.', 'story-line', 35);
    await addOutputLine('What do you do?', 'prompt-line', 35);
    
    addChoice('Go Left', 'left', 1);
    addChoice('Go Right', 'right', 2);
    
    currentChoices = {
        '1': 'left',
        '2': 'right'
    };
    
    waitForTypingThenShowChoices();
}

// Start the game
updateInventoryDisplay();
updateStatus('READY');
document.getElementById('command-input').focus();

// Start initial typing
initGame();