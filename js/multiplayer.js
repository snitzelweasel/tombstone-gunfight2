class MultiplayerManager {
    constructor() {
        this.database = null;
        this.currentGameId = null;
        this.playerId = null;
        this.isHost = false;
        this.gameRef = null;
        this.listeners = [];
        this.matchmakingRef = null;

        // Initialize Firebase
        this.initializeFirebase();

        // Generate unique player ID
        this.playerId = this.generatePlayerId();
    }

    initializeFirebase() {
        // Check if Firebase is enabled in config
        if (!window.GameConfig || !window.GameConfig.ENABLE_FIREBASE) {
            console.log('Running in demo mode - Firebase disabled in config');
            this.database = null;
            return;
        }

        const firebaseConfig = window.GameConfig.firebaseConfig;

        // Validate Firebase config
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "your-api-key-here") {
            console.warn('Firebase config not properly set. Running in demo mode.');
            this.database = null;
            return;
        }

        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined') {
                console.log('Firebase SDK not loaded, running in demo mode');
                this.database = null;
                return;
            }

            // Initialize Firebase app
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('Firebase app initialized');
            }

            this.database = firebase.database();
            console.log('🔥 Firebase Realtime Database connected - Real multiplayer enabled!');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            console.log('Falling back to demo mode');
            this.database = null;
        }
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Matchmaking system
    async findMatch() {
        const isRealMultiplayer = !!this.database;
        console.log(`🎮 FindMatch called. Real multiplayer: ${isRealMultiplayer ? 'YES' : 'NO'}`);

        if (!this.database) {
            console.log('📱 Demo mode: Simulating local matchmaking...');
            return this.simulateMatchmaking();
        }

        console.log('🌐 Real Firebase matchmaking starting...');

        try {
            const matchmakingRef = this.database.ref('matchmaking');

            // Look for existing waiting player
            const snapshot = await matchmakingRef.once('value');
            const waitingPlayers = snapshot.val();

            if (waitingPlayers) {
                // Find the first waiting player
                const waitingPlayerId = Object.keys(waitingPlayers)[0];
                const waitingPlayer = waitingPlayers[waitingPlayerId];

                if (waitingPlayerId !== this.playerId) {
                    // Join existing game
                    this.isHost = false;
                    this.currentGameId = waitingPlayer.gameId;

                    // Remove from matchmaking
                    await matchmakingRef.child(waitingPlayerId).remove();
                    await matchmakingRef.child(this.playerId).remove();

                    // Join the game
                    return await this.joinGame(this.currentGameId);
                }
            }

            // No waiting players, become host
            this.isHost = true;
            this.currentGameId = this.generateGameId();

            // Add self to matchmaking queue
            await matchmakingRef.child(this.playerId).set({
                playerId: this.playerId,
                gameId: this.currentGameId,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            // Create new game
            return await this.createGame();

        } catch (error) {
            console.error('Matchmaking error:', error);
            return this.simulateMatchmaking();
        }
    }

    simulateMatchmaking() {
        // Demo mode - simulate finding an opponent
        console.log('🎭 Simulating matchmaking in demo mode...');
        return new Promise((resolve) => {
            const delay = Math.random() * 3000 + 2000; // 2-5 second delay
            console.log(`⏱️ Demo matchmaking will complete in ${Math.round(delay/1000)}s`);

            setTimeout(() => {
                this.isHost = true;
                this.currentGameId = 'demo_game_' + Date.now();
                const result = {
                    success: true,
                    gameId: this.currentGameId,
                    isHost: this.isHost,
                    opponent: {
                        playerId: 'demo_opponent',
                        character: this.getRandomCharacter()
                    }
                };
                console.log('✅ Demo matchmaking complete! Ready for character selection.');
                resolve(result);
            }, delay);
        });
    }

    generateGameId() {
        return 'game_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    getRandomCharacter() {
        const characters = ['wyatt', 'doc', 'johnny', 'curly'];
        return characters[Math.floor(Math.random() * characters.length)];
    }

    async createGame() {
        if (!this.database) {
            return this.simulateMatchmaking();
        }

        try {
            const gameData = {
                gameId: this.currentGameId,
                host: this.playerId,
                players: {
                    [this.playerId]: {
                        playerId: this.playerId,
                        character: null,
                        ready: false,
                        health: 100,
                        hasDrawn: false
                    }
                },
                gameState: 'waiting_for_players',
                countdown: 0,
                winner: null,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            this.gameRef = this.database.ref('games/' + this.currentGameId);
            await this.gameRef.set(gameData);

            // Set up listeners
            this.setupGameListeners();

            return { success: true, gameId: this.currentGameId, isHost: true };

        } catch (error) {
            console.error('Error creating game:', error);
            return { success: false, error: error.message };
        }
    }

    async joinGame(gameId) {
        if (!this.database) {
            return this.simulateMatchmaking();
        }

        try {
            this.gameRef = this.database.ref('games/' + gameId);

            // Add player to the game
            await this.gameRef.child('players/' + this.playerId).set({
                playerId: this.playerId,
                character: null,
                ready: false,
                health: 100,
                hasDrawn: false
            });

            // Set up listeners
            this.setupGameListeners();

            return { success: true, gameId: gameId, isHost: false };

        } catch (error) {
            console.error('Error joining game:', error);
            return { success: false, error: error.message };
        }
    }

    setupGameListeners() {
        if (!this.gameRef) return;

        // Listen for game state changes
        const gameStateListener = this.gameRef.on('value', (snapshot) => {
            const gameData = snapshot.val();
            if (gameData) {
                this.handleGameStateUpdate(gameData);
            }
        });

        this.listeners.push({ ref: this.gameRef, listener: gameStateListener });
    }

    handleGameStateUpdate(gameData) {
        console.log('📨 FIREBASE: Game state update received:', gameData);

        // Check for opponent actions
        const players = Object.values(gameData.players || {});
        const opponent = players.find(p => p.playerId !== this.playerId);

        console.log('👥 FIREBASE: Players in game:', players.length, 'Opponent found:', !!opponent);

        if (opponent && window.tombstoneGame && window.tombstoneGame.pixelGame) {
            const pixelGame = window.tombstoneGame.pixelGame;

            console.log('🎮 FIREBASE: Opponent data:', opponent);

            // Check if opponent has drawn (and we haven't been notified yet)
            if (opponent.hasDrawn && !pixelGame.opponentHasDrawn) {
                console.log('📤 FIREBASE: Opponent has drawn! Notifying pixel game...');
                pixelGame.handleOpponentAction('draw', {});
            }

            // Update opponent's health display if it changed
            if (opponent.health !== undefined) {
                pixelGame.opponentHealth = opponent.health;
                pixelGame.updateHealthBar('opponent', opponent.health);

                // Check for game end
                if (opponent.health <= 0 && pixelGame.playerHealth > 0) {
                    // We won!
                    setTimeout(() => {
                        pixelGame.endGame('player');
                    }, 500);
                }
            }

            // Check for opponent's last shot
            if (opponent.lastShot && opponent.lastShot.timestamp) {
                // Only process if this is a new shot (timestamp check)
                if (!pixelGame.lastOpponentShotTime || opponent.lastShot.timestamp > pixelGame.lastOpponentShotTime) {
                    pixelGame.lastOpponentShotTime = opponent.lastShot.timestamp;

                    // Calculate if the shot hit this player
                    const hitData = opponent.lastShot.hit ? { damage: 25 } : null;

                    pixelGame.handleOpponentAction('shoot', {
                        x: opponent.lastShot.x,
                        y: opponent.lastShot.y,
                        hit: hitData
                    });
                }
            }
        }

        // Notify the main game of state changes
        if (window.tombstoneGame && window.tombstoneGame.onMultiplayerUpdate) {
            window.tombstoneGame.onMultiplayerUpdate(gameData);
        }
    }

    async updatePlayerData(data) {
        if (!this.gameRef) return;

        try {
            await this.gameRef.child('players/' + this.playerId).update(data);
        } catch (error) {
            console.error('Error updating player data:', error);
        }
    }

    async updateGameState(state) {
        if (!this.gameRef || !this.isHost) return;

        try {
            await this.gameRef.update({ gameState: state });
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    }

    async startCountdown() {
        if (!this.isHost || !this.gameRef) return;

        try {
            await this.gameRef.update({
                gameState: 'countdown',
                countdown: 10,
                countdownStartTime: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Error starting countdown:', error);
        }
    }

    async playerDraw() {
        if (!this.gameRef) {
            console.error('❌ FIREBASE: No gameRef - cannot send draw action');
            return;
        }

        try {
            console.log('📤 FIREBASE: Updating draw action for player:', this.playerId);
            await this.gameRef.child('players/' + this.playerId).update({
                hasDrawn: true,
                drawTime: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ FIREBASE: Draw action sent successfully');
        } catch (error) {
            console.error('❌ FIREBASE: Error recording player draw:', error);
        }
    }

    async playerShoot(targetX, targetY, hit) {
        if (!this.gameRef) {
            console.error('❌ FIREBASE: No gameRef - cannot send shot action');
            return;
        }

        try {
            console.log('📤 FIREBASE: Updating shot action for player:', this.playerId, { targetX, targetY, hit });
            await this.gameRef.child('players/' + this.playerId).update({
                lastShot: {
                    x: targetX,
                    y: targetY,
                    hit: hit,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                }
            });
            console.log('✅ FIREBASE: Shot action sent successfully');
        } catch (error) {
            console.error('❌ FIREBASE: Error recording player shot:', error);
        }
    }

    async updateHealth(playerId, newHealth) {
        if (!this.gameRef) return;

        try {
            await this.gameRef.child('players/' + playerId).update({
                health: newHealth
            });

            // Check for game end
            if (newHealth <= 0) {
                const otherPlayers = await this.getOtherPlayers();
                const winner = otherPlayers.length > 0 ? otherPlayers[0].playerId : null;

                if (winner && this.isHost) {
                    await this.gameRef.update({
                        gameState: 'finished',
                        winner: winner
                    });
                }
            }
        } catch (error) {
            console.error('Error updating health:', error);
        }
    }

    async getOtherPlayers() {
        if (!this.gameRef) return [];

        try {
            const snapshot = await this.gameRef.child('players').once('value');
            const players = snapshot.val();

            return Object.values(players || {}).filter(p => p.playerId !== this.playerId);
        } catch (error) {
            console.error('Error getting other players:', error);
            return [];
        }
    }

    async leaveGame() {
        try {
            // Remove from matchmaking if still there
            if (this.database) {
                await this.database.ref('matchmaking/' + this.playerId).remove();
            }

            // Remove from current game
            if (this.gameRef) {
                await this.gameRef.child('players/' + this.playerId).remove();

                // If host leaving, clean up game
                if (this.isHost) {
                    await this.gameRef.remove();
                }
            }

            // Clean up listeners
            this.cleanup();

        } catch (error) {
            console.error('Error leaving game:', error);
        }
    }

    cleanup() {
        // Remove all listeners
        this.listeners.forEach(({ ref, listener }) => {
            ref.off('value', listener);
        });
        this.listeners = [];

        // Reset state
        this.currentGameId = null;
        this.gameRef = null;
        this.isHost = false;
    }

    // Utility method to get player count in queue
    async getQueueCount() {
        if (!this.database) return 1;

        try {
            const snapshot = await this.database.ref('matchmaking').once('value');
            const players = snapshot.val();
            return players ? Object.keys(players).length : 0;
        } catch (error) {
            console.error('Error getting queue count:', error);
            return 1;
        }
    }
}

// Export for global use
window.MultiplayerManager = MultiplayerManager;