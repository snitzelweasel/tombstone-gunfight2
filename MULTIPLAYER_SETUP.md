# Multiplayer Setup Guide

## Firebase Configuration

To enable real multiplayer functionality, you need to set up a Firebase project:

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

### 2. Enable Realtime Database
1. In your Firebase project console, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (you can modify security rules later)
4. Select your preferred location

### 3. Get Configuration
1. In Firebase console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" and click "Web" (</>)
3. Register your app and copy the config object

### 4. Update Configuration
Replace the demo config in `js/multiplayer.js` (lines 11-19) with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## Demo Mode

The game currently works in **demo mode** without Firebase. In demo mode:
- Matchmaking is simulated (2-5 second delay)
- You play against a computer opponent
- No real-time multiplayer features

## How Multiplayer Works

### Matchmaking Process
1. Player clicks "MULTIPLAYER DUEL"
2. System searches for waiting players in Firebase
3. If found, joins their game; if not, creates new game and waits
4. Once both players are connected, they select characters
5. Game begins when both players are ready

### Real-time Features
- **Synchronized countdown**: Host controls timing
- **Draw detection**: Players see when opponent draws
- **Shot synchronization**: Shots and hits are shared between players
- **Health tracking**: Damage is synchronized across clients
- **Game state**: Win/loss conditions managed centrally

### Game Flow
1. **Matchmaking** → Finding opponent
2. **Character Selection** → Both players choose gunslinger
3. **Game Arena** → Pixel art gunfight begins
4. **Countdown** → 10-second preparation phase
5. **Draw Phase** → Players must draw guns when ready
6. **Shooting** → First to land killing shot wins
7. **Results** → Winner declared, return to menu

## Technical Implementation

### Key Components
- **MultiplayerManager**: Handles Firebase connection and game state
- **Matchmaking Queue**: Uses Firebase Realtime Database
- **Game Synchronization**: Real-time updates via Firebase listeners
- **Conflict Resolution**: Host-based authority for game state

### Security Notes
- Current setup uses test mode (open access)
- For production, implement proper Firebase security rules
- Consider user authentication for competitive play
- Monitor database usage to avoid Firebase limits

## Testing Multiplayer

1. Open the game in two browser windows/tabs
2. Click "MULTIPLAYER DUEL" in both windows
3. They should match together automatically
4. Test the full gameplay flow

Alternatively, use different devices on the same network to test real multiplayer functionality.