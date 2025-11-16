class PixelTombstoneGame {
    constructor(options = {}) {
        this.gameState = 'waiting'; // waiting, countdown, ready, drawing, shooting, finished
        this.mouseEnabled = false;
        this.playerHealth = 100;
        this.opponentHealth = 100;
        this.selectedCharacter = options.selectedCharacter || 'wyatt';
        this.opponentCharacter = options.opponentCharacter || this.selectOpponentCharacter();
        this.countdownInterval = null;
        this.opponentAITimeout = null;

        // Drawing mechanic states
        this.playerHasDrawn = false;
        this.opponentHasDrawn = false;

        // AI adaptation system - they learn your patterns!
        this.roundNumber = 0;
        this.aiAdaptationBonus = 0;

        // Multiplayer properties - now configurable via constructor
        this.isMultiplayer = options.isMultiplayer || false;
        this.multiplayerManager = options.multiplayerManager || null;
        this.isPlayerOnLeft = options.isPlayerOnLeft !== undefined ? options.isPlayerOnLeft : true;

        // Initialize audio
        this.initializeAudio();

        // Force immediate initialization
        setTimeout(() => {
            try {
                console.log('Initializing PixelTombstoneGame...');
                console.log('  - isMultiplayer:', this.isMultiplayer);
                console.log('  - selectedCharacter:', this.selectedCharacter);
                console.log('  - opponentCharacter:', this.opponentCharacter);

                this.initializeGame();
                this.setupEventListeners();

                // Only start countdown if not multiplayer (multiplayer countdown is controlled by host)
                if (!this.isMultiplayer) {
                    console.log('Starting single-player countdown...');
                    this.startCountdown();
                } else {
                    console.log('Multiplayer mode detected - waiting for host to start countdown...');
                }
                console.log('PixelTombstoneGame initialization complete');
            } catch (error) {
                console.error('Error initializing PixelTombstoneGame:', error);
            }
        }, 100);
    }

    initializeGame() {
        console.log('Initializing pixel game...');

        // Update character sprites based on selection
        this.updateCharacterSprites();

        // Initialize crosshair
        this.crosshair = document.getElementById('crosshair');

        // Hide mouse cursor completely but show crosshair
        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';

        // Add no-cursor class to game arena
        const gameArena = document.getElementById('game-arena');
        if (gameArena) {
            gameArena.classList.add('no-cursor');
        }

        // Initialize health bars
        const playerHealth = document.getElementById('player-health');
        const opponentHealth = document.getElementById('opponent-health');
        if (playerHealth) playerHealth.style.width = '100%';
        if (opponentHealth) opponentHealth.style.width = '100%';

        console.log('Game initialized successfully');
    }

    // Character dialogue system
    getCharacterDialogue(character, situation) {
        const dialogue = {
            wyatt: {
                countdown: ["You tell 'em I'm coming... and hell's coming with me!", "I'm gonna finish this thing!", "That's just my game."],
                draw: ["Now I'm coming!", "You gonna do something or just stand there and bleed?"],
                hit: ["I said throw down, boy!", "You're a daisy if you do."],
                miss: ["Skin that smokewagon!", "Go ahead... skin it!"],
                victory: ["You're no daisy at all!", "Law and order have arrived."],
                death: ["Tell my story...", "This was supposed to be my time..."]
            },
            doc: {
                countdown: ["I'm your huckleberry.", "Say when.", "You're a daisy if you do."],
                draw: ["I have two guns, one for each of ya!", "Why Johnny Tyler... you madcap!"],
                hit: ["You're so drunk, you're probably seeing double.", "I'm afraid the strain was more than he could bear."],
                miss: ["My hypocrisy only goes so far.", "Evidently Mr. Tyler is an accomplished marksman."],
                victory: ["That was just too easy.", "I'm your huckleberry... that's just my game."],
                death: ["This is funny...", "I'll be damned..."]
            },
            johnny: {
                countdown: ["Smells like someone died.", "You're no daisy.", "I was just foolin' about."],
                draw: ["Juventus stultorum magister.", "My Latin's better than yours."],
                hit: ["Credat Judaeus apella, non ego.", "Age quod agis."],
                miss: ["In pace requiescat.", "Eventus stultorum magister."],
                victory: ["The superiority of the educated mind.", "Lunatic ravings of a demented mind."],
                death: ["Well... I'll be damned...", "This ain't how it was supposed to end..."]
            },
            curly: {
                countdown: ["Well... bye.", "I'm gonna get you for this.", "You son of a..."],
                draw: ["Time to dance!", "Now we'll see who's boss!"],
                hit: ["How do ya like that?", "Not so tough now!"],
                miss: ["Damn it all!", "Lucky shot!"],
                victory: ["That's what I'm talkin' about!", "Nobody messes with Curly Bill!"],
                death: ["Well I'll be...", "This ain't over..."]
            }
        };

        const lines = dialogue[character]?.[situation] || [];
        return lines[Math.floor(Math.random() * lines.length)] || "";
    }

    showSpeechBubble(character, text, duration = 3000) {
        const isPlayer = character === this.selectedCharacter;
        const bubbleId = isPlayer ? 'player-speech' : 'opponent-speech';
        const bubble = document.getElementById(bubbleId);

        if (!bubble || !text) return;

        bubble.textContent = text;
        bubble.classList.add('show');

        // Hide bubble after duration
        setTimeout(() => {
            bubble.classList.remove('show');
        }, duration);
    }

    showCountdownTaunts() {
        // Player character speaks first
        const playerTaunt = this.getCharacterDialogue(this.selectedCharacter, 'countdown');
        if (playerTaunt) {
            setTimeout(() => {
                this.showSpeechBubble(this.selectedCharacter, playerTaunt, 4000);
            }, 1000); // 1 second after countdown starts
        }

        // Opponent responds
        const opponentTaunt = this.getCharacterDialogue(this.opponentCharacter, 'countdown');
        if (opponentTaunt) {
            setTimeout(() => {
                this.showSpeechBubble(this.opponentCharacter, opponentTaunt, 4000);
            }, 3500); // 3.5 seconds after countdown starts
        }

        // Sometimes add a final exchange
        if (Math.random() < 0.5) {
            const finalPlayerTaunt = this.getCharacterDialogue(this.selectedCharacter, 'countdown');
            if (finalPlayerTaunt) {
                setTimeout(() => {
                    this.showSpeechBubble(this.selectedCharacter, finalPlayerTaunt, 3000);
                }, 6500); // 6.5 seconds after countdown starts
            }
        }
    }

    updateCharacterSprites() {
        // Update opponent character selection first
        this.updateOpponentCharacter();

        const playerElement = document.getElementById('pixel-player');
        const opponentElement = document.getElementById('pixel-opponent');

        // Set data attributes for CSS targeting
        if (playerElement) {
            playerElement.setAttribute('data-character', this.selectedCharacter);
            playerElement.setAttribute('data-state', 'idle');
            this.setCharacterImage(playerElement, this.selectedCharacter, 'idle');
        }

        if (opponentElement) {
            opponentElement.setAttribute('data-character', this.opponentCharacter);
            opponentElement.setAttribute('data-state', 'idle');
            this.setCharacterImage(opponentElement, this.opponentCharacter, 'idle');
        }

        console.log(`Updated character sprites: Player=${this.selectedCharacter}, Opponent=${this.opponentCharacter}`);
    }

    setCharacterImage(characterElement, character, state) {
        const imageElement = characterElement.querySelector('.character-image');
        if (!imageElement) return;

        const imagePaths = {
            wyatt: {
                idle: 'assets/images/wyatt-idle-removebg-preview.png',
                drawing: 'assets/images/wyatt-draw-removebg-preview.png',
                shooting: 'assets/images/wyatt-shoot-removebg-preview.png',
                dead: 'assets/images/wyatt-dead.png'
            },
            doc: {
                idle: 'assets/images/doc-idle-removebg-preview.png',
                drawing: 'assets/images/doc-draw-removebg-preview.png',
                shooting: 'assets/images/doc-shoot-removebg-preview.png',
                dead: 'assets/images/doc-dead.png'
            },
            johnny: {
                idle: 'assets/images/ringo-idle-removebg-preview.png',
                drawing: 'assets/images/ringo-draw-removebg-preview.png',
                shooting: 'assets/images/ringo-shoot-removebg-preview.png',
                dead: 'assets/images/ringo-dead.png'
            },
            curly: {
                idle: 'assets/images/curly-idle (2).png',
                drawing: 'assets/images/curly-draw (2).png',
                shooting: 'assets/images/curly-shoot (2).png',
                dead: 'assets/images/curly-dead.png'
            }
        };

        const imagePath = imagePaths[character]?.[state] || imagePaths[character]?.idle;
        if (imagePath) {
            imageElement.src = imagePath;
            characterElement.setAttribute('data-state', state);

            // Ensure proper flipping is maintained
            const isPlayer = characterElement.classList.contains('player');
            const isOpponent = characterElement.classList.contains('opponent');

            if (isPlayer) {
                // Player characters face right (no flip) except for specific shooting cases
                if (state === 'shooting' && (character === 'wyatt' || character === 'curly')) {
                    imageElement.style.transform = 'scaleX(-1)';
                } else {
                    imageElement.style.transform = 'scaleX(1)';
                }
            } else if (isOpponent) {
                // Opponent characters always face left (flipped)
                imageElement.style.transform = 'scaleX(-1)';
            }
        }
    }

    animateCharacterShoot(characterElement, character) {
        // Animation sequence: idle -> drawing -> shooting -> idle
        this.setCharacterImage(characterElement, character, 'drawing');

        setTimeout(() => {
            this.setCharacterImage(characterElement, character, 'shooting');

            // Fire bullet effect
            const isPlayer = characterElement.classList.contains('player');
            this.createBullet(isPlayer);

            // Play gunshot sound
            this.playSound('gunshot');

            setTimeout(() => {
                this.setCharacterImage(characterElement, character, 'idle');
            }, 800); // Hold shooting pose for 800ms (increased from 300ms)
        }, 500); // Hold draw pose for 500ms before shooting (increased from 150ms)
    }

    createBullet(fromPlayer) {
        const gameArena = document.getElementById('game-arena');
        if (!gameArena) return;

        // Create highly visible orange bullet
        const bullet = document.createElement('div');
        bullet.className = 'bullet';
        bullet.style.cssText = `
            position: absolute;
            width: 16px;
            height: 6px;
            background: linear-gradient(90deg, #ff4400, #ff6600, #ffaa00, #ffdd00);
            border-radius: 3px;
            box-shadow: 0 0 15px #ff6600, 0 0 25px #ff4400, 0 0 35px #ff8800;
            border: 1px solid #ffdd00;
            z-index: 100;
        `;

        // Create brighter orange bullet trail
        const trail = document.createElement('div');
        trail.className = 'bullet-trail';
        trail.style.cssText = `
            position: absolute;
            width: 0;
            height: 4px;
            background: linear-gradient(90deg, transparent, #ff4400, #ff6600, #ffaa00, transparent);
            box-shadow: 0 0 10px #ff6600;
            z-index: 99;
        `;

        // Position bullet at character chest/gun level (raised by 20px)
        const bulletHeight = 'calc(75% - 20px)';
        bullet.style.top = bulletHeight;
        trail.style.top = bulletHeight;

        if (fromPlayer) {
            // Player shoots from left to right
            bullet.style.left = '25%';
            bullet.style.animation = 'bulletFlyRight 0.4s linear forwards';
            trail.style.left = '25%';
            trail.style.animation = 'trailExpandRight 0.4s linear forwards';

            // Add gun smoke effect
            this.createGunSmoke(document.getElementById('pixel-player'));
        } else {
            // Opponent shoots from right to left
            bullet.style.right = '25%';
            bullet.style.animation = 'bulletFlyLeft 0.4s linear forwards';
            trail.style.right = '25%';
            trail.style.animation = 'trailExpandLeft 0.4s linear forwards';

            // Add gun smoke effect
            this.createGunSmoke(document.getElementById('pixel-opponent'));
        }

        // Add to game arena
        gameArena.appendChild(bullet);
        gameArena.appendChild(trail);

        // Remove bullet after animation completes
        setTimeout(() => {
            if (bullet.parentNode) bullet.parentNode.removeChild(bullet);
            if (trail.parentNode) trail.parentNode.removeChild(trail);
        }, 400);

        // Add bullet animations if not already present
        this.addBulletAnimations();
    }

    createBloodSplatter(characterElement, isKillShot) {
        if (!characterElement) return;

        const splatterCount = isKillShot ? 8 : 4;

        for (let i = 0; i < splatterCount; i++) {
            const splatter = document.createElement('div');
            splatter.className = 'blood-splatter';

            // Random positioning around the character
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 80;
            const size = Math.random() * 8 + 4;

            splatter.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, #8B0000, #FF0000, #8B0000);
                border-radius: 50%;
                transform: translate(${offsetX}px, ${offsetY}px);
                opacity: 0.8;
                animation: bloodFade 2s ease-out forwards;
                z-index: 95;
            `;

            characterElement.appendChild(splatter);

            // Remove splatter after animation
            setTimeout(() => {
                if (splatter.parentNode) {
                    splatter.parentNode.removeChild(splatter);
                }
            }, 2000);
        }

        // Add blood animation if not present
        this.addBloodAnimations();
    }

    createGunSmoke(characterElement) {
        if (!characterElement) return;

        const smokeCount = 3;

        for (let i = 0; i < smokeCount; i++) {
            const smoke = document.createElement('div');
            smoke.className = 'gun-smoke';

            const offsetX = Math.random() * 20 - 10;
            const offsetY = Math.random() * 15 - 5;
            const size = Math.random() * 15 + 10;

            smoke.style.cssText = `
                position: absolute;
                left: 70%;
                top: 45%;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(128,128,128,0.6), rgba(200,200,200,0.3), transparent);
                border-radius: 50%;
                transform: translate(${offsetX}px, ${offsetY}px);
                animation: smokeDissipate 1.5s ease-out forwards;
                animation-delay: ${i * 0.1}s;
                z-index: 98;
            `;

            characterElement.appendChild(smoke);

            // Remove smoke after animation
            setTimeout(() => {
                if (smoke.parentNode) {
                    smoke.parentNode.removeChild(smoke);
                }
            }, 1500 + (i * 100));
        }

        // Add smoke animation if not present
        this.addSmokeAnimations();
    }

    addBulletAnimations() {
        if (document.querySelector('#bullet-animations')) return;

        const style = document.createElement('style');
        style.id = 'bullet-animations';
        style.textContent = `
            @keyframes bulletFlyRight {
                0% { left: 25%; opacity: 1; }
                100% { left: 75%; opacity: 0; }
            }

            @keyframes bulletFlyLeft {
                0% { right: 25%; opacity: 1; }
                100% { right: 75%; opacity: 0; }
            }

            @keyframes trailExpandRight {
                0% { left: 25%; width: 0; opacity: 0.8; }
                50% { width: 200px; opacity: 0.6; }
                100% { left: 75%; width: 50px; opacity: 0; }
            }

            @keyframes trailExpandLeft {
                0% { right: 25%; width: 0; opacity: 0.8; }
                50% { width: 200px; opacity: 0.6; }
                100% { right: 75%; width: 50px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    addBloodAnimations() {
        if (document.querySelector('#blood-animations')) return;

        const style = document.createElement('style');
        style.id = 'blood-animations';
        style.textContent = `
            @keyframes bloodFade {
                0% { opacity: 0.8; transform: translate(var(--x), var(--y)) scale(0.5); }
                20% { opacity: 1; transform: translate(var(--x), var(--y)) scale(1.2); }
                100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    addSmokeAnimations() {
        if (document.querySelector('#smoke-animations')) return;

        const style = document.createElement('style');
        style.id = 'smoke-animations';
        style.textContent = `
            @keyframes smokeDissipate {
                0% {
                    opacity: 0.6;
                    transform: translate(var(--x), var(--y)) scale(0.3);
                }
                50% {
                    opacity: 0.4;
                    transform: translate(var(--x), var(--y)) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(var(--x), var(--y)) scale(1.5);
                }
            }
        `;
        document.head.appendChild(style);
    }

    getCharacterBackground(character) {
        const backgrounds = {
            wyatt: 'linear-gradient(to bottom, #000 0%, #000 25%, #DEB887 25%, #DEB887 65%, #0000FF 65%, #0000FF 100%)',
            doc: 'linear-gradient(to bottom, #696969 0%, #696969 25%, #F5DEB3 25%, #F5DEB3 65%, #FFFFFF 65%, #FFFFFF 100%)',
            johnny: 'linear-gradient(to bottom, #000 0%, #000 25%, #DEB887 25%, #DEB887 65%, #8B0000 65%, #8B0000 100%)',
            curly: 'linear-gradient(to bottom, #654321 0%, #654321 25%, #DAA520 25%, #DAA520 65%, #8B4513 65%, #8B4513 100%)'
        };
        return backgrounds[character] || backgrounds.wyatt;
    }

    startCountdown() {
        console.log('Starting countdown...');
        this.gameState = 'countdown';

        const countdownDisplay = document.getElementById('countdown-display');
        const countdownNumber = document.getElementById('countdown-number');
        const instructionsDisplay = document.getElementById('game-instructions');

        if (!countdownDisplay || !countdownNumber) {
            console.error('Countdown elements not found!');
            return;
        }

        countdownDisplay.style.display = 'block';

        // Show crosshair during countdown and enable mouse movement
        if (this.crosshair) {
            this.crosshair.style.display = 'block';
            this.crosshair.style.transform = 'translate(-50%, -50%)';
        }

        // Show draw button during countdown
        this.showDrawButtons();

        if (instructionsDisplay) {
            instructionsDisplay.innerHTML = '<p>Wait for the bell... Don\'t draw or shoot early or you lose!</p>';
        }

        // Show character taunts during countdown
        this.showCountdownTaunts();

        let countdown = 10;
        countdownNumber.textContent = countdown;
        console.log('Countdown started at:', countdown);

        // Clear any existing interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        this.countdownInterval = setInterval(() => {
            countdown--;
            countdownNumber.textContent = countdown;
            console.log('Countdown:', countdown);

            // Clock hands removed - no longer needed

            if (countdown <= 0) {
                console.log('Countdown finished, triggering bell');
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
                this.triggerBell();
            }
        }, 1000);
    }

    triggerBell() {
        const bell = document.getElementById('bell');

        // Ring the bell animation
        if (bell) {
            bell.style.animation = 'bellRing 0.5s ease-in-out 3';
        }

        // Play bell sound
        this.playSound('bell');

        console.log('🔔 BELL RINGS!');

        setTimeout(() => {
            console.log('Bell finished, enabling draw and shoot phase');
            this.gameState = 'ready';
            this.mouseEnabled = true; // Can shoot immediately after countdown

            // Keep crosshair visible and movable
            if (this.crosshair) {
                this.crosshair.style.display = 'block';
            }

            // Keep cursor completely hidden
            document.body.style.cursor = 'none';
            document.documentElement.style.cursor = 'none';

            const countdownDisplay = document.getElementById('countdown-display');
            const instructionsDisplay = document.getElementById('game-instructions');

            if (countdownDisplay) countdownDisplay.style.display = 'none';
            if (instructionsDisplay) {
                instructionsDisplay.innerHTML = '<p style="color: #ff6600; font-size: 1.2rem;">DRAW!</p><p>Draw your gun and shoot!</p>';
            }

            // Draw buttons are already visible from countdown

            // Only start AI in single player mode
            if (!this.isMultiplayer) {
                console.log('🤖 SINGLE-PLAYER: Starting AI opponents...');
                // Start opponent draw AI
                this.startOpponentDrawAI();
                // Also start opponent shooting AI
                this.startOpponentAI();
            } else {
                console.log('🎮 MULTIPLAYER: AI disabled, waiting for real player actions from Firebase...');
                console.log('  - multiplayerManager:', !!this.multiplayerManager);
                console.log('  - playerId:', this.multiplayerManager?.playerId);
            }
        }, 1000);
    }

    startOpponentAI() {
        // Clear any existing opponent AI timeout
        if (this.opponentAITimeout) {
            clearTimeout(this.opponentAITimeout);
            this.opponentAITimeout = null;
        }

        // DEADLY AI - much more aggressive and challenging
        const characterStats = this.getCharacterStats(this.opponentCharacter);

        // AI gets faster and more aggressive each round!
        this.roundNumber++;
        this.aiAdaptationBonus = Math.min(0.3, this.roundNumber * 0.05); // Up to 30% speed bonus

        // Slightly slower reaction times - made 15% easier
        const baseReactionTime = 2200 - (characterStats.speed * 18); // Reduced speed advantage
        const adaptedReactionTime = baseReactionTime * (1 - this.aiAdaptationBonus * 0.85); // Reduced adaptation bonus

        // More variation - less consistency
        const speedVariation = characterStats.speed > 85 ? 350 : 600; // More variation for less predictability
        const reactionTime = Math.max(500, adaptedReactionTime + Math.random() * speedVariation); // Minimum 500ms (was 300ms)

        console.log(`🔥 DEADLY ${this.opponentCharacter} AI (Round ${this.roundNumber}) engaging with ${reactionTime}ms delay (Speed: ${characterStats.speed}, Adaptation: +${(this.aiAdaptationBonus * 100).toFixed(1)}%)`);

        this.opponentAITimeout = setTimeout(() => {
            if (this.gameState === 'ready') {
                this.opponentShoot();
            }
        }, reactionTime);
    }

    opponentShoot() {
        console.log('Opponent shoots!');

        // Animate opponent shooting
        const opponentElement = document.getElementById('pixel-opponent');
        if (opponentElement) {
            this.animateCharacterShoot(opponentElement, this.opponentCharacter);
        }

        // LETHAL hit calculation - they're deadly professionals!
        const characterStats = this.getCharacterStats(this.opponentCharacter);

        // Reduced accuracy boost - made 15% easier
        const baseAccuracyBoost = 0.05 + (this.aiAdaptationBonus * 0.85); // Reduced from 0.15 to 0.05
        const enhancedAccuracy = Math.min(0.90, (characterStats.accuracy / 100) + baseAccuracyBoost); // Capped at 90% instead of 98%
        const hit = Math.random() < enhancedAccuracy;

        if (hit) {
            // Reduced kill shot chances - made 15% easier
            const baseKillChance = 0.25 + ((characterStats.accuracy - 65) / 120); // 25-50% kill shot chance (was 40-70%)
            const isKillShot = Math.random() < baseKillChance;

            // Less devastating damage
            const damage = isKillShot ? 100 : (25 + Math.random() * 30); // 25-55 damage for body shots (was 40-75)

            console.log(`💀 ${this.opponentCharacter} HIT! Enhanced accuracy: ${(enhancedAccuracy * 100).toFixed(1)}%, Kill shot chance: ${(baseKillChance * 100).toFixed(1)}%, KILL SHOT: ${isKillShot}`);

            this.playerHealth = Math.max(0, this.playerHealth - damage);
            this.updateHealthBar('player', this.playerHealth);

            // Opponent taunt when hitting
            const hitTaunt = this.getCharacterDialogue(this.opponentCharacter, 'hit');
            if (hitTaunt) {
                this.showSpeechBubble(this.opponentCharacter, hitTaunt, 2000);
            }

            // Flash player character red when hit and add blood splatter
            const playerSprite = document.querySelector('#pixel-player .character-sprite');
            if (playerSprite) {
                playerSprite.style.filter = 'hue-rotate(0deg) brightness(150%) sepia(100%)';
                setTimeout(() => {
                    playerSprite.style.filter = '';
                }, 200);
            }

            // Add blood splatter effect
            this.createBloodSplatter(document.getElementById('pixel-player'), isKillShot);

            if (isKillShot || this.playerHealth <= 0) {
                // Show player death animation
                const playerElement = document.getElementById('pixel-player');
                if (playerElement) {
                    this.setCharacterImage(playerElement, this.selectedCharacter, 'dead');
                    const playerSprite = playerElement.querySelector('.character-sprite');
                    if (playerSprite) {
                        playerSprite.style.filter = 'grayscale(50%) brightness(80%)';
                    }
                }
                this.endGame('opponent');
                return;
            }
        } else {
            console.log(`${this.opponentCharacter} missed! (Enhanced accuracy: ${(enhancedAccuracy * 100).toFixed(1)}%) - Lucky escape!`);

            // Opponent taunt when missing
            const missTaunt = this.getCharacterDialogue(this.opponentCharacter, 'miss');
            if (missTaunt) {
                this.showSpeechBubble(this.opponentCharacter, missTaunt, 2000);
            }
        }

        // Continue the duel - both players get another chance
        setTimeout(() => {
            if (this.playerHealth > 0 && this.opponentHealth > 0) {
                console.log('Continuing duel after opponent shot...');
                this.gameState = 'ready';
                this.mouseEnabled = true;
                this.crosshair.style.display = 'block';

                // Restart opponent AI for next round (single player only)
                if (!this.isMultiplayer) {
                    this.startOpponentAI();
                }
            }
        }, 1000);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Mouse movement for crosshair - always track mouse when crosshair is visible
        document.addEventListener('mousemove', (event) => {
            if (!this.crosshair || this.crosshair.style.display === 'none') return;

            this.crosshair.style.left = event.clientX + 'px';
            this.crosshair.style.top = event.clientY + 'px';
        });

        // Mouse click for shooting or draw button
        document.addEventListener('click', (event) => {
            console.log('Click detected. Game state:', this.gameState, 'Mouse enabled:', this.mouseEnabled);

            // Check for jumping the gun (shooting before bell rings)
            if ((this.gameState === 'countdown' || this.gameState === 'waiting') && !event.target.closest('.draw-button')) {
                console.log('Player shot before the bell!');
                this.jumpTheGun('Shot before the bell rang!');
                return;
            }

            // Check if player hasn't drawn their gun yet
            if (this.gameState === 'ready' && !this.playerHasDrawn && !event.target.closest('.draw-button')) {
                console.log('Player tried to shoot without drawing!');
                // Don't end game, just ignore the shot - they need to draw first
                const instructionsDisplay = document.getElementById('game-instructions');
                if (instructionsDisplay) {
                    instructionsDisplay.innerHTML = '<p style="color: #ffaa00; font-size: 1rem;">Draw your gun first!</p><p>Click your draw button before shooting!</p>';
                }
                return;
            }

            // Normal shooting phase - must have drawn gun first
            if (this.mouseEnabled && this.gameState === 'ready' && this.playerHasDrawn) {
                this.playerShoot(event.clientX, event.clientY);
            }
        });

        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        console.log('Event listeners set up');
    }

    playerShoot(x, y) {
        console.log('Player shoots!');

        // Animate player shooting
        const playerElement = document.getElementById('pixel-player');
        if (playerElement) {
            this.animateCharacterShoot(playerElement, this.selectedCharacter);
        }

        // Simple hit detection - check if click is on opponent area
        const opponent = document.getElementById('pixel-opponent');
        if (!opponent) return;

        const rect = opponent.getBoundingClientRect();
        const hit = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

        // Notify multiplayer manager of shot
        if (this.isMultiplayer && this.multiplayerManager) {
            console.log('🔫 MULTIPLAYER: Sending shot to Firebase...', { x, y, hit });

            // In multiplayer, we need to translate coordinates if player is on right
            let adjustedX = x;
            let adjustedY = y;

            // If this player is on the right side, we need to flip the shot coordinates
            // so the other player sees the shot coming from the correct direction
            if (!this.isPlayerOnLeft) {
                const gameArena = document.getElementById('game-arena');
                if (gameArena) {
                    adjustedX = gameArena.clientWidth - x;
                }
            }

            this.multiplayerManager.playerShoot(adjustedX, adjustedY, hit);
        } else {
            console.log('⚠️ Not multiplayer mode - shot not sent to Firebase');
        }

        if (hit) {
            // Check for kill shot (upper portion of character)
            const hitY = y - rect.top;
            const characterHeight = rect.height;
            const isKillShot = hitY < characterHeight * 0.6; // Head/chest area

            const damage = isKillShot ? 100 : 25;

            if (this.isMultiplayer) {
                // In multiplayer, don't update local health - let Firebase handle it
                console.log(`Multiplayer hit! Damage: ${damage}, Kill shot: ${isKillShot}`);

                // Update opponent's health via Firebase
                this.multiplayerManager.getOtherPlayers().then(otherPlayers => {
                    if (otherPlayers.length > 0) {
                        const newHealth = Math.max(0, otherPlayers[0].health - damage);
                        this.multiplayerManager.updateHealth(otherPlayers[0].playerId, newHealth);

                        if (newHealth <= 0) {
                            console.log('MULTIPLAYER KILL SHOT! Opponent defeated!');
                        }
                    }
                });
            } else {
                // Single player mode - update local opponent health
                this.opponentHealth = Math.max(0, this.opponentHealth - damage);
                this.updateHealthBar('opponent', this.opponentHealth);

                // Flash opponent character red when hit and add blood splatter
                const opponentSprite = document.querySelector('#pixel-opponent .character-sprite');
                if (opponentSprite) {
                    opponentSprite.style.filter = 'hue-rotate(0deg) brightness(150%) sepia(100%)';
                    setTimeout(() => {
                        opponentSprite.style.filter = '';
                    }, 200);
                }

                // Add blood splatter effect
                this.createBloodSplatter(document.getElementById('pixel-opponent'), isKillShot);

                if (isKillShot || this.opponentHealth <= 0) {
                    console.log('KILL SHOT! Opponent defeated!');
                    // Show opponent death animation
                    const opponentElement = document.getElementById('pixel-opponent');
                    if (opponentElement) {
                        this.setCharacterImage(opponentElement, this.opponentCharacter, 'dead');
                        const opponentSprite = opponentElement.querySelector('.character-sprite');
                        if (opponentSprite) {
                            opponentSprite.style.filter = 'grayscale(50%) brightness(80%)';
                        }
                    }
                    this.endGame('player');
                    return;
                } else {
                    console.log('Body shot - opponent damaged');
                }
            }
        } else {
            console.log('Player missed!');
        }

        this.gameState = 'shooting';
        this.mouseEnabled = false;
        this.crosshair.style.display = 'none';

        // Check if opponent is still alive to continue
        if (this.opponentHealth > 0) {
            setTimeout(() => {
                if (this.gameState === 'shooting' && this.opponentHealth > 0 && this.playerHealth > 0) {
                    console.log('Continuing duel after player shot...');
                    // Continue the duel
                    this.gameState = 'ready';
                    this.mouseEnabled = true;
                    this.crosshair.style.display = 'block';

                    // Restart opponent AI for next round (single player only)
                    if (!this.isMultiplayer) {
                        this.startOpponentAI();
                    }
                }
            }, 1000);
        }
    }

    updateHealthBar(player, health) {
        const healthBar = document.getElementById(`${player}-health`);
        if (healthBar) {
            healthBar.style.width = health + '%';

            if (health <= 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            } else if (health <= 50) {
                healthBar.style.background = 'linear-gradient(90deg, #ffaa00, #ffdd00)';
            }
        }
    }

    endGame(winner) {
        this.gameState = 'finished';
        this.mouseEnabled = false;
        this.crosshair.style.display = 'none';
        document.body.style.cursor = 'default';

        // Hide draw button when game ends
        this.forceHideDrawButtons();

        const instructionsDisplay = document.getElementById('game-instructions');

        if (winner === 'player') {
            instructionsDisplay.innerHTML = '<p style="color: #00ff00; font-size: 1.5rem;">VICTORY!</p><p>You\'re the fastest gun in Tombstone!</p>';

            // Player victory taunt
            const victoryTaunt = this.getCharacterDialogue(this.selectedCharacter, 'victory');
            if (victoryTaunt) {
                this.showSpeechBubble(this.selectedCharacter, victoryTaunt, 5000);
            }

            // Opponent death line
            const deathTaunt = this.getCharacterDialogue(this.opponentCharacter, 'death');
            if (deathTaunt) {
                setTimeout(() => {
                    this.showSpeechBubble(this.opponentCharacter, deathTaunt, 4000);
                }, 1000);
            }
        } else {
            instructionsDisplay.innerHTML = '<p style="color: #ff0000; font-size: 1.5rem;">DEFEATED!</p><p>Better luck next time, partner...</p>';

            // Opponent victory taunt
            const victoryTaunt = this.getCharacterDialogue(this.opponentCharacter, 'victory');
            if (victoryTaunt) {
                this.showSpeechBubble(this.opponentCharacter, victoryTaunt, 5000);
            }

            // Player death line
            const deathTaunt = this.getCharacterDialogue(this.selectedCharacter, 'death');
            if (deathTaunt) {
                setTimeout(() => {
                    this.showSpeechBubble(this.selectedCharacter, deathTaunt, 4000);
                }, 800);
            }

            // Death animation for player - show death image
            const playerElement = document.getElementById('pixel-player');
            if (playerElement) {
                this.setCharacterImage(playerElement, this.selectedCharacter, 'dead');
                const playerSprite = playerElement.querySelector('.character-sprite');
                if (playerSprite) {
                    playerSprite.style.filter = 'grayscale(50%) brightness(80%)';
                }
            }
        }

        // Show back button
        document.querySelector('.game-back-btn').style.display = 'block';
    }

    // Force hide draw buttons (used in cleanup scenarios)
    forceHideDrawButtons() {
        const playerDrawBtn = document.getElementById('player-draw-btn');
        if (playerDrawBtn) playerDrawBtn.style.display = 'none';
    }

    selectOpponentCharacter() {
        const allCharacters = ['wyatt', 'doc', 'johnny', 'curly'];
        const availableCharacters = allCharacters.filter(char => char !== this.selectedCharacter);
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        return availableCharacters[randomIndex];
    }

    updateOpponentCharacter() {
        // Update opponent character when player character changes
        this.opponentCharacter = this.selectOpponentCharacter();
        console.log(`Player: ${this.selectedCharacter}, Opponent: ${this.opponentCharacter}`);
    }

    getCharacterStats(character) {
        const stats = {
            wyatt: { speed: 85, accuracy: 90 },
            doc: { speed: 95, accuracy: 80 },
            johnny: { speed: 88, accuracy: 85 },
            curly: { speed: 65, accuracy: 95 }  // Slowest but deadliest accurate
        };
        return stats[character] || stats.wyatt;
    }

    // Method to set opponent character for multiplayer
    setOpponentCharacter(character) {
        this.opponentCharacter = character;
        this.updateCharacterSprites();
    }

    // Method to handle multiplayer countdown start
    startMultiplayerCountdown() {
        if (this.isMultiplayer && this.multiplayerManager && this.multiplayerManager.isHost) {
            this.multiplayerManager.startCountdown();
        } else if (!this.isMultiplayer) {
            this.startCountdown();
        }
    }

    // Setup multiplayer positioning - each player sees themselves on left, opponent on right
    setupMultiplayerPositioning() {
        console.log(`Setting up multiplayer positioning. Player on left: ${this.isPlayerOnLeft}`);

        // Get character elements
        const playerElement = document.getElementById('pixel-player');
        const opponentElement = document.getElementById('pixel-opponent');

        if (!playerElement || !opponentElement) {
            console.error('Could not find player/opponent elements');
            return;
        }

        // In multiplayer, EVERY player sees themselves on the left
        // and their opponent on the right (just like single player)
        if (this.isPlayerOnLeft) {
            // First player: show their character on left, opponent on right
            playerElement.setAttribute('data-character', this.selectedCharacter);
            opponentElement.setAttribute('data-character', this.opponentCharacter);
        } else {
            // Second player: show their character on left, opponent on right
            // We swap the visual representation so they see themselves on left
            playerElement.setAttribute('data-character', this.selectedCharacter);
            opponentElement.setAttribute('data-character', this.opponentCharacter);
        }

        // Update character sprites
        this.updateCharacterSprites();

        // Update health bar labels
        const playerHealthLabel = document.querySelector('.player-health .health-label');
        const opponentHealthLabel = document.querySelector('.opponent-health .health-label');

        if (playerHealthLabel) playerHealthLabel.textContent = 'YOU';
        if (opponentHealthLabel) opponentHealthLabel.textContent = 'OPPONENT';

        console.log('Multiplayer positioning setup complete');
    }

    // Handle multiplayer events from other players
    handleOpponentAction(action, data) {
        console.log('Opponent action received:', action, data);

        switch (action) {
            case 'draw':
                this.opponentHasDrawn = true;
                // Visual feedback that opponent has drawn
                const instructionsDisplay = document.getElementById('game-instructions');
                if (instructionsDisplay && !this.playerHasDrawn) {
                    instructionsDisplay.innerHTML = '<p style="color: #ff6b6b;">Opponent has drawn! Quick, draw your gun!</p>';
                }
                break;

            case 'shoot':
                // Handle opponent's shot visually
                this.handleOpponentShot(data.x, data.y, data.hit);
                break;
        }
    }

    // Visual representation of opponent's shot
    handleOpponentShot(x, y, hit) {
        console.log('Opponent shot received:', { x, y, hit });

        // Create bullet effect from opponent's side
        this.createBullet(false); // false = from opponent

        if (hit) {
            console.log('Opponent hit me! Taking damage...');
            // If opponent hit this player, show damage
            const damage = hit.damage || 25;
            this.playerHealth = Math.max(0, this.playerHealth - damage);
            this.updateHealthBar('player', this.playerHealth);

            // Flash player character red when hit and add blood splatter
            const playerSprite = document.querySelector('#pixel-player .character-sprite');
            if (playerSprite) {
                playerSprite.style.filter = 'hue-rotate(0deg) brightness(150%) sepia(100%)';
                setTimeout(() => {
                    playerSprite.style.filter = '';
                }, 200);
            }

            // Add blood splatter effect
            const isKillShot = hit.damage >= 100;
            this.createBloodSplatter(document.getElementById('pixel-player'), isKillShot);

            // Update my own health in Firebase
            if (this.isMultiplayer && this.multiplayerManager) {
                this.multiplayerManager.updateHealth(this.multiplayerManager.playerId, this.playerHealth);
            }

            if (this.playerHealth <= 0) {
                console.log('I was defeated in multiplayer!');
                // Show player death animation
                const playerElement = document.getElementById('pixel-player');
                if (playerElement) {
                    this.setCharacterImage(playerElement, this.selectedCharacter, 'dead');
                    const playerSprite = playerElement.querySelector('.character-sprite');
                    if (playerSprite) {
                        playerSprite.style.filter = 'grayscale(50%) brightness(80%)';
                    }
                }
                // The game end will be handled by Firebase state update
            }
        } else {
            console.log('Opponent missed me!');
        }
    }

    cleanup() {
        // Cleanup when leaving game
        console.log('Cleaning up game...');

        this.mouseEnabled = false;
        this.gameState = 'finished';

        // Reset drawing states
        this.playerHasDrawn = false;
        this.opponentHasDrawn = false;

        // Clear any intervals and timeouts
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        if (this.opponentAITimeout) {
            clearTimeout(this.opponentAITimeout);
            this.opponentAITimeout = null;
        }

        // Force hide draw buttons completely during cleanup
        this.forceHideDrawButtons();

        // Reset character sprites to normal state
        this.resetCharacterSprites();

        // Restore cursor
        document.body.style.cursor = 'default';
        document.documentElement.style.cursor = 'default';

        // Remove no-cursor class
        const gameArena = document.getElementById('game-arena');
        if (gameArena) {
            gameArena.classList.remove('no-cursor');
        }

        if (this.crosshair) {
            this.crosshair.style.display = 'none';
        }

        console.log('Game cleaned up');
    }

    resetCharacterSprites() {
        // Reset player character
        const playerElement = document.getElementById('pixel-player');
        if (playerElement) {
            const playerSprite = playerElement.querySelector('.character-sprite');
            const playerImage = playerElement.querySelector('.character-image');
            if (playerSprite) {
                playerSprite.style.transform = '';
                playerSprite.style.filter = '';
            }
            if (playerImage) {
                // Reset any flipping on the image itself
                playerImage.style.transform = '';
            }
            this.setCharacterImage(playerElement, this.selectedCharacter, 'idle');
            playerElement.setAttribute('data-state', 'idle');
        }

        // Reset opponent character
        const opponentElement = document.getElementById('pixel-opponent');
        if (opponentElement) {
            const opponentSprite = opponentElement.querySelector('.character-sprite');
            const opponentImage = opponentElement.querySelector('.character-image');
            if (opponentSprite) {
                opponentSprite.style.transform = '';
                opponentSprite.style.filter = '';
            }
            if (opponentImage) {
                // Reset opponent image flipping to face left (default for opponent)
                opponentImage.style.transform = 'scaleX(-1)';
            }
            this.setCharacterImage(opponentElement, this.opponentCharacter, 'idle');
            opponentElement.setAttribute('data-state', 'idle');
        }

        // Reset draw button
        const playerDrawBtn = document.getElementById('player-draw-btn');
        if (playerDrawBtn) {
            playerDrawBtn.classList.remove('disabled');
            playerDrawBtn.style.opacity = '1';
            playerDrawBtn.style.pointerEvents = 'auto';
            playerDrawBtn.style.display = 'block'; // Ensure it's visible
            if (playerDrawBtn.querySelector('span')) {
                playerDrawBtn.querySelector('span').textContent = 'DRAW!';
            }
        }
    }

    jumpTheGun(reason = 'Jumped the gun!') {
        console.log('Player jumped the gun - instant loss!');
        this.gameState = 'finished';
        this.mouseEnabled = false;

        // Clear any intervals and timeouts
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.opponentAITimeout) {
            clearTimeout(this.opponentAITimeout);
            this.opponentAITimeout = null;
        }

        // Hide crosshair
        if (this.crosshair) {
            this.crosshair.style.display = 'none';
        }

        // Hide draw buttons completely when game ends
        const playerDrawBtn = document.getElementById('player-draw-btn');
        if (playerDrawBtn) playerDrawBtn.style.display = 'none';

        // Show penalty message
        const instructionsDisplay = document.getElementById('game-instructions');
        if (instructionsDisplay) {
            instructionsDisplay.innerHTML = `<p style="color: #ff0000; font-size: 1.5rem;">JUMPED THE GUN!</p><p>${reason}</p><p style="color: #ffaa00;">Wait for the proper time next time, partner...</p>`;
        }

        // Hide countdown display
        const countdownDisplay = document.getElementById('countdown-display');
        if (countdownDisplay) countdownDisplay.style.display = 'none';

        // Show player death animation for jumping the gun
        const playerElement = document.getElementById('pixel-player');
        if (playerElement) {
            this.setCharacterImage(playerElement, this.selectedCharacter, 'dead');
            const playerSprite = playerElement.querySelector('.character-sprite');
            if (playerSprite) {
                playerSprite.style.filter = 'grayscale(50%) brightness(80%)';
            }
        }

        // Restore cursor and show back button
        document.body.style.cursor = 'default';
        document.querySelector('.game-back-btn').style.display = 'block';
    }

    showDrawButtons() {
        const playerDrawBtn = document.getElementById('player-draw-btn');

        if (playerDrawBtn) {
            playerDrawBtn.style.display = 'block';
            playerDrawBtn.onclick = () => this.playerDraw();
        }
    }

    hideDrawButtons() {
        // This method is now mainly for compatibility
        // We don't actually hide the draw button anymore, just disable it
        const playerDrawBtn = document.getElementById('player-draw-btn');

        if (playerDrawBtn && this.playerHasDrawn) {
            // Keep button visible but show as disabled
            playerDrawBtn.classList.add('disabled');
            playerDrawBtn.style.opacity = '0.5';
            playerDrawBtn.style.pointerEvents = 'none';
            if (playerDrawBtn.querySelector('span')) {
                playerDrawBtn.querySelector('span').textContent = 'DRAWN';
            }
        }
    }

    playerDraw() {
        // Check if player is drawing before the bell (during countdown)
        if (this.gameState === 'countdown' || this.gameState === 'waiting') {
            console.log('Player drew before the bell!');
            this.jumpTheGun('Drew before the bell rang!');
            return;
        }

        // Allow drawing if game is ready OR if game just transitioned to ready
        if ((this.gameState !== 'ready' && this.gameState !== 'drawing') || this.playerHasDrawn) {
            console.log('Cannot draw right now, state:', this.gameState, 'already drawn:', this.playerHasDrawn);
            return;
        }

        console.log('Player draws gun!');
        this.playerHasDrawn = true;

        // Notify multiplayer manager of draw
        if (this.isMultiplayer && this.multiplayerManager) {
            console.log('🎯 MULTIPLAYER: Sending draw action to Firebase...');
            this.multiplayerManager.playerDraw();
        } else {
            console.log('⚠️ Not multiplayer mode - draw not sent to Firebase');
        }

        // Update player draw button to show drawn state
        const playerDrawBtn = document.getElementById('player-draw-btn');
        if (playerDrawBtn) {
            playerDrawBtn.classList.add('disabled');
            playerDrawBtn.style.opacity = '0.5';
            playerDrawBtn.querySelector('span').textContent = 'DRAWN';
            playerDrawBtn.style.pointerEvents = 'none'; // Prevent further clicks
        }

        // Enable crosshair immediately for faster gameplay
        if (this.crosshair) {
            this.crosshair.style.display = 'block';
        }

        // Animate player drawing
        const playerElement = document.getElementById('pixel-player');
        if (playerElement) {
            this.setCharacterImage(playerElement, this.selectedCharacter, 'drawing');
            // Hold draw pose longer before returning to idle
            setTimeout(() => {
                this.setCharacterImage(playerElement, this.selectedCharacter, 'idle');
            }, 1000); // Hold draw pose for 1000ms (increased from 500ms)
        }

        console.log('Player has successfully drawn gun, can now shoot - crosshair enabled!');

        // Player taunt when drawing
        const drawTaunt = this.getCharacterDialogue(this.selectedCharacter, 'draw');
        if (drawTaunt) {
            this.showSpeechBubble(this.selectedCharacter, drawTaunt, 2500);
        }
    }

    startOpponentDrawAI() {
        // Opponent draws based on character speed stat
        const characterStats = this.getCharacterStats(this.opponentCharacter);

        // Slower draw speeds - made 15% easier
        const baseDrawDelay = 1800 - (characterStats.speed * 10); // Reduced from 1500 and lower multiplier

        // More variation - less consistency
        const speedConsistency = characterStats.speed > 85 ? 250 : 500; // Increased variation
        const randomVariation = Math.random() * speedConsistency;

        const drawDelay = Math.max(500, baseDrawDelay + randomVariation); // Minimum 500ms delay (was 300ms)

        console.log(`⚡ ${this.opponentCharacter} LIGHTNING DRAW in ${drawDelay}ms (speed: ${characterStats.speed})`);

        setTimeout(() => {
            if (this.gameState === 'ready') {
                this.opponentDraw();
            }
        }, drawDelay);
    }

    opponentDraw() {
        if (this.gameState !== 'ready' || this.opponentHasDrawn) return;

        console.log('Opponent draws gun!');
        this.opponentHasDrawn = true;

        // Animate opponent drawing
        const opponentElement = document.getElementById('pixel-opponent');
        if (opponentElement) {
            this.setCharacterImage(opponentElement, this.opponentCharacter, 'drawing');
            // Hold draw pose longer before returning to idle
            setTimeout(() => {
                this.setCharacterImage(opponentElement, this.opponentCharacter, 'idle');
            }, 1000); // Hold draw pose for 1000ms (increased from 500ms)
        }

        // Update instructions to show opponent has drawn
        const instructionsDisplay = document.getElementById('game-instructions');
        if (instructionsDisplay) {
            instructionsDisplay.innerHTML = '<p style="color: #ff6600; font-size: 1.2rem;">OPPONENT DREW!</p><p>Draw your gun and shoot!</p>';
        }

        // Opponent taunt when drawing
        const drawTaunt = this.getCharacterDialogue(this.opponentCharacter, 'draw');
        if (drawTaunt) {
            this.showSpeechBubble(this.opponentCharacter, drawTaunt, 2500);
        }
    }

    checkBothPlayersDrawn() {
        // No longer needed - players can shoot immediately after countdown
        // This method is kept for compatibility but does nothing
    }

    startShootingPhase() {
        // No longer needed - shooting starts immediately after countdown
        // This method is kept for compatibility but does nothing
    }

    initializeAudio() {
        // Create audio elements for sound effects
        this.audio = {
            gunshot: this.createAudio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmERCSuS0fPNeSUDKHPC8d6NSxIQW7Xt5KdPEAhMpdX0wHIDCSWC0fLPeyICKHPF8t6TSx4NWbTs4qZKFAtCk93zvmEQCCaI0vHFdBwFpXfJ8N+QSAoTWrPr4qBJEwk8jdv0w3YlBCOAzfLZiTQIEWm98N6GQQYMUKnq7rJPEwhMou3xwXAdBTdlzzW4PBMn3/LlRtAzVJVjzQR5PQ8t3fHNe0sVC8ZxMQVJJVqn4PKRSAcbT5jq6bFeDAkfcOWr3YYOBzjVdB/7TigSVK/n7qtWFAo9lvj9m3VcVKjr8ZPqjCYhb6vJfzAQLJ7fNWNAOFKDhYTKzPL0vL+Jb1F2KWzb57v1jkfYrXAWJRvItWf1ikcVjK5VKs5uxfRKPZFjRjZGKrjIb0MBQBG1lJ+2jEKTBQAABAAABIACAABhYqFbF1fdJivpJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmERCSuS0fPNeSUDKHPC8d6NSxIQW7Xt5KdPEAhMpdX0wHIDCSWC0fLPeyICKHPF8t6TSx4NWbTs4qZKFAtCk93zvmEQCCaI0vHFdBwFpXfJ8N+QSAoTWrPr4qBJEwk8jdv0w3YlBCOAzfLZiTQIEWm98N6GQQYMUKnq7rJPEwhMou3xwXAdBTdlzzW4PBMn3/LlRtAzVJVjzQR5PQ8t3fHNe0sVC8ZxMQVJJVqn4PKRSAcbT5jq6bFeDAkfcOWr3YYOBzjVdB/7TigSVK/n7qtWFAo9lvj9m3VcVKjr8ZPqjCYhb6vJfzAQLJ7fNWNAOFKDhYTKzPL0vL+Jb1F2KWzb57v1jkfYrXAWJRvItWf1ikcVjK5VKs5uxfRKPZFjRjZGKrjIb0MBQBG1lJ+2jEKTBQAABAAABIAA'),
            bell: this.createTowerBell()
        };
        console.log('Audio initialized with clock tower bell');
    }

    createTowerBell() {
        // Create a more authentic clock tower bell sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create a bell-like tone with multiple harmonics for a rich sound
        const createBellTone = () => {
            const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < data.length; i++) {
                const t = i / audioContext.sampleRate;

                // Fundamental frequency (deep bell tone around 200Hz)
                let sample = Math.sin(2 * Math.PI * 200 * t) * 0.3;

                // Add harmonics for bell-like quality
                sample += Math.sin(2 * Math.PI * 400 * t) * 0.2;   // 2nd harmonic
                sample += Math.sin(2 * Math.PI * 600 * t) * 0.15;  // 3rd harmonic
                sample += Math.sin(2 * Math.PI * 800 * t) * 0.1;   // 4th harmonic
                sample += Math.sin(2 * Math.PI * 1000 * t) * 0.05; // 5th harmonic

                // Apply exponential decay envelope for bell resonance
                const envelope = Math.exp(-t * 1.5);
                data[i] = sample * envelope;
            }

            return buffer;
        };

        // Return a function that plays the bell
        return {
            play: () => {
                try {
                    const source = audioContext.createBufferSource();
                    const gainNode = audioContext.createGain();

                    source.buffer = createBellTone();
                    gainNode.gain.value = 0.4; // Volume control

                    source.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    source.start(0);
                } catch (error) {
                    console.log('Bell audio failed:', error);
                }
            },
            currentTime: 0, // For compatibility
            volume: 0.4
        };
    }

    createAudio(dataUri) {
        const audio = new Audio(dataUri);
        audio.volume = 0.3; // Set volume to 30%
        return audio;
    }

    playSound(soundName) {
        if (this.audio && this.audio[soundName]) {
            if (soundName === 'bell' && this.audio[soundName].play) {
                // Custom bell sound
                this.audio[soundName].play();
            } else {
                // Regular audio elements
                this.audio[soundName].currentTime = 0;
                this.audio[soundName].play().catch(error => {
                    console.log('Audio play failed:', error);
                });
            }
        }
    }
}

// Bounce animation CSS removed - no longer needed

// Make the class available globally
window.PixelTombstoneGame = PixelTombstoneGame;