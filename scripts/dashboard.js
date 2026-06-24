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
    setDoc,
    collection,
    addDoc,
    getDocs,
    serverTimestamp
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
// CREATE TRIP FUNCTIONALITY
// ============================

// Setup trip type tags
document.addEventListener('DOMContentLoaded', () => {
    setupTripTypeTags();
    setupCreateTripForm();
});

function setupTripTypeTags() {
    const tags = document.querySelectorAll('.type-tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });
}

function setupCreateTripForm() {
    const form = document.getElementById('createTripForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!userData) {
            alert('❌ Please wait, loading user data...');
            return;
        }
        
        // Check if user is verified
        if (!userData.verified) {
            alert(
                `⚠️ Account Not Verified\n\n` +
                `You need to be verified to create trips.\n\n` +
                `Please wait for admin approval first!`
            );
            return;
        }
        
        // Get form values
        const tripName = document.getElementById('tripName').value.trim();
        const destination = document.getElementById('tripDestination').value.trim();
        const startDate = document.getElementById('tripStartDate').value;
        const endDate = document.getElementById('tripEndDate').value;
        const budget = parseInt(document.getElementById('tripBudget').value);
        const maxMembers = parseInt(document.getElementById('tripMaxMembers').value);
        const description = document.getElementById('tripDescription').value.trim();
        const rules = document.getElementById('tripRules').value.trim();

        // Get cover image
        const coverImage = document.getElementById('coverImagePreview').dataset.imageData || null;

        
        // Get selected trip types
        const selectedTypes = [];
        document.querySelectorAll('.type-tag.selected').forEach(tag => {
            selectedTypes.push(tag.dataset.type);
        });
        
        // VALIDATIONS
        if (tripName.length < 3) {
            alert('❌ Trip name must be at least 3 characters!');
            return;
        }
        
        if (destination.length < 3) {
            alert('❌ Please enter a valid destination!');
            return;
        }
        
        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start < today) {
            alert('❌ Start date cannot be in the past!');
            return;
        }
        
        if (end <= start) {
            alert('❌ End date must be after start date!');
            return;
        }
        
        if (budget < 500) {
            alert('❌ Budget should be at least ₹500!');
            return;
        }
        
        if (maxMembers < 2 || maxMembers > 20) {
            alert('❌ Members should be between 2 and 20!');
            return;
        }
        
        if (description.length < 20) {
            alert('❌ Description must be at least 20 characters!');
            return;
        }
        
        if (selectedTypes.length === 0) {
            alert('❌ Please select at least one trip type!');
            return;
        }
        
        // All valid! Submit
        const btn = form.querySelector('.btn-submit-trip');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        btn.disabled = true;
        
        try {
            // Save trip to database
            const tripData = {
    name: tripName,
    destination: destination,
    startDate: startDate,
    endDate: endDate,
    budget: budget,
    maxMembers: maxMembers,
    description: description,
    rules: rules || 'No specific rules',
    types: selectedTypes,
    coverImage: coverImage, // NEW! Cover image
                
                // Creator info
                createdBy: currentUser.uid,
                creatorName: userData.fullName,
                creatorEmail: userData.email,
                creatorCollege: userData.college,
                
                // Status
                status: 'pending', // pending, approved, rejected
                
                // Members
                members: [currentUser.uid], // Creator is auto-member
                memberCount: 1,
                joinRequests: [],
                
                // Timestamps
                createdAt: serverTimestamp(),
                
                // Stats
                views: 0,
                likes: 0
            };
            
            const docRef = await addDoc(collection(db, "trips"), tripData);
            console.log('Trip created with ID:', docRef.id);
            
            // Update user's trips created count
            await setDoc(doc(db, "users", currentUser.uid), {
                ...userData,
                tripsCreated: (userData.tripsCreated || 0) + 1
            }, { merge: true });
            
            // Success!
            btn.innerHTML = '<i class="fas fa-check"></i> Submitted!';
            btn.style.background = 'linear-gradient(135deg, #00cc44, #00aa33)';
            
            alert(
                `🎉 Trip Submitted Successfully!\n\n` +
                `✅ Trip: ${tripName}\n` +
                `📍 Destination: ${destination}\n\n` +
                `⏳ Admin will review your trip within 24 hours.\n\n` +
                `You'll see it in "My Trips" once approved!\n\n` +
                `Thank you for using TravelBuddy! 🙏`
            );
            
            // Reset form
form.reset();
document.querySelectorAll('.type-tag.selected').forEach(tag => {
    tag.classList.remove('selected');
});

// Reset cover image
const preview = document.getElementById('coverImagePreview');
if (preview) {
    preview.innerHTML = `
        <i class="fas fa-camera"></i>
        <p>Click to upload cover image</p>
        <small>Or skip to use default gradient</small>
    `;
    delete preview.dataset.imageData;
}
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Approval';
                btn.disabled = false;
                btn.style.background = '';
                showPage('home');
            }, 2000);
            
        } catch (error) {
            console.error('Error creating trip:', error);
            alert('❌ Failed to submit trip. Try again!');
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Approval';
            btn.disabled = false;
        }
    });
}

// ============================
// COVER IMAGE PREVIEW
// ============================
window.previewCoverImage = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
        alert('❌ Image size should be less than 1MB!\nPlease compress at tinypng.com');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('coverImagePreview');
        preview.innerHTML = `
            <img src="${e.target.result}" alt="Cover">
            <div class="cover-overlay">
                <i class="fas fa-edit"></i>
                <span>Click to change</span>
            </div>
        `;
        preview.dataset.imageData = e.target.result;
    };
    reader.readAsDataURL(file);
};

// ============================
// TRIP MEMORY PHOTOS SYSTEM
// ============================

async function loadTripMemories(tripId) {
    const container = document.getElementById(`memoriesGrid-${tripId}`);
    if (!container) return;
    
    try {
        const { onSnapshot, query, orderBy, collection } = await import('./firebase-config.js');
        
        const memoriesRef = collection(db, "trips", tripId, "memories");
        const memoriesQuery = query(memoriesRef, orderBy("uploadedAt", "desc"));
        
        onSnapshot(memoriesQuery, (snapshot) => {
            const memories = [];
            snapshot.forEach((doc) => {
                memories.push({ id: doc.id, ...doc.data() });
            });
            
            displayMemories(tripId, memories);
        });
        
    } catch (error) {
        console.error('Error loading memories:', error);
    }
}

function displayMemories(tripId, memories) {
    const container = document.getElementById(`memoriesGrid-${tripId}`);
    if (!container) return;
    
    if (memories.length === 0) {
        container.innerHTML = `
            <div class="empty-memories">
                <i class="fas fa-camera-retro"></i>
                <p>No memories yet</p>
                <small>Be the first to share a moment! 📸</small>
            </div>
        `;
        return;
    }
    
    // Check if current user is admin
    const isAdmin = userData?.role === 'super_admin' || userData?.role === 'admin';
    
    container.innerHTML = memories.map(memory => createMemoryItem(memory, tripId, isAdmin)).join('');
}

