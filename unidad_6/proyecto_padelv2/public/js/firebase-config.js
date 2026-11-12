import { initializeApp } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// Reemplazá este objeto con la configuración de tu aplicación web.
// AGREGAR SDK de Firebase

// const firebaseConfig = {
//     apiKey: "api-key-de-tu-proyecto",
//     authDomain: "auth-domain-de-tu-proyecto",
//     projectId: "project-id-de-tu-proyecto",
//     storageBucket: "storage-bucket-de-tu-proyecto",
//     messagingSenderId: "messaging-sender-id-de-tu-proyecto",
//     appId: "app-id-de-tu-proyecto"
// };



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

