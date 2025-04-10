// firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLpd1XlI2ur_QTP92aL9MdUPdWJzLiAcE",
  authDomain: "kanban-sk.firebaseapp.com",
  projectId: "kanban-sk",
  storageBucket: "kanban-sk.appspot.com",
  messagingSenderId: "212999579493",
  appId: "1:212999579493:web:4eb1b19fffe96ada44e38c",
  measurementId: "G-E5JM5FDW4T",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