function createMemoryItem(memory, tripId, isAdmin) {
    const isMine = memory.uploadedBy === currentUser?.uid;
    const canDelete = isMine || isAdmin;
    
    let dateStr = 'Just now';
    if (memory.uploadedAt) {
        try {
            const date = memory.uploadedAt.toDate();
            dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch (e) {}
    }
    
    return `
        <div class="memory-item" onclick="viewMemoryFullscreen('${memory.imageData}', '${memory.uploaderName}', '${dateStr}')">
            <img src="${memory.imageData}" alt="Memory" loading="lazy">
            <div class="memory-overlay">
                <div class="memory-info">
                    <p>By <strong>${memory.uploaderName}</strong></p>
                    <small>${dateStr}</small>
                </div>
                ${canDelete ? `
                    <button class="btn-delete-memory" onclick="event.stopPropagation(); deleteMemory('${tripId}', '${memory.id}', ${isAdmin && !isMine})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

window.viewMemoryFullscreen = function(imageData, uploader, date) {
    const modal = document.createElement('div');
    modal.className = 'memory-modal';
    modal.innerHTML = `
        <div class="memory-modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${imageData}" alt="Memory">
            <div class="memory-modal-info">
                <p>📸 By <strong>${uploader}</strong> • ${date}</p>
            </div>
        </div>
    `;
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
};

window.uploadMemoryPhoto = function(tripId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 1024 * 1024) {
            alert('❌ Image size should be less than 1MB!\nPlease compress at tinypng.com');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const { collection, addDoc, serverTimestamp } = await import('./firebase-config.js');
                
                await addDoc(collection(db, "trips", tripId, "memories"), {
                    imageData: event.target.result,
                    uploadedBy: currentUser.uid,
                    uploaderName: userData.fullName,
                    uploadedAt: serverTimestamp()
                });
                
                alert('✅ Memory uploaded! 📸');
            } catch (error) {
                console.error('Upload error:', error);
                alert('❌ Failed to upload. Try smaller image!');
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
};

window.deleteMemory = async function(tripId, memoryId, isAdminDelete) {
    const confirmMsg = isAdminDelete 
        ? '⚠️ ADMIN DELETE: Remove this photo from trip?\nThis action cannot be undone.'
        : 'Delete this memory?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const { deleteDoc } = await import('./firebase-config.js');
        await deleteDoc(doc(db, "trips", tripId, "memories", memoryId));
        
        if (isAdminDelete) {
            alert('🛡️ Photo removed by admin.');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Failed to delete.');
    }
};

console.log('📸 Memory Photos System Loaded!');

// ============================
// LOAD APPROVED TRIPS FOR EXPLORE
// ============================

let allApprovedTrips = [];

async function loadApprovedTrips() {
    const container = document.getElementById('exploreTripsContainer');
    if (!container) return;
    
    try {
        // Get all trips from database
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        allApprovedTrips = [];
        
        tripsSnapshot.forEach((doc) => {
            const trip = { id: doc.id, ...doc.data() };
            // Only show approved trips
            if (trip.status === 'approved') {
                allApprovedTrips.push(trip);
            }
        });
        
        console.log('Approved trips loaded:', allApprovedTrips.length);
        
        displayExploreTrips(allApprovedTrips);
        
    } catch (error) {
        console.error('Error loading trips:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Error Loading Trips</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayExploreTrips(trips) {
    const container = document.getElementById('exploreTripsContainer');
    if (!container) return;
    
    if (trips.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-compass"></i>
                </div>
                <h2>No Trips Yet! 🗺️</h2>
                <p>Be the first to create an epic trip! Once trips are approved, they'll appear here.</p>
                <div class="empty-actions">
                    <button class="btn-empty-primary" onclick="showPage('create')">
                        <i class="fas fa-plus-circle"></i> Create First Trip
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = trips.map(trip => createExploreCard(trip)).join('');
}

function createExploreCard(trip) {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    const startFormatted = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endFormatted = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    
    const spotsLeft = trip.maxMembers - (trip.memberCount || 1);
    const isFull = spotsLeft <= 0;
    const isUserMember = trip.members && trip.members.includes(currentUser?.uid);
    const isUserCreator = trip.createdBy === currentUser?.uid;
    
    // Get first trip type for color
    const firstType = trip.types?.[0] || 'adventure';
    const gradients = {
        mountains: 'linear-gradient(135deg, #667eea, #764ba2)',
        beach: 'linear-gradient(135deg, #f093fb, #f5576c)',
        camping: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        party: 'linear-gradient(135deg, #fa709a, #fee140)',
        adventure: 'linear-gradient(135deg, #30cfd0, #330867)',
        spiritual: 'linear-gradient(135deg, #a8edea, #fed6e3)',
        heritage: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
        food: 'linear-gradient(135deg, #ff9a9e, #fad0c4)'
    };
    
    const icons = {
        mountains: 'fa-mountain',
        beach: 'fa-umbrella-beach',
        camping: 'fa-campground',
        party: 'fa-music',
        adventure: 'fa-hiking',
        spiritual: 'fa-pray',
        heritage: 'fa-landmark',
        food: 'fa-utensils'
    };
    
    const typesHTML = (trip.types || []).slice(0, 3).map(t => `<span class="explore-type-tag">${t}</span>`).join('');
    
    let actionButton;
    if (isUserCreator) {
        actionButton = `<button class="btn-join" disabled style="background: #6c63ff;">
            <i class="fas fa-crown"></i> Your Trip
        </button>`;
    } else if (isUserMember) {
        actionButton = `<button class="btn-join" disabled style="background: #00cc44;">
            <i class="fas fa-check"></i> Joined
        </button>`;
    } else if (isFull) {
        actionButton = `<button class="btn-join" disabled style="background: #666;">
            <i class="fas fa-lock"></i> Full
        </button>`;
    } else {
    actionButton = `<button class="btn-join" onclick="event.stopPropagation(); requestJoinTrip('${trip.id}')">
        <i class="fas fa-plus"></i> Request to Join
    </button>`;
   }
    
    return `
    <div class="explore-card" data-types="${(trip.types || []).join(',')}" onclick="openTripDetails('${trip.id}')" style="cursor:pointer;">
        <div class="explore-banner" style="${trip.coverImage ? `background-image: url('${trip.coverImage}'); background-size: cover; background-position: center;` : `background: ${gradients[firstType] || gradients.adventure};`}">
    ${!trip.coverImage ? `<div class="explore-banner-icon"><i class="fas ${icons[firstType] || 'fa-suitcase-rolling'}"></i></div>` : '<div class="image-overlay"></div>'}
    <span class="spots-left ${isFull ? 'full' : ''}">
        ${isFull ? 'Full' : `${spotsLeft} spots left`}
    </span>
</div>
            <div class="explore-info">
                <h3>${trip.name}</h3>
                <p class="explore-location"><i class="fas fa-map-marker-alt"></i> ${trip.destination}</p>
                <p class="explore-dates"><i class="fas fa-calendar"></i> ${startFormatted} - ${endFormatted}</p>
                
                <div class="explore-types">
                    ${typesHTML}
                </div>
                
                <p class="explore-description">${trip.description.substring(0, 80)}${trip.description.length > 80 ? '...' : ''}</p>
                
                <div class="explore-creator">
                    <div class="creator-avatar">${(trip.creatorName || 'U')[0].toUpperCase()}</div>
                    <span>By ${trip.creatorName}</span>
                </div>
                
                <div class="explore-footer">
                    <div class="explore-price-section">
                        <span class="explore-price">₹${trip.budget}</span>
                        <span class="explore-price-label">/person</span>
                    </div>
                    ${actionButton}
                </div>
            </div>
        </div>
    `;
}

// FILTER FUNCTIONALITY
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setupExploreFilters();
    }, 1000);
});

function setupExploreFilters() {
    const filterBtns = document.querySelectorAll('#exploreFilters .filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            if (filter === 'all') {
                displayExploreTrips(allApprovedTrips);
            } else {
                const filtered = allApprovedTrips.filter(trip => 
                    trip.types && trip.types.includes(filter)
                );
                displayExploreTrips(filtered);
            }
        });
    });
}

// REQUEST TO JOIN TRIP
window.requestJoinTrip = async function(tripId) {
    if (!confirm('Send join request to trip creator?')) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        // Check if already requested
        const existingRequests = tripData.joinRequests || [];
        if (existingRequests.some(req => req.userId === currentUser.uid)) {
            alert('⏳ You already requested to join this trip!');
            return;
        }
        
        // Add join request
        const newRequest = {
            userId: currentUser.uid,
            userName: userData.fullName,
            userEmail: userData.email,
            userCollege: userData.college,
            requestedAt: new Date().toISOString()
        };
        
        await setDoc(tripRef, {
            ...tripData,
            joinRequests: [...existingRequests, newRequest]
        }, { merge: true });
        
        alert(
            `✅ Join Request Sent!\n\n` +
            `🎉 The trip creator will review your request.\n\n` +
            `You'll be notified once approved!`
        );
        
        loadApprovedTrips(); // Refresh
        
    } catch (error) {
        console.error('Join request error:', error);
        alert('❌ Failed to send request. Try again!');
    }
};

// Load trips when explore page is clicked (FIXED)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for everything to load
    setTimeout(() => {
        // Add click listeners to explore links
        document.querySelectorAll('[data-page="explore"]').forEach(link => {
            link.addEventListener('click', () => {
                console.log('Explore clicked - loading trips...');
                setTimeout(() => loadApprovedTrips(), 300);
            });
        });
    }, 1500);
});

// Auto-load trips immediately when page loads
setTimeout(() => {
    console.log('Auto-loading trips...');
    loadApprovedTrips();
}, 3000);

console.log('🗺️ Explore Trips System Loaded!');

console.log('✈️ Trip Creation System Loaded!');
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

// ============================
// MY TRIPS FUNCTIONALITY
// ============================

let myCreatedTrips = [];
let myJoinedTrips = [];
let myPendingRequests = [];

async function loadMyTrips() {
    if (!currentUser) return;
    
    try {
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        myCreatedTrips = [];
        myJoinedTrips = [];
        myPendingRequests = [];
        let totalRequests = 0;
        
        tripsSnapshot.forEach((doc) => {
            const trip = { id: doc.id, ...doc.data() };
            
            // Created by me
            if (trip.createdBy === currentUser.uid && trip.status === 'approved') {
                myCreatedTrips.push(trip);
                
                // Count join requests
                if (trip.joinRequests && trip.joinRequests.length > 0) {
                    totalRequests += trip.joinRequests.length;
                    trip.joinRequests.forEach(req => {
                        myPendingRequests.push({ ...req, tripId: trip.id, tripName: trip.name });
                    });
                }
            }
            
            // Joined trips
            if (trip.members && trip.members.includes(currentUser.uid) && trip.createdBy !== currentUser.uid && trip.status === 'approved') {
                myJoinedTrips.push(trip);
            }
        });
        
        // Update badges
        document.getElementById('createdCount').textContent = myCreatedTrips.length;
        document.getElementById('joinedCount').textContent = myJoinedTrips.length;
        document.getElementById('requestsCount').textContent = totalRequests;
        
        const sidebarBadge = document.getElementById('myTripsBadge');
        if (sidebarBadge) {
            if (totalRequests > 0) {
                sidebarBadge.textContent = totalRequests;
                sidebarBadge.style.display = 'inline-block';
            } else {
                sidebarBadge.style.display = 'none';
            }
        }
        
        // Show active tab
        const activeTab = document.querySelector('.trip-tab-btn.active')?.dataset.tab || 'created';
        displayMyTripsTab(activeTab);
        
    } catch (error) {
        console.error('Error loading my trips:', error);
    }
}

function displayMyTripsTab(tab) {
    const container = document.getElementById('myTripsContent');
    if (!container) return;
    
    if (tab === 'created') {
        displayCreatedTrips(container);
    } else if (tab === 'joined') {
        displayJoinedTrips(container);
    } else if (tab === 'requests') {
        displayJoinRequests(container);
    }
}

