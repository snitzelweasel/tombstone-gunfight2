# Tombstone Quick Draw Game

A western-themed gunfight game inspired by the classic movie "Tombstone". Face off against legendary gunslingers in high noon showdowns!

## Features

- **4 Iconic Characters**: Choose from Wyatt Earp, Doc Holliday, Johnny Ringo, and Curly Bill
- **Authentic 16-bit Sprites**: Hand-crafted character animations with idle, draw, and shoot poses
- **Dynamic Gameplay**: Countdown timer, bell signal, and precise aim mechanics
- **Visual Effects**: Flying bullets, muzzle flashes, and character hit animations
- **Audio Effects**: Gunshot sounds and authentic clock tower bell tolling
- **Custom Background**: Beautiful western town scene
- **Character Portraits**: Real character faces in the selection screen
- **Multiplayer Duels**: Real-time online multiplayer using Firebase
- **Smart Matchmaking**: Automatic opponent finding and game creation

## How to Play

### Single Player (VS Computer)
1. **Character Selection**: Choose your gunslinger from the character selection screen
2. **Wait for the Bell**: A 15-second countdown will begin - mouse is disabled during this time
3. **Draw!**: When the bell rings, quickly aim your crosshair at your opponent
4. **Shoot**: Click to fire - aim for the head/chest for a kill shot, body shots deal damage
5. **Victory**: First to eliminate their opponent wins!

### Multiplayer Duels
1. **Find Match**: Click "MULTIPLAYER DUEL" to enter matchmaking
2. **Wait for Opponent**: System finds another player automatically
3. **Character Selection**: Both players choose their gunslingers
4. **Real-time Duel**: Face off against a human opponent
5. **Draw Phase**: Click "DRAW!" button when ready, then aim and shoot
6. **Victory**: Fastest and most accurate gunslinger wins!

## Characters

- **Wyatt Earp**: Balanced gunfighter with good accuracy and speed
- **Doc Holliday**: Fastest draw but slightly lower accuracy
- **Johnny Ringo**: Well-rounded fighter with solid stats
- **Curly Bill**: Slower but powerful - when he hits, it counts

## Installation

1. Download or clone this project folder
2. Open `index.html` in your web browser
3. No additional setup required - everything runs locally!

## File Structure

```
tombstone-gunfight-game/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All game styling
├── js/
│   ├── script.js           # Main game controller
│   ├── pixelgame.js        # 2D gunfight mechanics
│   └── multiplayer.js      # Multiplayer and Firebase integration
├── assets/
│   └── images/            # Character sprites and backgrounds
│       ├── wyatt-*.png    # Wyatt Earp sprites
│       ├── doc-*.png      # Doc Holliday sprites
│       ├── ringo-*.png    # Johnny Ringo sprites
│       ├── curly-*.png    # Curly Bill sprites
│       └── town background.png
├── README.md              # This file
└── MULTIPLAYER_SETUP.md   # Firebase configuration guide
```

## Browser Compatibility

- Modern browsers with HTML5 support
- Chrome, Firefox, Safari, Edge
- JavaScript enabled required for gameplay

## Credits

Game inspired by the 1993 film "Tombstone"
Character sprites based on the movie portrayals

Enjoy your showdown in Tombstone! 🤠