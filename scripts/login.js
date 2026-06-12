// ============================
// LOGIN / SIGNUP PAGE JS
// ============================

// PARTICLES
function createParticles() {
    const container = document.getElementById('particles');
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

// TOGGLE PASSWORD VISIBILITY
function togglePassword(inputId, icon) {
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
}

// SWITCH BETWEEN LOGIN & SIGNUP
function showSignup() {
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('signupCard').classList.remove('hidden');
    document.getElementById('signupCard').style.animation = 'fadeInUp 0.5s ease';
}

function showLogin() {
    document.getElementById('signupCard').classList.add('hidden');
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('loginCard').style.animation = 'fadeInUp 0.5s ease';
}

// CHECK URL FOR SIGNUP REDIRECT
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

// LOGIN FORM SUBMIT
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;

    // Simulate login
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Success!';
        btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 2000);
});

// SIGNUP FORM SUBMIT
document.getElementById('signupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    btn.disabled = true;

    // Simulate signup
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
        btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 2000);
});

console.log('🔐 TravelBuddy Auth Page Loaded!');