function displayCreatedTrips(container) {
    if (myCreatedTrips.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-crown"></i></div>
                <h2>No Trips Created Yet</h2>
                <p>Create your first trip to start your adventure!</p>
                <div class="empty-actions">
                    <button class="btn-empty-primary" onclick="showPage('create')">
                        <i class="fas fa-plus-circle"></i> Create Trip
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myCreatedTrips.map(trip => createMyTripCard(trip, 'created')).join('');
}

function displayJoinedTrips(container) {
    if (myJoinedTrips.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-suitcase"></i></div>
                <h2>No Trips Joined Yet</h2>
                <p>Explore trips and join exciting adventures!</p>
                <div class="empty-actions">
                    <button class="btn-empty-primary" onclick="showPage('explore')">
                        <i class="fas fa-compass"></i> Explore Trips
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myJoinedTrips.map(trip => createMyTripCard(trip, 'joined')).join('');
}

function displayJoinRequests(container) {
    if (myPendingRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-check-circle"></i></div>
                <h2>No Pending Requests</h2>
                <p>All caught up! Join requests will appear here.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = myPendingRequests.map(req => `
        <div class="request-card">
            <div class="request-header">
                <div class="request-avatar">${(req.userName || 'U')[0].toUpperCase()}</div>
                <div class="request-info">
                    <h3>${req.userName}</h3>
                    <p><i class="fas fa-university"></i> ${req.userCollege || 'Unknown'}</p>
                    <p><i class="fas fa-envelope"></i> ${req.userEmail}</p>
                </div>
            </div>
            <div class="request-trip-info">
                <i class="fas fa-suitcase"></i> Wants to join: <strong>${req.tripName}</strong>
            </div>
            <div class="request-actions">
                <button class="btn-accept" onclick="acceptJoinRequest('${req.tripId}', '${req.userId}')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="btn-decline" onclick="declineJoinRequest('${req.tripId}', '${req.userId}')">
                    <i class="fas fa-times"></i> Decline
                </button>
            </div>
        </div>
    `).join('');
}

function createMyTripCard(trip, type) {
    const startDate = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const endDate = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const spotsLeft = trip.maxMembers - (trip.memberCount || 1);
    
    const firstType = trip.types?.[0] || 'adventure';
    const gradients = {
        mountains: 'linear-gradient(135deg, #667eea, #764ba2)',
        beach: 'linear-gradient(135deg, #f093fb, #f5576c)',
        camping: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        party: 'linear-gradient(135deg, #fa709a, #fee140)',
        adventure: 'linear-gradient(135deg, #30cfd0, #330867)',
        spiritual: 'linear-gradient(135deg, #a8edea, #fed6e3)',
        heritage: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
        food: 'linear-gradient(135deg, #ff9a9e, #fad0c4)'
    };
    
    const pendingRequests = trip.joinRequests?.length || 0;
    
    return `
        <div class="my-trip-card">
            <div class="my-trip-banner" style="background: ${gradients[firstType]};">
                <h3>${trip.name}</h3>
                <span class="my-trip-status">
                    ${type === 'created' ? '👑 Created' : '✅ Joined'}
                </span>
            </div>
            <div class="my-trip-info">
                <div class="my-trip-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${trip.destination}</span>
                    <span><i class="fas fa-calendar"></i> ${startDate} - ${endDate}</span>
                    <span><i class="fas fa-users"></i> ${trip.memberCount || 1}/${trip.maxMembers} members</span>
                    <span><i class="fas fa-rupee-sign"></i> ${trip.budget}/person</span>
                </div>
                ${type === 'created' && pendingRequests > 0 ? `
                    <div class="pending-requests-info">
                        <i class="fas fa-bell"></i> ${pendingRequests} pending join request(s) - Check "Join Requests" tab!
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================
// ACCEPT JOIN REQUEST
// ============================
window.acceptJoinRequest = async function(tripId, userId) {
    if (!confirm('Accept this user to join your trip?')) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        // Check if spots available
        const currentMembers = tripData.members || [];
        if (currentMembers.length >= tripData.maxMembers) {
            alert('❌ Trip is full! Cannot accept more members.');
            return;
        }
        
        // Add to members
        const updatedMembers = [...currentMembers, userId];
        
        // Remove from join requests
        const updatedRequests = (tripData.joinRequests || []).filter(req => req.userId !== userId);
        
        await setDoc(tripRef, {
            ...tripData,
            members: updatedMembers,
            memberCount: updatedMembers.length,
            joinRequests: updatedRequests
        }, { merge: true });
        
        // Update user's trips joined count
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const userInfo = userSnap.data();
        await setDoc(userRef, {
            ...userInfo,
            tripsJoined: (userInfo.tripsJoined || 0) + 1
        }, { merge: true });
        
        alert('✅ User accepted! They are now part of your trip.');
        loadMyTrips();
        
    } catch (error) {
        console.error('Accept error:', error);
        alert('❌ Failed to accept. Try again!');
    }
};

// ============================
// DECLINE JOIN REQUEST
// ============================
window.declineJoinRequest = async function(tripId, userId) {
    if (!confirm('Decline this join request?')) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        // Remove from join requests
        const updatedRequests = (tripData.joinRequests || []).filter(req => req.userId !== userId);
        
        await setDoc(tripRef, {
            ...tripData,
            joinRequests: updatedRequests
        }, { merge: true });
        
        alert('Request declined.');
        loadMyTrips();
        
    } catch (error) {
        console.error('Decline error:', error);
        alert('Failed to decline.');
    }
};

// ============================
// TAB SWITCHING
// ============================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const tabBtns = document.querySelectorAll('.trip-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displayMyTripsTab(btn.dataset.tab);
            });
        });
    }, 1500);
});

// Load my trips when page is shown
const originalShowPageFunc = window.showPage;
window.showPage = function(pageName) {
    originalShowPageFunc(pageName);
    if (pageName === 'my-trips') {
        loadMyTrips();
    }
};

// Auto-load on page load
setTimeout(() => {
    loadMyTrips();
}, 3000);

// Refresh notifications every 10 seconds (faster!)
setInterval(() => {
    if (currentUser) {
        loadAllNotifications();
    }
}, 10000);

// Also refresh on focus
window.addEventListener('focus', () => {
    if (currentUser) {
        console.log('Window focused - refreshing notifications');
        loadAllNotifications();
    }
});

// Refresh when clicking bell
const bellRefresh = document.getElementById('bellIcon');
if (bellRefresh) {
    bellRefresh.addEventListener('click', () => {
        if (currentUser) {
            console.log('Bell clicked - refreshing notifications');
            loadAllNotifications();
        }
    });
}

console.log('🎒 My Trips System Loaded!');

// ============================
// TRIP DETAILS PAGE
// ============================

let currentTripId = null;

