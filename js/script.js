class TombstoneGame {
    constructor() {
        this.currentPage = 'landing-page';
        this.selectedGameMode = null;
        this.selectedCharacter = null;
        this.multiplayerManager = null;
        this.currentGameData = null;
        this.isWaitingForOpponent = false;

        this.initializeEventListeners();
        this.createDynamicAnimations();
    }

    initializeEventListeners() {
        // Game mode selection
        document.getElementById('multiplayer-btn').addEventListener('click', () => {
            console.log('Multiplayer button clicked');
            this.selectedGameMode = 'multiplayer';
            this.startMultiplayerMatchmaking();
        });

        document.getElementById('vs-ai-btn').addEventListener('click', () => {
            this.selectedGameMode = 'vs-ai';
            this.showPage('character-select');
        });

        // Character selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                this.selectCharacter(e.currentTarget);
            });
        });

        // Navigation buttons
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.showPage('landing-page');
        });

        document.getElementById('back-to-characters').addEventListener('click', () => {
            // Cleanup pixel game if running
            if (this.pixelGame) {
                this.pixelGame.cleanup();
                this.pixelGame = null;
            }
            // Cleanup multiplayer if active
            if (this.multiplayerManager) {
                this.multiplayerManager.leaveGame();
            }
            // Reset character selection styling
            this.resetCharacterSelection();

            // Go back to appropriate page based on game mode
            if (this.selectedGameMode === 'multiplayer') {
                this.showPage('landing-page');
                this.selectedGameMode = null;
            } else {
                this.showPage('character-select');
            }
        });

        // Cancel matchmaking button
        document.getElementById('cancel-matchmaking').addEventListener('click', () => {
            this.cancelMatchmaking();
        });

        // Add hover sound effects (placeholder)
        document.querySelectorAll('.western-btn, .character-card').forEach(element => {
            element.addEventListener('mouseenter', () => {
                // Add subtle hover effect
                element.style.transition = 'all 0.2s ease';
            });
        });
    }

    showPage(pageId) {
        console.log(`Showing page: ${pageId} (from ${this.currentPage})`);

        // Hide current page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show new page with animation
        setTimeout(() => {
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                this.currentPage = pageId;
                console.log(`Page ${pageId} is now active`);
            } else {
                console.error(`Page element with ID '${pageId}' not found`);
            }
        }, 100);
    }

    selectCharacter(cardElement) {
        // Remove previous selection
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        cardElement.classList.add('selected');
        this.selectedCharacter = cardElement.dataset.character;

        // Add selection styling
        cardElement.style.borderColor = '#ffaa00';
        cardElement.style.boxShadow = '0 0 20px rgba(255, 170, 0, 0.5)';

        // Handle multiplayer character selection
        if (this.selectedGameMode === 'multiplayer' && this.multiplayerManager) {
            console.log('Multiplayer: Player selected character, updating Firebase...');
            this.multiplayerManager.updatePlayerData({
                character: this.selectedCharacter,
                ready: true
            });

            // In multiplayer, don't auto-start game - wait for multiplayer manager
            // The onMultiplayerUpdate will handle game start when both players are ready
            console.log('Waiting for opponent to select character...');
            return;
        }

        // Auto-advance to game after selection (single player mode only)
        setTimeout(() => {
            this.startGame();
        }, 1000);
    }

    startGame() {
        console.log(`Starting ${this.selectedGameMode} game with ${this.selectedCharacter}`);

        // Show the 2D pixel game arena
        this.showPage('game-arena');

        // Initialize the 2D pixel game
        setTimeout(() => {
            console.log('Attempting to start pixel game...');
            console.log('PixelTombstoneGame available:', !!window.PixelTombstoneGame);

            if (window.PixelTombstoneGame) {
                console.log('Creating new PixelTombstoneGame instance');
                this.pixelGame = new PixelTombstoneGame({
                    selectedCharacter: this.selectedCharacter,
                    isMultiplayer: false
                });
                console.log('Pixel game created with character:', this.selectedCharacter);
            } else {
                console.error('PixelTombstoneGame class not found!');
            }
        }, 500);
    }

    createDynamicAnimations() {
        // Create floating dust particles
        this.createDustParticles();

        // Add wind sound effect simulation (visual)
        this.simulateWind();

        // Add random tumbleweed (placeholder)
        this.addTumbleweed();
    }

    createDustParticles() {
        const dustContainer = document.querySelector('.dust-particles');

        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                const particle = document.createElement('div');
                particle.className = 'dust-particle';
                particle.style.cssText = `
                    position: absolute;
                    width: 2px;
                    height: 2px;
                    background: rgba(212, 165, 116, 0.4);
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    top: ${60 + Math.random() * 30}%;
                    animation: dustFloat 6s linear forwards;
                    pointer-events: none;
                `;

                dustContainer.appendChild(particle);

                // Remove particle after animation
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 6000);
            }
        }, 2000);
    }

    simulateWind() {
        const townSilhouette = document.querySelector('.town-silhouette');

        setInterval(() => {
            townSilhouette.style.filter = `hue-rotate(${Math.sin(Date.now() * 0.001) * 5}deg)`;
        }, 100);
    }

    addTumbleweed() {
        // Add a simple tumbleweed animation every 15-30 seconds
        const addTumbleweedAnimation = () => {
            const tumbleweed = document.createElement('div');
            tumbleweed.className = 'tumbleweed';
            tumbleweed.style.cssText = `
                position: absolute;
                bottom: 25%;
                left: -50px;
                width: 30px;
                height: 30px;
                background: radial-gradient(circle, #8b4513 30%, transparent 30%);
                border-radius: 50%;
                animation: tumble 12s linear forwards;
                pointer-events: none;
                z-index: 5;
            `;

            // Add tumble keyframes if not already added
            if (!document.querySelector('#tumble-keyframes')) {
                const style = document.createElement('style');
                style.id = 'tumble-keyframes';
                style.textContent = `
                    @keyframes tumble {
                        0% {
                            left: -50px;
                            transform: rotate(0deg);
                        }
                        100% {
                            left: calc(100vw + 50px);
                            transform: rotate(720deg);
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.querySelector('.background').appendChild(tumbleweed);

            // Remove after animation
            setTimeout(() => {
                if (tumbleweed.parentNode) {
                    tumbleweed.parentNode.removeChild(tumbleweed);
                }
            }, 12000);

            // Schedule next tumbleweed
            setTimeout(addTumbleweedAnimation, 15000 + Math.random() * 15000);
        };

        // Start first tumbleweed after 5 seconds
        setTimeout(addTumbleweedAnimation, 5000);
    }

    // Game state management
    getGameState() {
        return {
            currentPage: this.currentPage,
            selectedGameMode: this.selectedGameMode,
            selectedCharacter: this.selectedCharacter
        };
    }

    // Character stats (for future game mechanics)
    getCharacterStats(character) {
        const stats = {
            wyatt: { speed: 85, accuracy: 90, special: 'Lawman\'s Focus' },
            doc: { speed: 95, accuracy: 80, special: 'Lightning Draw' },
            johnny: { speed: 88, accuracy: 85, special: 'Educated Guess' },
            curly: { speed: 65, accuracy: 95, special: 'Dead Eye Shot' }
        };

        return stats[character] || stats.wyatt;
    }

    resetCharacterSelection() {
        // Reset all character cards to unselected state
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
            card.style.borderColor = '';
            card.style.boxShadow = '';
        });
        this.selectedCharacter = null;
    }

    // Multiplayer Methods
    async startMultiplayerMatchmaking() {
        console.log('Starting multiplayer matchmaking...');

        // Initialize multiplayer manager if not already done
        if (!this.multiplayerManager) {
            if (typeof MultiplayerManager !== 'undefined') {
                this.multiplayerManager = new MultiplayerManager();
            } else {
                console.error('MultiplayerManager class not found! Make sure multiplayer.js is loaded.');
                this.showErrorAndReturnToMenu('Multiplayer not available. Please refresh the page.');
                return;
            }
        }

        // Show waiting room
        this.showPage('waiting-room');
        this.isWaitingForOpponent = true;

        // Update queue count periodically
        this.updateQueueCount();
        const queueInterval = setInterval(async () => {
            if (!this.isWaitingForOpponent) {
                clearInterval(queueInterval);
                return;
            }
            await this.updateQueueCount();
        }, 2000);

        try {
            // Find a match
            console.log('About to call findMatch...');
            const matchResult = await this.multiplayerManager.findMatch();
            console.log('FindMatch returned:', matchResult);

            if (matchResult && matchResult.success) {
                console.log('Match found!', matchResult);
                this.isWaitingForOpponent = false;

                // Store game data
                this.currentGameData = matchResult;

                // If we have an opponent immediately, go to character select
                if (matchResult.opponent) {
                    console.log('Opponent found, going to character select');
                    this.showPage('character-select');
                } else {
                    // Wait for opponent to join
                    console.log('Waiting for opponent to join');
                    this.waitingForOpponentToJoin();
                }
            } else {
                console.error('Matchmaking failed:', matchResult);
                this.showErrorAndReturnToMenu('Failed to find match. Please try again.');
            }
        } catch (error) {
            console.error('Matchmaking error:', error);
            this.showErrorAndReturnToMenu('Connection error. Please try again.');
        }
    }

    async updateQueueCount() {
        if (this.multiplayerManager) {
            const count = await this.multiplayerManager.getQueueCount();
            const queueCountElement = document.getElementById('queue-count');
            if (queueCountElement) {
                queueCountElement.textContent = count;
            }
        }
    }

    waitingForOpponentToJoin() {
        // This method will be called when we're host and waiting for someone to join
        // The onMultiplayerUpdate method will handle when they actually join
        const waitingText = document.querySelector('.waiting-text');
        if (waitingText) {
            waitingText.textContent = 'Waiting for opponent to join...';
        }
    }

    cancelMatchmaking() {
        console.log('Cancelling matchmaking...');
        this.isWaitingForOpponent = false;

        if (this.multiplayerManager) {
            this.multiplayerManager.leaveGame();
        }

        this.showPage('landing-page');
        this.selectedGameMode = null;
    }

    // Called by MultiplayerManager when game state updates
    onMultiplayerUpdate(gameData) {
        console.log('Multiplayer update received:', gameData);
        this.currentGameData = gameData;

        const players = Object.values(gameData.players || {});
        const otherPlayers = players.filter(p => p.playerId !== this.multiplayerManager.playerId);

        // Handle different game states
        switch (gameData.gameState) {
            case 'waiting_for_players':
                if (otherPlayers.length > 0 && this.currentPage === 'waiting-room') {
                    // Opponent joined, go to character select
                    this.showPage('character-select');
                }

                // Check if both players have selected characters
                if (otherPlayers.length > 0 && this.currentPage === 'character-select') {
                    const allPlayersReady = players.every(p => p.character && p.ready);
                    if (allPlayersReady) {
                        console.log('Both players have selected characters! Starting game...');
                        // Host should start the countdown
                        if (this.multiplayerManager.isHost) {
                            this.multiplayerManager.startCountdown();
                        }
                    }
                }
                break;

            case 'countdown':
                // Both players ready, start countdown
                if (this.currentPage !== 'game-arena') {
                    console.log('Starting multiplayer game arena...');
                    this.showPage('game-arena');
                    setTimeout(() => {
                        this.initializeMultiplayerGame(gameData);
                    }, 500);
                }
                break;

            case 'finished':
                this.handleGameEnd(gameData);
                break;
        }

        // Update UI with opponent info
        this.updateOpponentDisplay(otherPlayers[0]);
    }

    updateOpponentDisplay(opponent) {
        if (!opponent) return;

        // Update opponent character in game if needed
        if (this.pixelGame && this.pixelGame.setOpponentCharacter) {
            this.pixelGame.setOpponentCharacter(opponent.character);
        }
    }

    initializeMultiplayerGame(gameData) {
        console.log('Initializing multiplayer game...');

        // Initialize the pixel game with multiplayer options
        if (window.PixelTombstoneGame) {
            // Determine player position based on join order
            const players = Object.values(gameData.players || {});
            const sortedPlayers = players.sort((a, b) => a.playerId.localeCompare(b.playerId));
            const myPlayerIndex = sortedPlayers.findIndex(p => p.playerId === this.multiplayerManager.playerId);
            const isPlayerOnLeft = myPlayerIndex === 0;

            // Find opponent
            const opponent = players.find(p => p.playerId !== this.multiplayerManager.playerId);

            this.pixelGame = new PixelTombstoneGame({
                selectedCharacter: this.selectedCharacter,
                isMultiplayer: true,
                multiplayerManager: this.multiplayerManager,
                isPlayerOnLeft: isPlayerOnLeft,
                opponentCharacter: opponent?.character
            });

            console.log('🎮 MULTIPLAYER: Pixel game initialized with:');
            console.log('  - isMultiplayer:', this.pixelGame.isMultiplayer);
            console.log('  - selectedCharacter:', this.pixelGame.selectedCharacter);
            console.log('  - multiplayerManager:', !!this.pixelGame.multiplayerManager);
            console.log('  - opponentCharacter:', this.pixelGame.opponentCharacter);
            console.log('  - isPlayerOnLeft:', this.pixelGame.isPlayerOnLeft);

            // Setup multiplayer positioning (sprites, health bar labels, etc.)
            this.pixelGame.setupMultiplayerPositioning();

            // Start the countdown
            setTimeout(() => {
                this.pixelGame.startCountdown();
            }, 1000);

            console.log(`Multiplayer pixel game initialized. Player position: ${isPlayerOnLeft ? 'LEFT' : 'RIGHT'}`);
        }
    }

    handleGameEnd(gameData) {
        const isWinner = gameData.winner === this.multiplayerManager.playerId;
        console.log(`Game ended. Winner: ${gameData.winner}, You won: ${isWinner}`);

        // Show victory/defeat message
        setTimeout(() => {
            alert(isWinner ? 'Victory! You are the fastest gun in the west!' : 'Defeat! Better luck next time, partner.');

            // Return to menu
            this.showPage('landing-page');
            this.selectedGameMode = null;
            this.resetCharacterSelection();
        }, 2000);
    }

    showErrorAndReturnToMenu(message) {
        alert(message);
        this.showPage('landing-page');
        this.selectedGameMode = null;
        this.isWaitingForOpponent = false;
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tombstoneGame = new TombstoneGame();

    // Add some atmospheric console messages
    console.log('🤠 Welcome to Tombstone Quick Draw!');
    console.log('💀 "I\'m your huckleberry..."');
});

// Handle browser extension connection errors (common issue)
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('Could not establish connection')) {
        console.log('Ignoring browser extension connection error (not related to game)');
        event.preventDefault();
        return true;
    }
});

// Handle unhandled promise rejections (like extension errors)
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('Could not establish connection')) {
        console.log('Ignoring browser extension connection error (not related to game)');
        event.preventDefault();
        return true;
    }
});

// Add some CSS for character selection
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .character-card.selected {
        transform: translateY(-5px) scale(1.05);
        border-color: #ffaa00 !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 170, 0, 0.5) !important;
    }

    .dust-particle {
        animation: dustFloat 6s linear forwards;
    }
`;
document.head.appendChild(additionalStyles);