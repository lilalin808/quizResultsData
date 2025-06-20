import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

import {
  getAuth,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6H2NaGIybnyu2tH0nT7royeibAebJAIY",
  authDomain: "model-191ff.firebaseapp.com",
  projectId: "model-191ff",
  storageBucket: "model-191ff.appspot.com",
  messagingSenderId: "715464346435",
  appId: "1:715464346435:web:9e7a2105772e38a903bdf6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // ✅ required
const auth = getAuth(app);

const form = document.getElementById("login-form");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    message.textContent = `✅ Signed in as ${user.email}`;
    message.style.color = "green";

    location.reload();
  } catch (error) {
    console.error("❌ Sign-in error:", error);
    message.textContent = error.message;
    message.style.color = "red";
  }
});

const signoutButton = document.getElementById("signout-button");
const loadButton = document.getElementById("load-button");
const login = document.getElementById("login-form");
onAuthStateChanged(auth, (user) => {
  if (user) {
    signoutButton.style.display = "block";
    loadButton.style.display = "block";
    login.style.display = "none";
  } else {
    signoutButton.style.display = "none";
    loadButton.style.display = "none";
    login.style.display = "block";
  }
});

signoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Signed out successfully!");
    location.reload(); // 🔄 Optional: refresh the page after sign-out
  } catch (error) {
    console.error("Sign-out error:", error);
    alert("Error signing out.");
  }
});

async function loadStudyData() {
  const container = document.getElementById("study-results");
  container.innerHTML = "";

  const usersSnap = await getDocs(collection(db, "users"));

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    console.log(`🔍 Checking user: ${userId}`);

    const pastAttemptsRef = collection(db, "users", userId, "pastAttempts");
    const pastAttemptsSnap = await getDocs(pastAttemptsRef);

    let html = `<div><h2>User: ${userId}</h2>`;
    html += `<pre>${JSON.stringify(userDoc.data(), null, 2)}</pre>`;
    if (!pastAttemptsSnap.empty) {
      for (const quizTypeDoc of pastAttemptsSnap.docs) {
        const quizTypeId = quizTypeDoc.id;
        html += `<h4>Quiz Type: ${quizTypeId}</h4>`;

        const attemptsRef = collection(
          db,
          "users",
          userId,
          "pastAttempts",
          quizTypeId,
          "attempts"
        );
        const attemptsQuery = query(
          attemptsRef,
          orderBy("finalizedAt", "desc")
        );
        const attemptsSnap = await getDocs(attemptsQuery);

        if (!attemptsSnap.empty) {
          html += `<table border="1" cellpadding="5"><tr><th>Date</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th></tr>`;

          attemptsSnap.forEach((attemptDoc) => {
            const attempt = attemptDoc.data();
            const date =
              attempt.finalizedAt?.toDate().toLocaleString() || "Unknown date";

            html += `<tr>
                <td>${date}</td>
                <td>${attempt.correct ?? "N/A"}</td>
                <td>${attempt.incorrect ?? "N/A"}</td>
                <td>${attempt.unanswered ?? "N/A"}</td>
              </tr>`;
          });

          html += `</table>`;
        } else {
          html += `<p>No attempts recorded for this quiz type.</p>`;
        }
      }
    } else {
      html += `<p>No quiz attempts recorded.</p>`;
    }

    html += `</div><hr/>`;
    container.innerHTML += html;
  }
}

document.getElementById("load-button").addEventListener("click", loadStudyData);