window.openTripDetails = async function(tripId) {
    currentTripId = tripId;
    showPage('trip-details');
    
    const container = document.getElementById('tripDetailsContent');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading trip details...</p>
        </div>
    `;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        
        if (!tripSnap.exists()) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <h2>Trip Not Found</h2>
                    <p>This trip may have been removed.</p>
                </div>
            `;
            return;
        }
        
        const trip = { id: tripSnap.id, ...tripSnap.data() };
        await displayTripDetails(trip);
        
    } catch (error) {
        console.error('Error loading trip:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h2>Error Loading Trip</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
};

async function displayTripDetails(trip) {
    const container = document.getElementById('tripDetailsContent');
    
    const startDate = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Calculate days
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const spotsLeft = trip.maxMembers - (trip.memberCount || 1);
    const isFull = spotsLeft <= 0;
    const isUserMember = trip.members && trip.members.includes(currentUser?.uid);
    const isUserCreator = trip.createdBy === currentUser?.uid;
    const hasRequested = trip.joinRequests?.some(req => req.userId === currentUser?.uid);
    
    // Get gradient
    const firstType = trip.types?.[0] || 'adventure';
    const gradients = {
        mountains: 'linear-gradient(135deg, #667eea, #764ba2)',
        beach: 'linear-gradient(135deg, #f093fb, #f5576c)',
        camping: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        party: 'linear-gradient(135deg, #fa709a, #fee140)',
        adventure: 'linear-gradient(135deg, #30cfd0, #330867)',
        spiritual: 'linear-gradient(135deg, #a8edea, #fed6e3)',
        heritage: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
        food: 'linear-gradient(135deg, #ff9a9e, #fad0c4)'
    };
    
    const icons = {
        mountains: 'fa-mountain',
        beach: 'fa-umbrella-beach',
        camping: 'fa-campground',
        party: 'fa-music',
        adventure: 'fa-hiking',
        spiritual: 'fa-pray',
        heritage: 'fa-landmark',
        food: 'fa-utensils'
    };
    
    // Load members data
    let membersHTML = '';
    if (trip.members && trip.members.length > 0) {
        for (const memberId of trip.members) {
            try {
                const memberSnap = await getDoc(doc(db, "users", memberId));
                if (memberSnap.exists()) {
                    const member = memberSnap.data();
                    const isCreator = memberId === trip.createdBy;
                    membersHTML += `
                        <div class="member-card">
                            <div class="member-avatar">${(member.fullName || 'U')[0].toUpperCase()}</div>
                            <div class="member-name">${member.fullName || 'User'}</div>
                            <div class="member-college">${member.college || 'Unknown'}</div>
                            ${isCreator ? '<div class="member-badge">👑 Creator</div>' : ''}
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Error loading member:', e);
            }
        }
    }
    
    // Action button
    let actionButton = '';
    if (isUserCreator) {
        actionButton = `
            <button class="btn-trip-action btn-trip-join" disabled style="background: linear-gradient(135deg, #ffd700, #ff8c00);">
                <i class="fas fa-crown"></i> You're The Creator
            </button>
        `;
    } else if (isUserMember) {
        actionButton = `
            <button class="btn-trip-action btn-trip-leave" onclick="leaveTrip('${trip.id}')">
                <i class="fas fa-sign-out-alt"></i> Leave Trip
            </button>
        `;
    } else if (hasRequested) {
        actionButton = `
            <button class="btn-trip-action btn-trip-join" disabled>
                <i class="fas fa-clock"></i> Request Sent
            </button>
        `;
    } else if (isFull) {
        actionButton = `
            <button class="btn-trip-action btn-trip-join" disabled style="background: #666;">
                <i class="fas fa-lock"></i> Trip Full
            </button>
        `;
    } else {
        actionButton = `
            <button class="btn-trip-action btn-trip-join" onclick="requestJoinTrip('${trip.id}')">
                <i class="fas fa-paper-plane"></i> Request to Join
            </button>
        `;
    }
    
    container.innerHTML = `
        <div class="trip-details-container">
            <!-- Banner -->
<div class="trip-details-banner" style="${trip.coverImage ? `background-image: url('${trip.coverImage}'); background-size: cover; background-position: center;` : `background: ${gradients[firstType]};`}">
    ${!trip.coverImage ? `<i class="fas ${icons[firstType]} trip-banner-icon-big"></i>` : ''}
    <div class="banner-content">
        <span class="trip-status-tag">✅ Approved Trip</span>
        <h1 class="trip-details-title">${trip.name}</h1>
        <p class="trip-details-location">
            <i class="fas fa-map-marker-alt"></i> ${trip.destination}
        </p>
    </div>
</div>
            
            <!-- Body -->
            <div class="trip-details-body">
                <!-- Quick Stats -->
                <div class="trip-quick-stats">
                    <div class="trip-quick-stat">
                        <i class="fas fa-calendar"></i>
                        <h4>${days}</h4>
                        <p>Days</p>
                    </div>
                    <div class="trip-quick-stat">
                        <i class="fas fa-users"></i>
                        <h4>${trip.memberCount || 1}/${trip.maxMembers}</h4>
                        <p>Members</p>
                    </div>
                    <div class="trip-quick-stat">
                        <i class="fas fa-rupee-sign"></i>
                        <h4>₹${trip.budget}</h4>
                        <p>Per Person</p>
                    </div>
                    <div class="trip-quick-stat">
                        <i class="fas fa-door-open"></i>
                        <h4>${spotsLeft}</h4>
                        <p>Spots Left</p>
                    </div>
                </div>
                
                <!-- Dates -->
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-calendar-alt"></i> Trip Dates
        ${isUserCreator ? `
            <button class="btn-edit-dates" onclick="openEditDatesModal('${trip.id}', '${trip.startDate}', '${trip.endDate}')">
                <i class="fas fa-edit"></i> Edit
            </button>
        ` : ''}
    </h3>
    <div class="trip-description-box">
        <strong>From:</strong> ${startDate} <br>
        <strong>To:</strong> ${endDate}
        ${trip.dateUpdatedAt ? `
            <div class="date-updated-note">
                <i class="fas fa-info-circle"></i>
                Dates updated recently ${trip.dateUpdateReason ? `(${trip.dateUpdateReason})` : ''}
            </div>
        ` : ''}
    </div>
</div>
                
                <!-- Description -->
                <div class="trip-section">
                    <h3 class="trip-section-title">
                        <i class="fas fa-info-circle"></i> About This Trip
                    </h3>
                    <div class="trip-description-box">
                        ${trip.description}
                    </div>
                </div>
                
                <!-- Trip Types -->
                <div class="trip-section">
                    <h3 class="trip-section-title">
                        <i class="fas fa-tags"></i> Trip Type
                    </h3>
                    <div class="trip-types-list">
                        ${(trip.types || []).map(t => `<span class="trip-type-pill-big">${t}</span>`).join('')}
                    </div>
                </div>
                
                <!-- Rules -->
                ${trip.rules && trip.rules !== 'No specific rules' ? `
                <div class="trip-section">
                    <h3 class="trip-section-title">
                        <i class="fas fa-shield-alt"></i> Trip Rules
                    </h3>
                    <div class="trip-rules-box">
                        ${trip.rules}
                    </div>
                </div>
                ` : ''}
                
                <!-- Creator -->
                <div class="trip-section">
                    <h3 class="trip-section-title">
                        <i class="fas fa-user-tie"></i> Trip Organizer
                    </h3>
                    <div class="trip-creator-box">
                        <div class="creator-avatar-big">${(trip.creatorName || 'U')[0].toUpperCase()}</div>
                        <div class="creator-info-big">
                            <h4>${trip.creatorName} <i class="fas fa-crown"></i></h4>
                            <p><i class="fas fa-university"></i> ${trip.creatorCollege}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Members -->
                <div class="trip-section">
                    <h3 class="trip-section-title">
                        <i class="fas fa-users"></i> Members (${trip.memberCount || 1})
                    </h3>
                    <div class="members-grid">
                        ${membersHTML}
                    </div>
                </div>
                
                <!-- Trip Memories -->
${(isUserMember || isUserCreator) ? `
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-images"></i> Trip Memories
        <button class="btn-upload-memory" onclick="uploadMemoryPhoto('${trip.id}')">
            <i class="fas fa-plus"></i> Add Photo
        </button>
    </h3>
    <div class="memories-grid" id="memoriesGrid-${trip.id}">
        <div class="loading-state" style="padding: 20px;">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading memories...</p>
        </div>
    </div>
</div>
` : `
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-images"></i> Trip Memories
    </h3>
    <div class="coming-soon-section">
        <i class="fas fa-lock"></i>
        <h3>Members Only</h3>
        <p>Join this trip to see memories!</p>
    </div>
</div>
`}
                <!-- SMART SPLIT / EXPENSES -->
${(isUserMember || isUserCreator) ? `
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-wallet"></i> Trip Expenses
        <span class="expense-total-badge" id="expenseTotalBadge-${trip.id}">₹0</span>
    </h3>
    <div class="expense-container">
        <!-- Summary -->
        <div class="expense-summary" id="expenseSummary-${trip.id}">
            <div class="summary-card">
                <div class="summary-icon" style="background: linear-gradient(135deg, #6c63ff, #764ba2);">
                    <i class="fas fa-coins"></i>
                </div>
                <div>
                    <h4 id="totalExpense-${trip.id}">₹0</h4>
                    <p>Total Spent</p>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon" style="background: linear-gradient(135deg, #00cc44, #00aa33);">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <h4 id="perPersonExpense-${trip.id}">₹0</h4>
                    <p>Per Person</p>
                </div>
            </div>
        </div>
        
        <!-- Add Expense Form -->
        <div class="add-expense-card">
            <h4><i class="fas fa-plus-circle"></i> Add Expense</h4>
            <div class="expense-form">
                <input 
                    type="text" 
                    id="expenseName-${trip.id}" 
                    placeholder="What was it for? (e.g., Hotel)"
                    maxlength="50"
                >
                <input 
                    type="number" 
                    id="expenseAmount-${trip.id}" 
                    placeholder="Amount in ₹"
                    min="1"
                >
                <button class="btn-add-expense" onclick="addExpense('${trip.id}')">
                    <i class="fas fa-plus"></i> Add Expense
                </button>
            </div>
            <p class="expense-note">
                <i class="fas fa-info-circle"></i>
                Cost will be split equally among all ${trip.memberCount || 1} members
            </p>
        </div>
        
        <!-- Expenses List -->
        <div class="expenses-list" id="expensesList-${trip.id}">
            <div class="loading-state" style="padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading expenses...</p>
            </div>
        </div>
        
        <!-- Balance Summary -->
        <div class="balance-summary" id="balanceSummary-${trip.id}" style="display:none;">
            <h4><i class="fas fa-balance-scale"></i> Who Owes What</h4>
            <div id="balanceList-${trip.id}"></div>
        </div>
    </div>
</div>
` : ''}
                <!-- Group Chat -->
${(isUserMember || isUserCreator) ? `
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-comments"></i> Group Chat
        <span class="live-indicator">
            <span class="live-dot"></span> LIVE
        </span>
    </h3>
    <div class="chat-container">
        <div class="chat-messages" id="chatMessages-${trip.id}">
            <div class="loading-state" style="padding: 20px;">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading messages...</p>
            </div>
        </div>
        <div class="chat-input-container">
            <input 
                type="text" 
                id="chatInput-${trip.id}" 
                class="chat-input" 
                placeholder="Type a message..."
                onkeypress="if(event.key==='Enter') sendChatMessage('${trip.id}')"
                maxlength="500"
            >
            <button class="chat-send-btn" onclick="sendChatMessage('${trip.id}')">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
</div>
` : `
<div class="trip-section">
    <h3 class="trip-section-title">
        <i class="fas fa-comments"></i> Group Chat
    </h3>
    <div class="coming-soon-section">
        <i class="fas fa-lock"></i>
        <h3>Members Only Chat</h3>
        <p>Join this trip to chat with members!</p>
    </div>
</div>
`}
                
                <!-- Actions -->
<div class="trip-actions">
    ${actionButton}
    ${(userData?.role === 'super_admin' || userData?.role === 'admin') ? `
        <button class="btn-trip-action btn-admin-delete" onclick="adminDeleteTrip('${trip.id}', '${trip.name.replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i> Admin Delete
        </button>
    ` : ''}
</div>
            </div>
        </div>
    `;
}

// ============================
// ADMIN DELETE TRIP (From Trip Details)
// ============================
window.adminDeleteTrip = async function(tripId, tripName) {
    const confirmMsg = `🛡️ ADMIN ACTION\n\n` +
        `Delete trip: "${tripName}"?\n\n` +
        `This will remove:\n` +
        `❌ All trip data\n` +
        `❌ All messages\n` +
        `❌ All expenses\n` +
        `❌ All photos\n\n` +
        `This CANNOT be undone!`;
    
    if (!confirm(confirmMsg)) return;
    
    const reason = prompt('Reason for deletion:');
    if (reason === null) return;
    
    try {
        const { deleteDoc } = await import('./firebase-config.js');
        await deleteDoc(doc(db, "trips", tripId));
        
        alert(`🗑️ Trip deleted successfully!`);
        showPage('explore');
        
    } catch (error) {
        console.error('Admin delete error:', error);
        alert('❌ Failed to delete trip.');
    }
};

// ============================
// SMART SPLIT - EXPENSE SYSTEM
// ============================

let expenseUnsubscribers = {};

async function loadExpenses(tripId) {
    const container = document.getElementById(`expensesList-${tripId}`);
    if (!container) return;
    
    try {
        const { onSnapshot, query, orderBy, collection } = await import('./firebase-config.js');
        
        const expensesRef = collection(db, "trips", tripId, "expenses");
        const expensesQuery = query(expensesRef, orderBy("createdAt", "desc"));
        
        if (expenseUnsubscribers[tripId]) {
            expenseUnsubscribers[tripId]();
        }
        
        expenseUnsubscribers[tripId] = onSnapshot(expensesQuery, async (snapshot) => {
            const expenses = [];
            snapshot.forEach((doc) => {
                expenses.push({ id: doc.id, ...doc.data() });
            });
            
            await displayExpenses(tripId, expenses);
        });
        
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function displayExpenses(tripId, expenses) {
    const container = document.getElementById(`expensesList-${tripId}`);
    if (!container) return;
    
    // Get trip data for member count
    const tripSnap = await getDoc(doc(db, "trips", tripId));
    const tripData = tripSnap.data();
    const memberCount = tripData.memberCount || 1;
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const perPerson = memberCount > 0 ? Math.round(totalAmount / memberCount) : 0;
    
    // Update summary
    document.getElementById(`totalExpense-${tripId}`).textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
    document.getElementById(`perPersonExpense-${tripId}`).textContent = `₹${perPerson.toLocaleString('en-IN')}`;
    document.getElementById(`expenseTotalBadge-${tripId}`).textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
    
    // Display expenses
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-expenses">
                <i class="fas fa-receipt"></i>
                <p>No expenses yet</p>
                <small>Add the first expense above!</small>
            </div>
        `;
        document.getElementById(`balanceSummary-${tripId}`).style.display = 'none';
        return;
    }

    const isUserCreatorOfTrip = tripData.createdBy === currentUser?.uid;
container.innerHTML = expenses.map(exp => createExpenseItem(exp, tripId, memberCount, isUserCreatorOfTrip)).join('');   

    // Calculate and show balance
    calculateBalance(tripId, expenses, tripData);
}

function createExpenseItem(expense, tripId, memberCount, isUserCreatorOfTrip = false) {
    const isMine = expense.paidBy === currentUser?.uid;
    const perPerson = Math.round(expense.amount / memberCount);
    
    let dateStr = 'Just now';
    if (expense.createdAt) {
        try {
            const date = expense.createdAt.toDate();
            dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        } catch (e) {}
    }
    
    return `
        <div class="expense-item">
            <div class="expense-icon" style="background: ${getRandomGradient(expense.id)};">
                <i class="fas ${getExpenseIcon(expense.name)}"></i>
            </div>
            <div class="expense-details">
                <h5>${escapeHtml(expense.name)}</h5>
                <p>Paid by <strong>${expense.paidByName}</strong> • ${dateStr}</p>
                <span class="per-person-tag">Each owes: ₹${perPerson.toLocaleString('en-IN')}</span>
            </div>
            <div class="expense-amount-section">
                <div class="expense-amount">₹${expense.amount.toLocaleString('en-IN')}</div>
                ${(isMine || isUserCreatorOfTrip) ? `
    <button class="btn-delete-expense" onclick="deleteExpense('${tripId}', '${expense.id}')" title="Delete">
        <i class="fas fa-trash"></i>
    </button>
` : ''}
            </div>
        </div>
    `;
}

function getExpenseIcon(name) {
    const lowName = name.toLowerCase();
    if (lowName.includes('hotel') || lowName.includes('room') || lowName.includes('stay')) return 'fa-hotel';
    if (lowName.includes('food') || lowName.includes('lunch') || lowName.includes('dinner') || lowName.includes('breakfast')) return 'fa-utensils';
    if (lowName.includes('bus') || lowName.includes('train') || lowName.includes('cab') || lowName.includes('taxi') || lowName.includes('uber')) return 'fa-bus';
    if (lowName.includes('flight') || lowName.includes('plane')) return 'fa-plane';
    if (lowName.includes('shop') || lowName.includes('gift')) return 'fa-shopping-bag';
    if (lowName.includes('ticket') || lowName.includes('entry')) return 'fa-ticket-alt';
    if (lowName.includes('drink') || lowName.includes('coffee') || lowName.includes('tea')) return 'fa-coffee';
    return 'fa-receipt';
}

function getRandomGradient(id) {
    const gradients = [
        'linear-gradient(135deg, #6c63ff, #764ba2)',
        'linear-gradient(135deg, #ff6584, #ff4444)',
        'linear-gradient(135deg, #4ecdc4, #44aa99)',
        'linear-gradient(135deg, #ffd700, #ff8c00)',
        'linear-gradient(135deg, #00cc44, #00aa33)',
        'linear-gradient(135deg, #f093fb, #f5576c)',
        'linear-gradient(135deg, #4facfe, #00f2fe)'
    ];
    const index = id.charCodeAt(0) % gradients.length;
    return gradients[index];
}

async function calculateBalance(tripId, expenses, tripData) {
    const memberCount = tripData.memberCount || 1;
    const members = tripData.members || [];
    const settlements = tripData.settlements || [];
    const isUserCreator = tripData.createdBy === currentUser?.uid;
    
    // Calculate how much each member paid
    const paidByMember = {};
    members.forEach(uid => paidByMember[uid] = 0);
    
    expenses.forEach(exp => {
        if (paidByMember[exp.paidBy] !== undefined) {
            paidByMember[exp.paidBy] += exp.amount;
        }
    });
    
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fairShare = totalAmount / memberCount;
    
    // Apply settlements
    const settledAmounts = {}; // uid -> total settled
    members.forEach(uid => settledAmounts[uid] = 0);
    
    settlements.forEach(s => {
        if (settledAmounts[s.from] !== undefined) {
            settledAmounts[s.from] += s.amount;
        }
    });
    
    // Calculate net balances (after settlements)
    const balances = {};
    for (const uid of members) {
        const paid = paidByMember[uid] || 0;
        const settled = settledAmounts[uid] || 0;
        balances[uid] = (paid - fairShare) + settled;
    }
    
    const balanceListContainer = document.getElementById(`balanceList-${tripId}`);
    const balanceSummary = document.getElementById(`balanceSummary-${tripId}`);
    
    if (totalAmount === 0) {
        balanceSummary.style.display = 'none';
        return;
    }
    
    balanceSummary.style.display = 'block';
    
    let balanceHTML = '';
    
    for (const uid of members) {
        try {
            const memberSnap = await getDoc(doc(db, "users", uid));
            if (memberSnap.exists()) {
                const member = memberSnap.data();
                const balance = balances[uid];
                const isMe = uid === currentUser?.uid;
                const memberName = member.fullName || 'Unknown';
                
                if (Math.abs(balance) < 1) {
                    balanceHTML += `
                        <div class="balance-row settled">
                            <div class="balance-name">
                                ${isMe ? '👤 You' : `👤 ${memberName}`}
                            </div>
                            <div class="balance-amount settled">
                                ✅ Settled
                            </div>
                        </div>
                    `;
                } else if (balance > 0) {
                    // This person GETS money
                    balanceHTML += `
                        <div class="balance-row positive">
                            <div class="balance-name">
                                ${isMe ? '👤 You get back' : `👤 ${memberName} gets back`}
                            </div>
                            <div class="balance-amount positive">
                                +₹${Math.round(balance).toLocaleString('en-IN')}
                            </div>
                        </div>
                    `;
                } else {
                    // This person OWES money
                    const owesAmount = Math.round(Math.abs(balance));
                    const canMarkPaid = isUserCreator || isMe;
                    
                    balanceHTML += `
                        <div class="balance-row negative">
                            <div class="balance-name-section">
                                <div class="balance-name">
                                    ${isMe ? '👤 You owe' : `👤 ${memberName} owes`}
                                </div>
                                <div class="balance-amount negative">
                                    -₹${owesAmount.toLocaleString('en-IN')}
                                </div>
                            </div>
                            ${canMarkPaid ? `
                                <button class="btn-mark-paid" onclick="markAsPaid('${tripId}', '${uid}', '${memberName}', ${owesAmount})">
                                    <i class="fas fa-check-circle"></i> Mark as Paid
                                </button>
                            ` : ''}
                        </div>
                    `;
                }
            }
        } catch (e) {
            console.error('Error loading member:', e);
        }
    }
    
    // Add settlement history if exists
    if (settlements.length > 0) {
        balanceHTML += `
            <div class="settlement-history">
                <h5><i class="fas fa-history"></i> Payment History</h5>
                ${settlements.map(s => {
                    let dateStr = 'Recently';
                    try {
                        if (s.date) {
                            const d = new Date(s.date);
                            dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        }
                    } catch (e) {}
                    return `
                        <div class="settlement-item">
                            <i class="fas fa-check-circle"></i>
                            <span><strong>${s.fromName}</strong> paid <strong>₹${s.amount.toLocaleString('en-IN')}</strong></span>
                            <span class="settlement-date">${dateStr}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    balanceListContainer.innerHTML = balanceHTML;
}

window.addExpense = async function(tripId) {
    const nameInput = document.getElementById(`expenseName-${tripId}`);
    const amountInput = document.getElementById(`expenseAmount-${tripId}`);
    
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!name || name.length < 2) {
        alert('❌ Please enter expense name (min 2 characters)');
        return;
    }
    
    if (!amount || amount < 1) {
        alert('❌ Please enter valid amount');
        return;
    }
    
    if (amount > 1000000) {
        alert('❌ Amount too large!');
        return;
    }
    
    try {
        const { collection, addDoc, serverTimestamp } = await import('./firebase-config.js');
        
        await addDoc(collection(db, "trips", tripId, "expenses"), {
            name: name,
            amount: amount,
            paidBy: currentUser.uid,
            paidByName: userData.fullName,
            createdAt: serverTimestamp()
        });
        
        // Clear inputs
        nameInput.value = '';
        amountInput.value = '';
        
        // Visual feedback
        nameInput.focus();
        
    } catch (error) {
        console.error('Add expense error:', error);
        alert('❌ Failed to add expense');
    }
};

window.deleteExpense = async function(tripId, expenseId) {
    if (!confirm('Delete this expense?')) return;
    
    try {
        const { deleteDoc } = await import('./firebase-config.js');
        await deleteDoc(doc(db, "trips", tripId, "expenses", expenseId));
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Failed to delete');
    }
};

// Load expenses when trip details opens
const previousOpenTripDetails = window.openTripDetails;
window.openTripDetails = async function(tripId) {
    await previousOpenTripDetails(tripId);
    
    setTimeout(() => {
        const expenseContainer = document.getElementById(`expensesList-${tripId}`);
        if (expenseContainer) {
            loadExpenses(tripId);
        }
        
        const memoriesContainer = document.getElementById(`memoriesGrid-${tripId}`);
        if (memoriesContainer) {
            loadTripMemories(tripId);
        }
    }, 500);
};

console.log('💰 Smart Split System Loaded!');
// ============================
// MARK PAYMENT AS PAID
// ============================
window.markAsPaid = async function(tripId, userId, userName, amount) {
    if (!confirm(`Mark ${userName}'s payment of ₹${amount.toLocaleString('en-IN')} as PAID?\n\nThis will settle the balance.`)) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        const settlements = tripData.settlements || [];
        
        // Add new settlement
        settlements.push({
            from: userId,
            fromName: userName,
            amount: amount,
            date: new Date().toISOString(),
            markedBy: currentUser.uid,
            markedByName: userData.fullName
        });
        
        await setDoc(tripRef, {
            ...tripData,
            settlements: settlements
        }, { merge: true });
        
        alert(`✅ Payment marked as settled!\n\n${userName}'s balance is now cleared.`);
        
    } catch (error) {
        console.error('Mark paid error:', error);
        alert('❌ Failed to mark as paid. Try again!');
    }
};

// ============================
// GROUP CHAT SYSTEM
// ============================

let chatUnsubscribers = {}; // Track active chat listeners

async function loadChatMessages(tripId) {
    const messagesContainer = document.getElementById(`chatMessages-${tripId}`);
    if (!messagesContainer) return;
    
    try {
        const { onSnapshot, query, orderBy, collection } = await import('./firebase-config.js');
        
        // Real-time listener for messages
        const messagesRef = collection(db, "trips", tripId, "messages");
        const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
        
        // Unsubscribe previous listener if exists
        if (chatUnsubscribers[tripId]) {
            chatUnsubscribers[tripId]();
        }
        
        // Set up real-time listener
        chatUnsubscribers[tripId] = onSnapshot(messagesQuery, (snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            displayChatMessages(tripId, messages);
        });
        
    } catch (error) {
        console.error('Error loading chat:', error);
        messagesContainer.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load chat</p>
            </div>
        `;
    }
}

function displayChatMessages(tripId, messages) {
    const container = document.getElementById(`chatMessages-${tripId}`);
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-chat">
                <i class="fas fa-comments"></i>
                <h4>No messages yet!</h4>
                <p>Be the first to say hi 👋</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => createChatBubble(msg)).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function createChatBubble(msg) {
    const isMine = msg.senderId === currentUser?.uid;
    const initial = (msg.senderName || 'U')[0].toUpperCase();
    
    // Format time
    let timeStr = 'Just now';
    if (msg.timestamp) {
        try {
            const date = msg.timestamp.toDate();
            const now = new Date();
            const diff = Math.floor((now - date) / 1000); // seconds
            
            if (diff < 60) {
                timeStr = 'Just now';
            } else if (diff < 3600) {
                timeStr = `${Math.floor(diff / 60)}m ago`;
            } else if (diff < 86400) {
                timeStr = `${Math.floor(diff / 3600)}h ago`;
            } else {
                timeStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            }
        } catch (e) {
            timeStr = 'Just now';
        }
    }
    
    if (isMine) {
        return `
            <div class="chat-bubble-row mine">
                <div class="chat-bubble mine">
                    <div class="chat-text">${escapeHtml(msg.text)}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
                <div class="chat-avatar mine">${initial}</div>
            </div>
        `;
    } else {
        return `
            <div class="chat-bubble-row">
                <div class="chat-avatar">${initial}</div>
                <div class="chat-bubble">
                    <div class="chat-sender">${msg.senderName}</div>
                    <div class="chat-text">${escapeHtml(msg.text)}</div>
                    <div class="chat-time">${timeStr}</div>
                </div>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.sendChatMessage = async function(tripId) {
    const input = document.getElementById(`chatInput-${tripId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    // Disable input while sending
    input.disabled = true;
    
    try {
        const { collection, addDoc, serverTimestamp } = await import('./firebase-config.js');
        
        await addDoc(collection(db, "trips", tripId, "messages"), {
            text: text,
            senderId: currentUser.uid,
            senderName: userData.fullName,
            senderEmail: userData.email,
            timestamp: serverTimestamp()
        });
        
        // Clear input
        input.value = '';
        input.disabled = false;
        input.focus();
        
    } catch (error) {
        console.error('Send error:', error);
        alert('❌ Failed to send message. Try again!');
        input.disabled = false;
    }
};

// Load chat when trip details opens
const originalOpenTripDetails = window.openTripDetails;
window.openTripDetails = async function(tripId) {
    await originalOpenTripDetails(tripId);
    
    // Wait for DOM to render then load chat
    setTimeout(() => {
        const chatContainer = document.getElementById(`chatMessages-${tripId}`);
        if (chatContainer) {
            loadChatMessages(tripId);
        }
    }, 500);
};

console.log('💬 Group Chat System Loaded!');

// LEAVE TRIP
window.leaveTrip = async function(tripId) {
    if (!confirm('Are you sure you want to leave this trip?')) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        const updatedMembers = (tripData.members || []).filter(id => id !== currentUser.uid);
        
        await setDoc(tripRef, {
            ...tripData,
            members: updatedMembers,
            memberCount: updatedMembers.length
        }, { merge: true });
        
        // Update user
        await setDoc(doc(db, "users", currentUser.uid), {
            ...userData,
            tripsJoined: Math.max(0, (userData.tripsJoined || 1) - 1)
        }, { merge: true });
        
        alert('✅ You left the trip.');
        showPage('explore');
        
    } catch (error) {
        console.error('Leave error:', error);
        alert('Failed to leave trip.');
    }
};

console.log('🎯 Trip Details Page Loaded!');

// ============================
// AI TRIP PLANNER BOT
// ============================

// Knowledge base for AI responses
const aiKnowledge = {
    destinations: {
        budget: {
            low: ['Pondicherry', 'Hampi', 'Pushkar', 'Rishikesh', 'McLeodganj', 'Gokarna', 'Varkala'],
            mid: ['Goa', 'Manali', 'Munnar', 'Udaipur', 'Jaisalmer', 'Coorg', 'Darjeeling'],
            high: ['Ladakh', 'Andaman', 'Spiti Valley', 'Kashmir', 'Sikkim', 'Meghalaya']
        },
        beach: ['Goa', 'Andaman', 'Pondicherry', 'Gokarna', 'Varkala', 'Diu', 'Tarkarli'],
        mountains: ['Manali', 'Ladakh', 'Spiti Valley', 'Sikkim', 'Darjeeling', 'McLeodganj', 'Mussoorie', 'Nainital'],
        adventure: ['Rishikesh', 'Ladakh', 'Spiti Valley', 'Bir Billing', 'Auli', 'Coorg'],
        spiritual: ['Rishikesh', 'Varanasi', 'Bodh Gaya', 'Pushkar', 'Tirupati', 'Amritsar'],
        party: ['Goa', 'Mumbai', 'Bangalore', 'Delhi', 'Pune'],
        weekend: {
            mumbai: ['Lonavala', 'Mahabaleshwar', 'Alibaug', 'Igatpuri', 'Matheran', 'Karjat'],
            delhi: ['Rishikesh', 'Mussoorie', 'Nainital', 'Jaipur', 'Agra', 'Neemrana'],
            bangalore: ['Coorg', 'Chikmagalur', 'Mysore', 'Wayanad', 'Pondicherry', 'Hampi']
        }
    }
};

// AI Response Generator
function generateAIResponse(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // Budget-based suggestions
    if (msg.includes('budget') || msg.includes('cheap') || msg.includes('₹') || msg.match(/\d{4,}/)) {
        const numbers = msg.match(/\d+/g);
        const budget = numbers ? parseInt(numbers[0]) : 5000;
        
        let category, suggestions;
        if (budget < 5000) {
            category = 'budget-friendly';
            suggestions = aiKnowledge.destinations.budget.low;
        } else if (budget < 10000) {
            category = 'mid-range';
            suggestions = aiKnowledge.destinations.budget.mid;
        } else {
            category = 'premium';
            suggestions = aiKnowledge.destinations.budget.high;
        }
        
        return `💰 <strong>Great budget of ₹${budget}!</strong><br><br>
        For a <strong>${category}</strong> trip, here are perfect destinations:<br><br>
        ${suggestions.slice(0, 5).map(d => `🌟 <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>💡 Budget Breakdown for ₹${budget}:</strong><br>
        🚌 Transport: ₹${Math.round(budget * 0.3).toLocaleString('en-IN')}<br>
        🏨 Stay: ₹${Math.round(budget * 0.35).toLocaleString('en-IN')}<br>
        🍕 Food: ₹${Math.round(budget * 0.20).toLocaleString('en-IN')}<br>
        🎢 Activities: ₹${Math.round(budget * 0.15).toLocaleString('en-IN')}<br><br>
        Want me to suggest specific itinerary? Just ask! 🚀`;
    }
    
    // Beach trips
    if (msg.includes('beach') || msg.includes('sea') || msg.includes('coast')) {
        return `🏖️ <strong>Beach Lover! Awesome choice!</strong><br><br>
        Top beach destinations in India:<br><br>
        ${aiKnowledge.destinations.beach.map(d => `🌊 <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>🌟 My Top Pick:</strong> Goa for nightlife, Andaman for pristine beaches!<br><br>
        💡 <strong>Best time:</strong> November to February<br>
        💰 <strong>Budget:</strong> ₹6,000-15,000 (3-4 days)<br>
        🎒 <strong>Pack:</strong> Sunscreen, swimwear, light cottons!`;
    }
    
    // Mountain trips
    if (msg.includes('mountain') || msg.includes('hill') || msg.includes('snow') || msg.includes('trek')) {
        return `🏔️ <strong>Mountains calling? Let's go!</strong><br><br>
        Best mountain destinations:<br><br>
        ${aiKnowledge.destinations.mountains.map(d => `⛰️ <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>🌟 Hot Picks:</strong><br>
        ❄️ <strong>Manali</strong> - Snow + Adventure (₹7-10k)<br>
        🌄 <strong>Ladakh</strong> - Bucket list trip (₹15-25k)<br>
        🍃 <strong>Spiti</strong> - Offbeat paradise (₹10-15k)<br><br>
        💡 <strong>Best time:</strong> Oct-Feb (snow), Mar-Jun (pleasant)<br>
        🎒 <strong>Pack:</strong> Warm clothes, gloves, trekking shoes!`;
    }
    
    // Adventure
    if (msg.includes('adventure') || msg.includes('thrill') || msg.includes('extreme')) {
        return `🎢 <strong>Adventure Junkie! Let's GO!</strong><br><br>
        Top adventure destinations:<br><br>
        ${aiKnowledge.destinations.adventure.map(d => `🏃 <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>🌟 Activities You'll LOVE:</strong><br>
        🪂 Paragliding at <strong>Bir Billing</strong><br>
        🚣 River Rafting at <strong>Rishikesh</strong><br>
        🚵 Mountain Biking in <strong>Ladakh</strong><br>
        🧗 Rock Climbing at <strong>Hampi</strong><br>
        ⛷️ Skiing at <strong>Auli</strong><br><br>
        💡 Most adventures: ₹500-3000 per activity<br>
        🛡️ Always book with verified operators!`;
    }
    
    // Spiritual
    if (msg.includes('spiritual') || msg.includes('peace') || msg.includes('temple') || msg.includes('yoga')) {
        return `🧘 <strong>Seeking peace? Perfect choice!</strong><br><br>
        Spiritual destinations:<br><br>
        ${aiKnowledge.destinations.spiritual.map(d => `🕉️ <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>🌟 My Recommendations:</strong><br>
        🧘 <strong>Rishikesh</strong> - Yoga capital of world<br>
        🕉️ <strong>Varanasi</strong> - Spiritual heart of India<br>
        🌸 <strong>Bodh Gaya</strong> - Buddha's enlightenment<br><br>
        💡 <strong>Best time:</strong> October to March<br>
        🎒 <strong>Pack:</strong> Modest clothes, comfortable shoes`;
    }
    
    // Party / Nightlife
    if (msg.includes('party') || msg.includes('club') || msg.includes('night')) {
        return `🎉 <strong>Party time! Let's have FUN!</strong><br><br>
        Top party destinations:<br><br>
        ${aiKnowledge.destinations.party.map(d => `🎊 <strong>${d}</strong>`).join('<br>')}<br><br>
        <strong>🌟 Best for:</strong><br>
        🏖️ <strong>Goa</strong> - Beach parties, EDM<br>
        🌆 <strong>Mumbai</strong> - Rooftop bars, clubs<br>
        🎵 <strong>Bangalore</strong> - Live music, pubs<br><br>
        💡 <strong>Pro tip:</strong> Friday-Sunday best for parties!<br>
        💰 Budget: ₹2000-5000/night for clubs`;
    }
    
    // Packing tips
    if (msg.includes('pack') || msg.includes('what to bring') || msg.includes('what to take')) {
        return `🎒 <strong>Smart Packing Guide!</strong><br><br>
        <strong>🌟 Essentials (Always pack):</strong><br>
        📱 Phone + Charger + Power bank<br>
        💳 ID Cards + Cash + Card<br>
        💊 Medicines + First-aid kit<br>
        🧴 Toiletries + Sanitizer<br>
        🧣 Light jacket (always!)<br><br>
        <strong>❄️ For Mountains/Cold:</strong><br>
        🧥 Heavy jacket, thermals, gloves<br>
        🧦 Wool socks, beanie<br>
        🥾 Trekking shoes<br><br>
        <strong>🏖️ For Beach:</strong><br>
        👕 Light cotton clothes<br>
        🩳 Swimwear, sunscreen<br>
        👡 Flip-flops, hat, sunglasses<br><br>
        💡 <strong>Golden Rule:</strong> Pack light, you'll thank yourself!`;
    }
    
    // Weekend trips
    if (msg.includes('weekend') || msg.includes('2 days') || msg.includes('short')) {
        let city = 'mumbai';
        if (msg.includes('delhi')) city = 'delhi';
        if (msg.includes('bangalore') || msg.includes('bengaluru')) city = 'bangalore';
        
        const trips = aiKnowledge.destinations.weekend[city];
        return `🚗 <strong>Quick Weekend Escape!</strong><br><br>
        Best weekend trips from ${city.charAt(0).toUpperCase() + city.slice(1)}:<br><br>
        ${trips.map(d => `🌟 <strong>${d}</strong>`).join('<br>')}<br><br>
        💡 <strong>Tips:</strong><br>
        ⏰ Leave Friday evening<br>
        🚌 Book transport in advance<br>
        💰 Budget ₹3000-6000 per person<br>
        📅 Return by Sunday evening<br><br>
        Want detailed itinerary for any? Just ask! 😊`;
    }
    
    // Safety
    if (msg.includes('safe') || msg.includes('safety') || msg.includes('solo')) {
        return `🛡️ <strong>Safety First! Smart traveller!</strong><br><br>
        <strong>🌟 Essential Safety Tips:</strong><br><br>
        📱 <strong>Always:</strong><br>
        ✅ Share location with family<br>
        ✅ Keep emergency contacts<br>
        ✅ Save local police number<br>
        ✅ Check weather before trip<br><br>
        💰 <strong>Money:</strong><br>
        ✅ Carry mixed payment options<br>
        ✅ Don't carry all cash in one place<br>
        ✅ Use UPI/cards when possible<br><br>
        🏨 <strong>Stay:</strong><br>
        ✅ Book verified hostels/hotels<br>
        ✅ Read reviews before booking<br>
        ✅ Reach destination before dark<br><br>
        👥 <strong>Travel:</strong><br>
        ✅ Use TravelBuddy to find groups! 😊<br>
        ✅ Trust your gut feeling<br>
        ✅ Stay aware of surroundings<br><br>
        🆘 <strong>Emergency:</strong> 112 (India)`;
    }
    
    // Best time / when to go
    if (msg.includes('best time') || msg.includes('when') || msg.includes('weather')) {
        return `📅 <strong>Best Travel Seasons in India:</strong><br><br>
        ❄️ <strong>October - February (BEST overall):</strong><br>
        Most of India is perfect! Goa, Rajasthan, South India<br><br>
        🌸 <strong>March - May (Summer):</strong><br>
        Head to hills! Manali, Shimla, Darjeeling, Ladakh<br><br>
        🌧️ <strong>June - September (Monsoon):</strong><br>
        Romantic: Kerala, Goa beaches, Mahabaleshwar<br><br>
        <strong>🌟 Special:</strong><br>
        ❄️ Snow in Manali: Dec-Feb<br>
        🌸 Cherry Blossom Shillong: Nov<br>
        🐅 Tiger spotting: Oct-April<br>
        🎉 Festivals: Diwali (Oct/Nov), Holi (Mar)`;
    }
    
    // Default - General help
    return `🤔 <strong>Interesting question!</strong><br><br>
    I can help you with:<br><br>
    💰 <strong>Budget trips</strong> - "I have ₹X for Y days"<br>
    🏖️ <strong>Beach destinations</strong><br>
    🏔️ <strong>Mountain trips</strong><br>
    🎢 <strong>Adventure activities</strong><br>
    🧘 <strong>Spiritual journeys</strong><br>
    🎉 <strong>Party destinations</strong><br>
    🎒 <strong>Packing tips</strong><br>
    🚗 <strong>Weekend getaways</strong><br>
    🛡️ <strong>Safety advice</strong><br>
    📅 <strong>Best time to visit</strong><br><br>
    Try asking something specific! 😊<br>
    Or click a suggestion below 👇`;
}

window.askAI = function(question) {
    document.getElementById('aiInput').value = question;
    sendAIMessage();
};

window.sendAIMessage = function() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    if (!message) return;
    
    const messagesContainer = document.getElementById('aiMessages');
    const suggestionsContainer = document.getElementById('aiSuggestions');
    
    // Hide suggestions after first message
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    
    // Add user message
    const userBubble = document.createElement('div');
    userBubble.className = 'ai-message ai-user';
    userBubble.innerHTML = `
        <div class="ai-bubble user">
            <p>${escapeHtml(message)}</p>
        </div>
        <div class="ai-avatar-user">${(userData?.fullName || 'U')[0].toUpperCase()}</div>
    `;
    messagesContainer.appendChild(userBubble);
    
    // Clear input
    input.value = '';
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-message ai-bot';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
        <div class="ai-avatar-bot">
            <i class="fas fa-robot"></i>
        </div>
        <div class="ai-bubble typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Generate response after delay (simulating thinking)
    setTimeout(() => {
        document.getElementById('typingIndicator')?.remove();
        
        const response = generateAIResponse(message);
        
        const botBubble = document.createElement('div');
        botBubble.className = 'ai-message ai-bot';
        botBubble.innerHTML = `
            <div class="ai-avatar-bot">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-bubble">
                ${response}
            </div>
        `;
        messagesContainer.appendChild(botBubble);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000 + Math.random() * 1000); // 1-2 second delay
};

console.log('🤖 AI Trip Planner Loaded!');

// ============================
// NOTIFICATIONS SYSTEM
// ============================

let allNotifications = [];

window.toggleNotifications = function() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        
        // Close when clicking outside
        if (dropdown.classList.contains('active')) {
            setTimeout(() => {
                document.addEventListener('click', closeNotifOnOutsideClick);
            }, 100);
        } else {
            document.removeEventListener('click', closeNotifOnOutsideClick);
        }
    }
};

function closeNotifOnOutsideClick(e) {
    const dropdown = document.getElementById('notificationsDropdown');
    const bell = document.getElementById('bellIcon');
    
    if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('active');
        document.removeEventListener('click', closeNotifOnOutsideClick);
    }
}

async function loadAllNotifications() {
    if (!currentUser || !userData) return;
    
    try {
        allNotifications = [];
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        
        // Check user verification status
        const userDocSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userDocSnap.exists()) {
            const freshUserData = userDocSnap.data();
            
            // Notification: You were verified!
            if (freshUserData.verified && freshUserData.verifiedAt) {
                const verifiedDate = freshUserData.verifiedAt.toDate ? freshUserData.verifiedAt.toDate() : new Date(freshUserData.verifiedAt);
                const hoursSince = (new Date() - verifiedDate) / (1000 * 60 * 60);
                
                if (hoursSince < 24) {
                    allNotifications.push({
                        type: 'account_verified',
                        icon: 'fa-check-circle',
                        color: 'linear-gradient(135deg, #00cc44, #00aa33)',
                        title: '🎉 Account Verified!',
                        subtitle: 'Welcome to TravelBuddy!',
                        meta: 'You can now create and join trips',
                        timestamp: freshUserData.verifiedAt,
                        actions: [
                            {
                                label: 'Explore Trips',
                                class: 'btn-notif-view',
                                onclick: `closeNotifAndGoExplore()`
                            }
                        ]
                    });
                }
            }
        }
        
        tripsSnapshot.forEach((doc) => {
            const trip = { id: doc.id, ...doc.data() };
            
            // ====================================
            // NOTIFICATIONS FOR TRIP CREATOR
            // ====================================
            if (trip.createdBy === currentUser.uid) {
                
                // 1. Join requests on YOUR trips
                if (trip.joinRequests && trip.joinRequests.length > 0) {
                    trip.joinRequests.forEach(req => {
                        allNotifications.push({
                            type: 'join_request',
                            icon: 'fa-user-plus',
                            color: 'linear-gradient(135deg, #6c63ff, #764ba2)',
                            title: `${req.userName} wants to join`,
                            subtitle: trip.name,
                            meta: `${req.userCollege || 'No college'}`,
                            timestamp: req.requestedAt,
                            actions: [
                                {
                                    label: '✅ Accept',
                                    class: 'btn-notif-accept',
                                    onclick: `acceptJoinRequestNotif('${trip.id}', '${req.userId}')`
                                },
                                {
                                    label: '❌ Reject',
                                    class: 'btn-notif-reject',
                                    onclick: `rejectJoinRequestNotif('${trip.id}', '${req.userId}')`
                                }
                            ]
                        });
                    });
                }
                
                // 2. Your trip got approved by admin
                if (trip.status === 'approved' && trip.approvedAt) {
                    const approvedDate = trip.approvedAt.toDate ? trip.approvedAt.toDate() : new Date(trip.approvedAt);
                    const hoursSince = (new Date() - approvedDate) / (1000 * 60 * 60);
                    
                    if (hoursSince < 48) {
                        allNotifications.push({
                            type: 'trip_approved',
                            icon: 'fa-check-circle',
                            color: 'linear-gradient(135deg, #00cc44, #00aa33)',
                            title: '🎉 Trip Approved!',
                            subtitle: trip.name,
                            meta: 'Now visible to all users',
                            timestamp: trip.approvedAt,
                            actions: [
                                {
                                    label: 'View Trip',
                                    class: 'btn-notif-view',
                                    onclick: `closeNotifAndOpenTrip('${trip.id}')`
                                }
                            ]
                        });
                    }
                }
                
                // 3. Your trip got rejected
                if (trip.status === 'rejected' && trip.rejectedAt) {
                    const rejectedDate = trip.rejectedAt.toDate ? trip.rejectedAt.toDate() : new Date(trip.rejectedAt);
                    const hoursSince = (new Date() - rejectedDate) / (1000 * 60 * 60);
                    
                    if (hoursSince < 72) {
                        allNotifications.push({
                            type: 'trip_rejected',
                            icon: 'fa-times-circle',
                            color: 'linear-gradient(135deg, #ff4444, #cc0000)',
                            title: '❌ Trip Not Approved',
                            subtitle: trip.name,
                            meta: trip.rejectionReason || 'Please review and try again',
                            timestamp: trip.rejectedAt
                        });
                    }
                }
            }
            
            // ====================================
            // NOTIFICATIONS FOR TRIP MEMBERS
            // ====================================
            if (trip.members && trip.members.includes(currentUser.uid) && trip.createdBy !== currentUser.uid) {
                
                // 4. You were ACCEPTED to a trip
                // (We'll check based on recent joins)
                
                // 5. Trip dates were CHANGED
                if (trip.dateUpdatedAt) {
                    const updatedDate = new Date(trip.dateUpdatedAt);
                    const hoursSince = (new Date() - updatedDate) / (1000 * 60 * 60);
                    
                    if (hoursSince < 48) {
                        const newStart = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        const newEnd = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        
                        allNotifications.push({
                            type: 'dates_changed',
                            icon: 'fa-calendar-alt',
                            color: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                            title: '📅 Trip Dates Changed',
                            subtitle: trip.name,
                            meta: `New: ${newStart} - ${newEnd} ${trip.dateUpdateReason ? `• ${trip.dateUpdateReason}` : ''}`,
                            timestamp: { toDate: () => updatedDate },
                            actions: [
                                {
                                    label: 'View Trip',
                                    class: 'btn-notif-view',
                                    onclick: `closeNotifAndOpenTrip('${trip.id}')`
                                }
                            ]
                        });
                    }
                }
            }
            
            // ====================================
            // NOTIFICATIONS FOR JOIN REQUEST SENDER
            // ====================================
            // 6. Check if YOUR join request was accepted/rejected
            // We track this by checking if you're in members now
            if (trip.members && trip.members.includes(currentUser.uid) && trip.createdBy !== currentUser.uid) {
                // You're a member - check if recently joined
                // For now, we show a welcome notification
            }
        });
        
        // ====================================
        // CHECK FOR EXPENSE/PAYMENT NOTIFICATIONS
        // ====================================
        await loadExpenseNotifications();
        
        // Sort by timestamp (newest first)
        allNotifications.sort((a, b) => {
            try {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
                return bTime - aTime;
            } catch (e) {
                return 0;
            }
        });
        
        displayNotifications();
        updateNotifBadge();
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Load expense notifications
async function loadExpenseNotifications() {
    try {
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        
        for (const tripDoc of tripsSnapshot.docs) {
            const trip = { id: tripDoc.id, ...tripDoc.data() };
            
            // Only for trips you're in
            if (trip.members && trip.members.includes(currentUser.uid)) {
                try {
                    const { query, orderBy, limit, getDocs: getExpenses } = await import('./firebase-config.js');
                    
                    const expensesRef = collection(db, "trips", trip.id, "expenses");
                    const expensesSnap = await getExpenses(expensesRef);
                    
                    expensesSnap.forEach((expDoc) => {
                        const exp = expDoc.data();
                        
                        // Only show notifications for expenses added by OTHERS in last 24h
                        if (exp.paidBy !== currentUser.uid && exp.createdAt) {
                            try {
                                const expDate = exp.createdAt.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt);
                                const hoursSince = (new Date() - expDate) / (1000 * 60 * 60);
                                
                                if (hoursSince < 24) {
                                    const perPerson = Math.round(exp.amount / trip.memberCount);
                                    allNotifications.push({
                                        type: 'new_expense',
                                        icon: 'fa-rupee-sign',
                                        color: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                                        title: `${exp.paidByName} added expense`,
                                        subtitle: `${exp.name} - ₹${exp.amount.toLocaleString('en-IN')}`,
                                        meta: `${trip.name} • Your share: ₹${perPerson.toLocaleString('en-IN')}`,
                                        timestamp: exp.createdAt,
                                        actions: [
                                            {
                                                label: 'View Trip',
                                                class: 'btn-notif-view',
                                                onclick: `closeNotifAndOpenTrip('${trip.id}')`
                                            }
                                        ]
                                    });
                                }
                            } catch (e) {}
                        }
                    });
                    
                    // Check settlements (payments marked as paid)
                    if (trip.settlements && trip.settlements.length > 0) {
                        trip.settlements.forEach(settlement => {
                            try {
                                const settleDate = new Date(settlement.date);
                                const hoursSince = (new Date() - settleDate) / (1000 * 60 * 60);
                                
                                // Notification for the person whose payment was marked
                                if (settlement.from === currentUser.uid && hoursSince < 48) {
                                    allNotifications.push({
                                        type: 'payment_marked',
                                        icon: 'fa-check-circle',
                                        color: 'linear-gradient(135deg, #00cc44, #00aa33)',
                                        title: '✅ Payment Confirmed',
                                        subtitle: `Your payment of ₹${settlement.amount.toLocaleString('en-IN')}`,
                                        meta: `${trip.name} • Marked by ${settlement.markedByName}`,
                                        timestamp: { toDate: () => settleDate },
                                        actions: [
                                            {
                                                label: 'View Trip',
                                                class: 'btn-notif-view',
                                                onclick: `closeNotifAndOpenTrip('${trip.id}')`
                                            }
                                        ]
                                    });
                                }
                            } catch (e) {}
                        });
                    }
                    
                    // Check for new memories (photos)
                    const memoriesRef = collection(db, "trips", trip.id, "memories");
                    const memoriesSnap = await getExpenses(memoriesRef);
                    
                    memoriesSnap.forEach((memDoc) => {
                        const mem = memDoc.data();
                        
                        if (mem.uploadedBy !== currentUser.uid && mem.uploadedAt) {
                            try {
                                const memDate = mem.uploadedAt.toDate ? mem.uploadedAt.toDate() : new Date(mem.uploadedAt);
                                const hoursSince = (new Date() - memDate) / (1000 * 60 * 60);
                                
                                if (hoursSince < 24) {
                                    allNotifications.push({
                                        type: 'new_memory',
                                        icon: 'fa-camera',
                                        color: 'linear-gradient(135deg, #f093fb, #f5576c)',
                                        title: `${mem.uploaderName} added a memory`,
                                        subtitle: trip.name,
                                        meta: 'New photo in trip',
                                        timestamp: mem.uploadedAt,
                                        actions: [
                                            {
                                                label: 'View Photo',
                                                class: 'btn-notif-view',
                                                onclick: `closeNotifAndOpenTrip('${trip.id}')`
                                            }
                                        ]
                                    });
                                }
                            } catch (e) {}
                        }
                    });
                    
                } catch (e) {
                    console.error('Error loading trip notifications:', e);
                }
            }
        }
    } catch (error) {
        console.error('Error in expense notifications:', error);
    }
}

// Helper function
window.closeNotifAndGoExplore = function() {
    document.getElementById('notificationsDropdown').classList.remove('active');
    showPage('explore');
};

// ============================
// EDIT TRIP DATES
// ============================

let currentEditTripId = null;

window.openEditDatesModal = function(tripId, currentStart, currentEnd) {
    currentEditTripId = tripId;
    
    const modal = document.getElementById('editDatesModal');
    const startInput = document.getElementById('editStartDate');
    const endInput = document.getElementById('editEndDate');
    const reasonInput = document.getElementById('editDateReason');
    
    // Set current values
    startInput.value = currentStart;
    endInput.value = currentEnd;
    reasonInput.value = '';
    
    // Set minimum date as today
    const today = new Date().toISOString().split('T')[0];
    startInput.min = today;
    
    modal.classList.add('active');
};

window.closeEditDatesModal = function() {
    const modal = document.getElementById('editDatesModal');
    modal.classList.remove('active');
    currentEditTripId = null;
};

window.saveTripDates = async function() {
    if (!currentEditTripId) return;
    
    const newStartDate = document.getElementById('editStartDate').value;
    const newEndDate = document.getElementById('editEndDate').value;
    const reason = document.getElementById('editDateReason').value.trim();
    
    // Validations
    if (!newStartDate || !newEndDate) {
        alert('❌ Please select both dates!');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
    
    if (start < today) {
        alert('❌ Start date cannot be in the past!');
        return;
    }
    
    if (end <= start) {
        alert('❌ End date must be after start date!');
        return;
    }
    
    try {
        const tripRef = doc(db, "trips", currentEditTripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        // Store old dates for history
        const dateHistory = tripData.dateHistory || [];
        dateHistory.push({
            oldStart: tripData.startDate,
            oldEnd: tripData.endDate,
            newStart: newStartDate,
            newEnd: newEndDate,
            reason: reason || 'No reason provided',
            changedAt: new Date().toISOString(),
            changedBy: userData.fullName
        });
        
        await setDoc(tripRef, {
            ...tripData,
            startDate: newStartDate,
            endDate: newEndDate,
            dateUpdatedAt: new Date().toISOString(),
            dateUpdateReason: reason,
            dateHistory: dateHistory
        }, { merge: true });
        
        alert(`✅ Trip dates updated successfully!\n\nAll members will be notified.`);
        
        closeEditDatesModal();
        
        // Refresh trip details
        openTripDetails(currentEditTripId);
        
    } catch (error) {
        console.error('Edit dates error:', error);
        alert('❌ Failed to update dates. Try again!');
    }
};

console.log('📅 Edit Trip Dates System Loaded!');