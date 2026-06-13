// ============================
// LOGIN/SIGNUP WITH FULL SECURITY
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

// ============================
// VALIDATION FUNCTIONS
// ============================

// Validate Indian Phone Number
function validatePhone(phone) {
    // Remove spaces and dashes
    phone = phone.replace(/[\s-]/g, '');
    
    // Check length
    if (phone.length !== 10) {
        return { valid: false, message: '❌ Phone must be exactly 10 digits!' };
    }
    
    // Check if all digits
    if (!/^\d+$/.test(phone)) {
        return { valid: false, message: '❌ Phone must contain only numbers!' };
    }
    
    // Check Indian number (starts with 6, 7, 8, or 9)
    if (!/^[6-9]/.test(phone)) {
        return { valid: false, message: '❌ Indian phone must start with 6, 7, 8, or 9!' };
    }
    
    // Check for all same digits (like 9999999999)
    if (/^(\d)\1+$/.test(phone)) {
        return { valid: false, message: '❌ Invalid phone number!' };
    }
    
    // Check for sequential (like 1234567890)
    const sequential = ['1234567890', '0123456789', '9876543210'];
    if (sequential.includes(phone)) {
        return { valid: false, message: '❌ Please enter a real phone number!' };
    }
    
    return { valid: true };
}

// Validate Email
function validateEmail(email) {
    email = email.toLowerCase().trim();
    
    // Basic format check
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: '❌ Invalid email format!' };
    }
    
    // Block disposable/temp email domains
    const blockedDomains = [
        'tempmail.com', 'temp-mail.org', '10minutemail.com',
        'guerrillamail.com', 'mailinator.com', 'throwaway.email',
        'fake.com', 'test.com', 'example.com', 'abc.xyz',
        'yopmail.com', 'maildrop.cc', 'getnada.com'
    ];
    
    const domain = email.split('@')[1];
    if (blockedDomains.includes(domain)) {
        return { valid: false, message: '❌ Please use a real email (Gmail, Yahoo, Outlook etc.)!' };
    }
    
    // Allow only common email providers (for extra security)
    const allowedDomains = [
        'gmail.com', 'yahoo.com', 'yahoo.in', 'outlook.com',
        'hotmail.com', 'rediffmail.com', 'icloud.com',
        'protonmail.com', 'live.com', 'edu.in'
    ];
    
    // Allow educational domains (.edu, .ac.in)
    const isEducational = domain.endsWith('.edu') || 
                          domain.endsWith('.edu.in') || 
                          domain.endsWith('.ac.in');
    
    if (!allowedDomains.includes(domain) && !isEducational) {
        return { 
            valid: false, 
            message: '❌ Please use Gmail, Yahoo, Outlook or college email!' 
        };
    }
    
    return { valid: true };
}

// Validate Name
function validateName(name) {
    name = name.trim();
    
    if (name.length < 3) {
        return { valid: false, message: '❌ Name must be at least 3 characters!' };
    }
    
    if (!/^[a-zA-Z\s]+$/.test(name)) {
        return { valid: false, message: '❌ Name should only contain letters!' };
    }
    
    return { valid: true };
}

// Validate Password
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: '❌ Password must be at least 8 characters!' };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: '❌ Password needs at least 1 uppercase letter!' };
    }
    
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: '❌ Password needs at least 1 number!' };
    }
    
    return { valid: true };
}

// ============================
// REAL-TIME VALIDATION INDICATORS
// ============================

// Phone live validation
const phoneInput = document.querySelector('#signupForm input[type="tel"]');
if (phoneInput) {
    phoneInput.addEventListener('input', function() {
        // Allow only numbers
        this.value = this.value.replace(/[^\d]/g, '');
        // Max 10 digits
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });
}

// Password Strength
const signupPassword = document.getElementById('signupPassword');
if (signupPassword) {
    signupPassword.addEventListener('input', function () {
        const password = this.value;
        const strengthFill = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
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
// SIGNUP WITH FULL VALIDATION
// ============================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const inputs = this.querySelectorAll('input');
        
        const fullName = inputs[0].value.trim();
        const email = inputs[1].value.trim().toLowerCase();
        const college = inputs[2].value.trim();
        const phone = inputs[3].value.trim();
        const password = inputs[4].value;
        const inviteCode = inputs[5].value.trim();
        
        // VALIDATIONS
        const nameCheck = validateName(fullName);
        if (!nameCheck.valid) {
            alert(nameCheck.message);
            return;
        }
        
        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) {
            alert(emailCheck.message);
            return;
        }
        
        if (college.length < 3) {
            alert('❌ Please enter a valid college name!');
            return;
        }
        
        const phoneCheck = validatePhone(phone);
        if (!phoneCheck.valid) {
            alert(phoneCheck.message);
            return;
        }
        
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            alert(passwordCheck.message);
            return;
        }
        
        if (!inviteCode || inviteCode.length < 4) {
            alert('❌ Please enter a valid invite code!');
            return;
        }
        
        // All valid! Proceed with signup
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        btn.disabled = true;
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Save to database
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                college: college,
                phone: phone,
                inviteCode: inviteCode,
                role: "user",
                verified: false,
                emailVerified: false,
                createdAt: serverTimestamp(),
                tripsJoined: 0,
                tripsCreated: 0
            });
            
            // Send verification email
            await sendEmailVerification(user);
            
            btn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
            btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
            
            alert(`🎉 Welcome ${fullName}!\n\n📧 Verification email sent to:\n${email}\n\n⚠️ IMPORTANT:\n1. Check your inbox\n2. Click the verification link\n3. Then login!\n\nCan't find email? Check SPAM folder!`);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            
        } catch (error) {
            console.error('Signup error:', error);
            
            let errorMessage = 'Something went wrong!';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '❌ This email is already registered!\nTry logging in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '❌ Invalid email address!';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = '❌ Password is too weak!';
            }
            
            alert(errorMessage);
            btn.innerHTML = '<span>Create Account</span><i class="fas fa-rocket"></i>';
            btn.disabled = false;
            btn.style.background = '';
        }
    });
}

// ============================
// LOGIN WITH EMAIL VERIFICATION CHECK
// ============================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        
        const btn = this.querySelector('.btn-submit');
        const inputs = this.querySelectorAll('input');
        
        const email = inputs[0].value.trim().toLowerCase();
        const password = inputs[1].value;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // CHECK IF EMAIL IS VERIFIED
            if (!user.emailVerified) {
                btn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
                btn.disabled = false;
                
                const resend = confirm(
                    '⚠️ Your email is NOT verified!\n\n' +
                    'Please check your inbox (and spam) for verification link.\n\n' +
                    'Click OK to resend verification email.'
                );
                
                if (resend) {
                    await sendEmailVerification(user);
                    alert('✅ Verification email sent! Check your inbox.');
                }
                
                return;
            }
            
            btn.innerHTML = '<i class="fas fa-check"></i> Success!';
            btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
            
            console.log('Logged in:', user.email);
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed!';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = '❌ No account found with this email!';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = '❌ Wrong password!';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '❌ Invalid email!';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = '❌ Invalid email or password!';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = '❌ Too many failed attempts! Try again later.';
            }
            
            alert(errorMessage);
            btn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
            btn.disabled = false;
            btn.style.background = '';
        }
    });
}

console.log('🔐 Auth with Full Security loaded!');