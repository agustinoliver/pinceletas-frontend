const fs = require('fs');
const path = require('path');

// Leer las variables de entorno
const firebaseConfig = `export const firebaseEnvironment = {
  apiKey: "${process.env.FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || 'login-4f76e.firebaseapp.com'}",
  projectId: "${process.env.FIREBASE_PROJECT_ID || 'login-4f76e'}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || 'login-4f76e.firebasestorage.app'}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || '768052147467'}",
  appId: "${process.env.FIREBASE_APP_ID || '1:768052147467:web:545dc8efdd659b85879e0e'}"
};
`;

// Ruta donde se guardará el archivo
const outputPath = path.join(__dirname, '../src/app/enviroment/firebase-environment.ts');

// Crear el archivo
fs.writeFileSync(outputPath, firebaseConfig);

console.log('✅ Firebase config generado exitosamente en:', outputPath);