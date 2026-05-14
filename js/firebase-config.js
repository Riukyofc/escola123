// =============================================================
// FIREBASE-CONFIG.JS — Inicialização Firebase (CDN Compat)
// =============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBCIK8xiFPoYUzYb5qHN4R9pzm6_CNjIgI",
  authDomain: "siteasdad.firebaseapp.com",
  projectId: "siteasdad",
  storageBucket: "siteasdad.firebasestorage.app",
  messagingSenderId: "519474252393",
  appId: "1:519474252393:web:fdba573c84f9e2f146f0f8",
  measurementId: "G-TENV71751F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

// Configurar persistência offline do Firestore
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore: múltiplas abas abertas, persistência desabilitada.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore: navegador não suporta persistência offline.');
  }
});

// Configurar idioma do Auth para pt-BR
auth.languageCode = 'pt';

console.log('🔥 Firebase inicializado com sucesso.');
