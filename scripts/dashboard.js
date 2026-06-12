// ============================
// DASHBOARD JS
// ============================

// PAGE NAVIGATION
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.animation = 'fadeIn 0.3s ease';
    }

    // Update sidebar active
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Update bottom nav active
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
}

// SIDEBAR NAV CLICKS
document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(item.dataset.page);
    });
});

// BOTTOM NAV CLICKS
document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(item.dataset.page);
    });
});

// MOBILE MENU TOGGLE
document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// COPY INVITE LINK
function copyInviteLink() {
    const input = document.getElementById('inviteLink');
    input.select();
    document.execCommand('copy');

    const btn = document.getElementById('copyBtn');
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';

    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        btn.style.background = '';
    }, 2000);
}

// EMAIL INVITE FORM
document.getElementById('emailInviteForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    const input = this.querySelector('input');
    const email = input.value;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
        input.value = '';

        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Invite';
            btn.style.background = '';
        }, 2000);
    }, 1500);
});

// CREATE TRIP FORM
document.getElementById('createTripForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit-trip');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Trip Created!';
        btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';

        setTimeout(() => {
            showPage('home');
            btn.innerHTML = '<i class="fas fa-rocket"></i> Create Trip';
            btn.style.background = '';
            this.reset();
            document.querySelectorAll('.type-tag').forEach(tag => tag.classList.remove('selected'));
        }, 1500);
    }, 2000);
});

// EXPENSE FORM
document.getElementById('expenseForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('button');
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';

    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-plus"></i> Add';
        this.reset();
    }, 1500);
});

// FILTER BUTTONS
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// SOCIAL SHARE BUTTONS
document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const platform = this.classList.contains('whatsapp') ? 'WhatsApp' :
            this.classList.contains('instagram') ? 'Instagram' : 'Telegram';

        if (platform === 'WhatsApp') {
            window.open(`https://wa.me/?text=Join me on TravelBuddy! Find your travel squad: https://travelbuddy.app/invite/abc123`, '_blank');
        }

        // For demo, show alert
        alert(`Share link copied for ${platform}! 🎉`);
    });
});

console.log('📊 TravelBuddy Dashboard Loaded!');