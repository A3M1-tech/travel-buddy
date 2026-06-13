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
        actionButton = `<button class="btn-join" onclick="requestJoinTrip('${trip.id}')">
            <i class="fas fa-plus"></i> Request to Join
        </button>`;
    }
    
    return `
        <div class="explore-card" data-types="${(trip.types || []).join(',')}">
            <div class="explore-banner" style="background: ${gradients[firstType] || gradients.adventure};">
                <div class="explore-banner-icon">
                    <i class="fas ${icons[firstType] || 'fa-suitcase-rolling'}"></i>
                </div>
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