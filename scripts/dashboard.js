// ============================
// DASHBOARD WITH FIREBASE - FIXED
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

// ============================
// WAIT FOR DOM TO LOAD
// ============================
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupLogout();
    setupMenuToggle();
});

// ============================
// CHECK LOGIN STATUS
// ============================
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

// ============================
// UPDATE UI WITH USER DATA
// ============================
function updateUI() {
    if (!userData) return;
    
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
            profileAvatar.innerHTML = `<img src="${userData.profilePic}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
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
        try {
            const date = userData.createdAt.toDate();
            const formatted = date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            setElement('viewJoined', formatted);
        } catch (e) {
            setElement('viewJoined', '-');
        }
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
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editPhone = document.getElementById('editPhone');
    const editCollege = document.getElementById('editCollege');
    
    if (editName) editName.value = userData.fullName || '';
    if (editEmail) editEmail.value = userData.email || '';
    if (editPhone) editPhone.value = userData.phone || '';
    if (editCollege) editCollege.value = userData.college || '';

       // Show admin features if user is admin
if (userData.role === 'super_admin' || userData.role === 'admin') {
    // Show admin in sidebar
    const adminLink = document.getElementById('adminPanelLink');
    if (adminLink) {
        adminLink.style.display = 'flex';
    }
    
    // Show admin in bottom nav (hide squad on mobile)
    const bottomAdmin = document.getElementById('bottomAdmin');
    const bottomSquad = document.getElementById('bottomSquad');
    if (bottomAdmin) {
        bottomAdmin.style.display = 'flex';
    }
    if (bottomSquad) {
        bottomSquad.style.display = 'none';
    }
    
    // Load pending count for badge
    loadPendingCount();
}
}

// ============================
// LOAD PENDING USERS COUNT FOR BADGE
// ============================
async function loadPendingCount() {
    try {
        const { collection, getDocs } = await import('./firebase-config.js');
        const usersSnapshot = await getDocs(collection(db, "users"));
        let pendingCount = 0;
        
        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (!data.verified) pendingCount++;
        });
        
        const badge = document.getElementById('bottomAdminBadge');
        if (badge && pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading pending count:', error);
    }
}

function setElement(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '-';
}

// ============================
// PAGE NAVIGATION (FIXED!)
// ============================
function showPage(pageName) {
    console.log('Switching to page:', pageName);
    
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page switched successfully');
    } else {
        console.error('Page not found:', `page-${pageName}`);
    }
    
    // Update sidebar nav
    const sidebarItems = document.querySelectorAll('.sidebar .nav-item');
    sidebarItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Update bottom nav
    const bottomItems = document.querySelectorAll('.bottom-nav-item');
    bottomItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Make showPage globally accessible
window.showPage = showPage;

// ============================
// SETUP NAVIGATION (FIXED!)
// ============================
function setupNavigation() {
    // Sidebar nav clicks
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-item[data-page]');
    sidebarLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    // Bottom nav clicks
    const bottomLinks = document.querySelectorAll('.bottom-nav-item[data-page]');
    bottomLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    console.log('Navigation setup complete');
}

// ============================
// MOBILE MENU TOGGLE
// ============================
function setupMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        });
    }
}

// ============================
// EDIT PROFILE
// ============================
window.toggleEditMode = function() {
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const editBtn = document.getElementById('editToggleBtn');
    
    if (editMode.style.display === 'none' || editMode.style.display === '') {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    } else {
        window.cancelEdit();
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
        window.cancelEdit();
        
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
// LOGOUT
// ============================
function setupLogout() {
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
}

// ============================
// COPY INVITE LINK
// ============================
window.copyInviteLink = function() {
    const input = document.getElementById('inviteLink');
    if (input) {
        input.select();
        document.execCommand('copy');
        const btn = document.getElementById('copyBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        }
    }
};

console.log('📊 Dashboard with Firebase Loaded Successfully!');