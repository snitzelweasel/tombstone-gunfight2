# 🔥 Firebase Setup for Real Multiplayer

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Enter project name**: `tombstone-gunfight` (or whatever you prefer)
4. **Disable Google Analytics** (not needed for this game)
5. **Click "Create project"**

## Step 2: Set Up Realtime Database

1. **In Firebase Console, click "Realtime Database"** (left sidebar)
2. **Click "Create Database"**
3. **Choose location**: Select closest to your players
4. **Security rules**: Select "Start in test mode"
   - This allows read/write for 30 days (good for testing)
5. **Click "Done"**

## Step 3: Get Your Configuration

1. **Click the gear icon** ⚙️ (Project Settings)
2. **Scroll down to "Your apps"**
3. **Click the web icon** `</>`
4. **App nickname**: `tombstone-game`
5. **Don't check "Firebase Hosting"**
6. **Click "Register app"**
7. **Copy the `firebaseConfig` object**

It will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "tombstone-gunfight.firebaseapp.com",
  databaseURL: "https://tombstone-gunfight-default-rtdb.firebaseio.com/",
  projectId: "tombstone-gunfight",
  storageBucket: "tombstone-gunfight.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## Step 4: Configure Your Game

1. **Open `js/config.js`**
2. **Change `ENABLE_FIREBASE` to `true`**:
   ```javascript
   const ENABLE_FIREBASE = true;
   ```
3. **Replace the `firebaseConfig` with your actual config**
4. **Save the file**

## Step 5: Test Real Multiplayer

1. **Deploy your game** to any web hosting (Netlify, Vercel, GitHub Pages)
2. **Open the game URL in two different browsers/devices**
3. **Click "MULTIPLAYER DUEL" in both**
4. **They should match together for real-time play!**

## 🎮 What You Get

- ✅ **Real online multiplayer** across the internet
- ✅ **Global matchmaking** - any player can find any other player
- ✅ **Real-time synchronization** - draws, shots, health all synced
- ✅ **Free for up to 100 concurrent players**

## 🔒 Security (Optional - For Production)

After testing, update your Realtime Database rules:

1. **Go to Firebase Console > Realtime Database > Rules**
2. **Replace with**:
```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "auth != null || true"
      }
    },
    "matchmaking": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 🚀 Deployment Recommendations

- **Netlify**: Drag & drop your game folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Enable in repo settings
- **Firebase Hosting**: Run `firebase deploy`

## 💰 Costs

- **Firebase**: FREE up to 100 concurrent users, 1GB data transfer/month
- **Hosting**: FREE on all platforms mentioned
- **Custom domain**: ~$10/year (optional)

---

**Ready to go live?** Just follow these steps and you'll have a real multiplayer western showdown game! 🤠