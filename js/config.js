// Firebase Configuration
// To enable real multiplayer, set ENABLE_FIREBASE to true and add your Firebase config

const ENABLE_FIREBASE = true; // Set to true to enable real multiplayer

// Replace with your Firebase configuration
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyBKEtQRlmlFH74LZMMVs2SzDS6Ceu2uuH8",
  authDomain: "tombstone-gunfight.firebaseapp.com",
  databaseURL: "https://tombstone-gunfight-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tombstone-gunfight",
  storageBucket: "tombstone-gunfight.firebasestorage.app",
  messagingSenderId: "707827585141",
  appId: "1:707827585141:web:a78691af3823b8c216a83c"
};

// Export configuration
window.GameConfig = {
    ENABLE_FIREBASE,
    firebaseConfig
};