// ============================
// FIREBASE CONFIGURATION
// TravelBuddy Backend Setup
// ============================

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzYEBOq7gdGvYaH4Kcp4ASbn_Yc1VTKc8",
    authDomain: "travel-buddy-b7486.firebaseapp.com",
    projectId: "travel-buddy-b7486",
    storageBucket: "travel-buddy-b7486.firebasestorage.app",
    messagingSenderId: "924865184814",
    appId: "1:924865184814:web:e9e46b1a7a388e39300bbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export EVERYTHING for other files to use
export { 
    auth, 
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    sendPasswordResetEmail,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment
};

console.log("🔥 Firebase Connected!");