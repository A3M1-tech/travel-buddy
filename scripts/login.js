// ============================
// LOGIN / SIGNUP PAGE WITH FIREBASE
// ============================

import { 
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    doc,
    setDoc,
    serverTimestamp
} from './firebase-config.js';

// PARTICLES
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (Math.random() * 4 + 1) + 'px';
        particle.style.height = particle.style.width;
        const colors = ['#6c63ff', '#ff6584', '#4ecdc4'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
}
createParticles();

// TOGGLE PASSWORD
window.togglePassword = function(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// SWITCH FORMS
window.showSignup = function() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('signupCard').classList.remove('hidden');
};

window.showLogin = function() {
    document.getElementById('signupCard').classList.add('hidden');
    document.getElementById('loginCard').classList.remove('hidden');
};

if (window.location.hash === '#signup') {
    showSignup();
}

// PASSWORD STRENGTH CHECKER
const signupPassword = document.getElementById('signupPassword');
if (signupPassword) {
    signupPassword.addEventListener('input', function () {
        const password = this.value;
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const levels = [
            { width: '0%', color: 'transparent', text: 'Password strength' },
            { width: '20%', color: '#ff4444', text: 'Very Weak 😰' },
            { width: '40%', color: '#ff8800', text: 'Weak 😕' },
            { width: '60%', color: '#ffdd00', text: 'Fair 🙂' },
            { width: '80%', color: '#88cc00', text: 'Strong 💪' },
            { width: '100%', color: '#00cc44', text: 'Very Strong 🔥' }
        ];

        strengthFill.style.width = levels[strength].width;
        strengthFill.style.background = levels[strength].color;
        strengthText.textContent = levels[strength].text;
        strengthText.style.color = levels[strength].color;
    });
}

// ============================
// REAL SIGNUP WITH FIREBASE
// ============================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const inputs = this.querySelectorAll('input');
        
        // Get form values
        const fullName = inputs[0].value;
        const email = inputs[1].value;
        const college = inputs[2].value;
        const phone = inputs[3].value;
        const password = inputs[4].value;
        const inviteCode = inputs[5].value;
        
        // Validate
        if (password.length < 6) {
            alert('Password must be at least 6 characters!');
            return;
        }
        
        // Loading state
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        btn.disabled = true;
        
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save user data to Firestore Database
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                college: college,
                phone: phone,
                inviteCode: inviteCode,
                role: "user",
                verified: false,
                createdAt: serverTimestamp(),
                tripsJoined: 0,
                tripsCreated: 0
            });
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Success!
            btn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
            btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
            
            alert(`Welcome ${fullName}! 🎉\n\nA verification email has been sent to ${email}.\nPlease check your inbox!`);
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Signup error:', error);
            
            let errorMessage = 'Something went wrong!';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered!';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address!';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak!';
            }
            
            alert('❌ ' + errorMessage);
            btn.innerHTML = '<span>Create Account</span><i class="fas fa-rocket"></i>';
            btn.disabled = false;
            btn.style.background = '';
        }
    });
}

// ============================
// REAL LOGIN WITH FIREBASE
// ============================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const inputs = this.querySelectorAll('input');
        
        const email = inputs[0].value;
        const password = inputs[1].value;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            btn.innerHTML = '<i class="fas fa-check"></i> Success!';
            btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
            
            console.log('Logged in as:', user.email);
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed!';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email!';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Wrong password!';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email!';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password!';
            }
            
            alert('❌ ' + errorMessage);
            btn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
            btn.style.background = '';
        }
    });
}

console.log('🔐 TravelBuddy Auth Loaded with Firebase!');