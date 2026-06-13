// ============================
// DASHBOARD WITH FIREBASE
// ============================

import { 
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    setDoc
} from './firebase-config.js';

let currentUser = null;
let userData = null;

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('Logged in as:', user.email);
        
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                userData = userDoc.data();
                updateUI();
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
    } else {
        console.log('Not logged in, redirecting...');
        window.location.href = 'login.html';
    }
});

// Update UI with user data
function updateUI() {
    if (!userData) return;
    
    // Welcome name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.fullName || 'Traveller';
    }
    
    // Top bar avatar
    const avatarCircle = document.querySelector('.avatar-circle');
    if (avatarCircle) {
        if (userData.profilePic) {
            avatarCircle.innerHTML = `<img src="${userData.profilePic}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarCircle.textContent = (userData.fullName || 'U')[0].toUpperCase();
        }
    }
    
    // Profile page
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (userData.profilePic) {
            profileAvatar.innerHTML = `<img src="${userData.profilePic}" alt="Profile">`;
        } else {
            profileAvatar.textContent = (userData.fullName || 'U')[0].toUpperCase();
        }
    }
    
    // Profile details
    setElement('profileName', userData.fullName);
    setElement('profileCollege', userData.college);
    setElement('viewName', userData.fullName);
    setElement('viewEmail', userData.email);
    setElement('viewPhone', userData.phone);
    setElement('viewCollege', userData.college);
    
    // Format joined date
    if (userData.createdAt) {
        const date = userData.createdAt.toDate();
        const formatted = date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        setElement('viewJoined', formatted);
    }
    
    // Verification badge
    const badge = document.getElementById('verificationBadge');
    if (badge) {
        if (userData.verified) {
            badge.innerHTML = '<i class="fas fa-shield-alt"></i> Verified Member';
            badge.style.color = 'var(--accent-3)';
        } else {
            badge.innerHTML = '<i class="fas fa-clock"></i> Pending Verification';
            badge.style.color = '#ffd700';
        }
    }
    
    // Fill edit form
    document.getElementById('editName').value = userData.fullName || '';
    document.getElementById('editEmail').value = userData.email || '';
    document.getElementById('editPhone').value = userData.phone || '';
    document.getElementById('editCollege').value = userData.college || '';
}

function setElement(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '-';
}

// ============================
// EDIT PROFILE
// ============================
window.toggleEditMode = function() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const editBtn = document.getElementById('editToggleBtn');
    
    if (editMode.style.display === 'none') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    } else {
        cancelEdit();
    }
};

window.cancelEdit = function() {
    document.getElementById('viewMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('editToggleBtn').innerHTML = '<i class="fas fa-edit"></i> Edit';
};

window.saveProfile = async function() {
    const newName = document.getElementById('editName').value.trim();
    const newCollege = document.getElementById('editCollege').value.trim();
    
    if (!newName || !newCollege) {
        alert('Name and College cannot be empty!');
        return;
    }
    
    try {
        await setDoc(doc(db, "users", currentUser.uid), {
            ...userData,
            fullName: newName,
            college: newCollege
        }, { merge: true });
        
        userData.fullName = newName;
        userData.college = newCollege;
        
        updateUI();
        cancelEdit();
        
        alert('✅ Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('❌ Failed to update profile. Try again!');
    }
};

// ============================
// UPLOAD PROFILE PICTURE
// ============================
window.uploadProfilePic = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB!');
        return;
    }
    
    // Convert to base64 (simple approach without Firebase Storage)
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                ...userData,
                profilePic: base64
            }, { merge: true });
            
            userData.profilePic = base64;
            updateUI();
            
            alert('✅ Profile picture updated!');
        } catch (error) {
            console.error('Upload error:', error);
            alert('❌ Failed to upload picture. Try smaller image!');
        }
    };
    reader.readAsDataURL(file);
};

// ============================
// PAGE NAVIGATION
// ============================
window.showPage = function(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    document.getElementById('sidebar').classList.remove('open');
};

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

// MENU TOGGLE
document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// LOGOUT
const logoutBtn = document.querySelector('.nav-item.logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
    });
}

// COPY INVITE LINK
window.copyInviteLink = function() {
    const input = document.getElementById('inviteLink');
    if (input) {
        input.select();
        document.execCommand('copy');
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
    }
};

console.log('📊 Dashboard with Firebase loaded!');