// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, getDocs, where } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwJcjmgG9xRb3GnpifSbTxR4J_VOL_TuI",
  authDomain: "munashe-project-5b0cd.firebaseapp.com",
  databaseURL: "https://munashe-project-5b0cd-default-rtdb.firebaseio.com",
  projectId: "munashe-project-5b0cd",
  storageBucket: "munashe-project-5b0cd.firebasestorage.app",
  messagingSenderId: "999066491216",
  appId: "1:999066491216:web:a88fe13731802a653d7455"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Attach functions to the window object for global access
window.testing = function() {
    console.log('Testing function called');
};

window.togglePassword = function() {
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.querySelector('.toggle-password');
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggle.classList.remove('fa-eye');
        passwordToggle.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = "password";
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
    }
};

window.register = async function() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Save user data to Firestore
        await setDoc(doc(db, "users", userId), {
            email: email,
            createdAt: new Date().toISOString(),
        });

        alert('Signup successful and user added to the Firestore database!');
        window.location.href = 'services.html'; // Redirect after signup
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

window.login = async function() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful!');
        window.location.href = 'services.html'; // Redirect after login
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
};

window.forgotPassword = async function(event) {
  if (event) event.preventDefault(); // Prevent form submission, if any

  const email = document.getElementById('username').value;

  if (!email) {
      alert('Please enter your email to reset your password.');
      return;
  }

  try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Please check your inbox.');
  } catch (error) {
      alert(`Error: ${error.message}`);
  }
};


window.search = async function() {
  const branch = document.querySelector('input[name="branch"]:checked');
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = '';  // Clear any previous error messages

  // Validation checks
  if (!branch) {
      errorMessage.textContent += 'Please select a branch. ';
  }
  if (!startDate || !endDate) {
      errorMessage.textContent += 'Please select both start and end dates. ';
  }
  if (new Date(startDate) > new Date() || new Date(endDate) > new Date()) {
      errorMessage.textContent += 'Dates cannot be in the future. ';
  }
  if (new Date(startDate) > new Date(endDate)) {
      errorMessage.textContent += 'Start date cannot be later than end date. ';
  }

  // If there are validation errors, return early
  if (errorMessage.textContent !== '') {
      return;
  }

  // Clear previous results
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';

    const db = getFirestore(); // Initialize Firestore
    const terminalsRef = collection(db, "terminals");

    // Create query with filters
    const terminalsQuery = query(
        terminalsRef,
        where("dispatchDate", ">=", startDate),
        where("dispatchDate", "<=", endDate)
    );

    try {
        const querySnapshot = await getDocs(terminalsQuery);

        if (querySnapshot.empty) {
            errorMessage.textContent = 'No terminals found.';
            document.getElementById('resultsTable').style.display = 'none';
            document.getElementById('exportButtons').style.display = 'none';
            return;
        }

        // Populate table with results
        querySnapshot.forEach(doc => {
            const terminal = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${terminal.terminalType}</td>
                <td>${terminal.merchantName}</td>
                <td>${terminal.tid}</td>
                <td>${terminal.terminalSerial}</td>
                <td>${terminal.lineSerial}</td>
                <td>${terminal.dispatchDate}</td>
                <td>${terminal.fedexTracking || ''}</td>
            `;
            resultsBody.appendChild(row);
        });

        // Show results table and export buttons
        document.getElementById('resultsTable').style.display = 'table';
        document.getElementById('exportButtons').style.display = 'flex';
    } catch (error) {
        console.error("Error fetching terminals:", error);
        errorMessage.textContent = `Error: ${error.message}`;
    }
};


window.addTerminal = async function() {
  const terminalType = document.getElementById('terminalType').value;
  const merchantName = document.getElementById('merchantName').value;
  const tid = document.getElementById('tid').value;
  const terminalSerial = document.getElementById('terminalSerial').value;
  const lineSerial = document.getElementById('lineSerial').value;
  const dispatchDate = document.getElementById('dispatchDate').value;
  const fedexTracking = document.getElementById('fedexTracking').value;
  const modalErrorMessage = document.getElementById('modal-error-message');

  modalErrorMessage.textContent = '';  // Clear any previous error messages

  // Validate Merchant Name
  const merchantNameRegex = /^[a-zA-Z0-9]+$/;
  if (!merchantNameRegex.test(merchantName) || merchantName.length < 4 || merchantName.length > 20) {
      modalErrorMessage.textContent += 'Merchant Name must be alphanumeric and between 4 and 20 characters. ';
  }

  // Validate TID (case insensitive)
  if (!/^nbs/.test(tid.toLowerCase())) {
      modalErrorMessage.textContent += 'TID must start with "NBS" or "nbs". ';
  }

  // Validate Terminal Serial Number
  if (terminalSerial.length < 6 || terminalSerial.length > 11) {
      modalErrorMessage.textContent += 'Terminal Serial Number must be between 6 and 11 characters. ';
  }

  // Validate Line Serial Number
  if (!/^\d{16,18}$/.test(lineSerial)) {
      modalErrorMessage.textContent += 'Line Serial must be 16 to 18 digits. ';
  }

  // Validate Required Fields
  if (!merchantName || !tid || !terminalSerial || !lineSerial || !dispatchDate) {
      modalErrorMessage.textContent += 'Please fill all required fields. ';
  }

  // If there are validation errors, return early
  if (modalErrorMessage.textContent !== '') {
      return;
  }

  // Add to Firestore Database
  try {
      const terminalData = {
          terminalType: terminalType,
          merchantName: merchantName,
          tid: tid,
          terminalSerial: terminalSerial,
          lineSerial: lineSerial,
          dispatchDate: dispatchDate,
          timestamp: new Date()  // Adding a timestamp for record creation
      };

      // Reference to Firestore collection
      await setDoc(doc(db, "terminals", terminalSerial), terminalData);

      // Success message
      alert('Terminal added to the database successfully.');

      // Clear the fields and close the modal after successful addition
      clearFields();
      closeModal();
  } catch (error) {
      modalErrorMessage.textContent = `Error: ${error.message}`;
  }
};

window.showDispatchModal = async function() {
  document.getElementById('dispatchModal').style.display = 'block';
}

window.closeModal = async function() {
  document.getElementById('dispatchModal').style.display = 'none';
}

window.clearFields = async function() {
  document.getElementById('merchantName').value = '';
  document.getElementById('tid').value = '';
  document.getElementById('terminalSerial').value = '';
  document.getElementById('lineSerial').value = '';
  document.getElementById('dispatchDate').value = '';
  document.getElementById('fedexTracking').value = '';
  document.getElementById('terminalType').selectedIndex = 0;
  document.querySelectorAll('input[name="dispatchBranch"]').forEach(input => {
      input.checked = false;
  });
}
