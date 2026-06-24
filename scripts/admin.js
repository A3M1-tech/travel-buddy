// ============================
// ADMIN PANEL - JAVASCRIPT
// ============================

import { 
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy
} from './firebase-config.js';

let currentAdmin = null;
let allUsers = [];

// ============================
// CHECK IF USER IS ADMIN
// ============================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // CHECK IF ADMIN
                if (userData.role === "super_admin" || userData.role === "admin") {
                    currentAdmin = { uid: user.uid, ...userData };
                    console.log('Admin logged in:', user.email);
                    
                    // Update UI
                    updateAdminInfo();
                    
                    // Load data
                    loadAllUsers();
                    loadAllTrips();
                } else {
                    alert('❌ Access Denied! You are not an admin.');
                    window.location.href = 'dashboard.html';
                }
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        window.location.href = 'login.html';
    }
});

// ============================
// UPDATE ADMIN INFO
// ============================
function updateAdminInfo() {
    document.getElementById('adminName').textContent = currentAdmin.fullName || 'Admin';
    document.getElementById('settingsName').textContent = currentAdmin.fullName || '-';
    document.getElementById('settingsEmail').textContent = currentAdmin.email || '-';
    
    const avatarCircle = document.querySelector('.avatar-circle');
    if (avatarCircle) {
        avatarCircle.textContent = (currentAdmin.fullName || 'A')[0].toUpperCase();
    }
}

// ============================
// LOAD ALL USERS FROM DATABASE
// ============================
async function loadAllUsers() {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        allUsers = [];
        
        usersSnapshot.forEach((doc) => {
            allUsers.push({ uid: doc.id, ...doc.data() });
        });
        
        console.log('Loaded users:', allUsers.length);
        
        // Update everything
        updateStats();
        displayPendingUsers();
        displayAllUsers();
        displayAdminTeam();
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('pendingUsersList').innerHTML = `
            <div class="empty-admin-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Users</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============================
// LOAD ALL TRIPS
// ============================
let allTrips = [];

async function loadAllTrips() {
    try {
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        allTrips = [];
        
        tripsSnapshot.forEach((doc) => {
            allTrips.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Loaded trips:', allTrips.length);
        
        updateTripStats();
        displayPendingTrips();
        
    } catch (error) {
        console.error('Error loading trips:', error);
    }
}

function updateTripStats() {
    const pending = allTrips.filter(t => t.status === 'pending').length;
    const approved = allTrips.filter(t => t.status === 'approved').length;
    const total = allTrips.length;
    
    const pendingEl = document.getElementById('totalPendingTrips');
    const approvedEl = document.getElementById('totalApprovedTrips');
    const totalEl = document.getElementById('totalTripsAdmin');
    const badge = document.getElementById('pendingTripsBadge');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (totalEl) totalEl.textContent = total;
    if (badge) {
        badge.textContent = pending;
        badge.style.display = pending > 0 ? 'inline-block' : 'none';
    }
}

function displayPendingTrips() {
    const container = document.getElementById('pendingTripsList');
    if (!container) return;
    
    if (allTrips.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <i class="fas fa-plane-slash"></i>
                <h3>No Trips Yet!</h3>
                <p>Trips will appear here when users create them.</p>
            </div>
        `;
        return;
    }
    
    // Sort: pending first, then approved, then rejected
    const sortedTrips = [...allTrips].sort((a, b) => {
        const order = { pending: 0, approved: 1, rejected: 2 };
        return (order[a.status] || 3) - (order[b.status] || 3);
    });
    
    container.innerHTML = sortedTrips.map(trip => createTripCardAdmin(trip)).join('');
}

function createTripCardAdmin(trip) {
    const typesHTML = (trip.types || []).map(t => `<span class="trip-type-pill">${t}</span>`).join('');
    
    const startDate = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Status badge
    let statusBadge = '';
    if (trip.status === 'pending') {
        statusBadge = '<span class="trip-status-badge pending">⏳ Pending</span>';
    } else if (trip.status === 'approved') {
        statusBadge = '<span class="trip-status-badge approved">✅ Approved</span>';
    } else if (trip.status === 'rejected') {
        statusBadge = '<span class="trip-status-badge rejected">❌ Rejected</span>';
    }
    
    // Action buttons based on status
    let actionButtons = '';
    if (trip.status === 'pending') {
        actionButtons = `
            <button class="btn-approve" onclick="approveTrip('${trip.id}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" onclick="rejectTrip('${trip.id}')">
                <i class="fas fa-times"></i> Reject
            </button>
            <button class="btn-delete-trip" onclick="deleteTrip('${trip.id}', '${trip.name}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
    } else {
        actionButtons = `
            <button class="btn-delete-trip" onclick="deleteTrip('${trip.id}', '${trip.name}')">
                <i class="fas fa-trash"></i> Delete Trip
            </button>
        `;
    }
    
    return `
        <div class="trip-card-admin">
            <div class="trip-card-header">
                <h3>${trip.name}</h3>
                ${statusBadge}
            </div>
            
            <div class="trip-card-body">
                <div class="trip-detail-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span><strong>Destination:</strong> ${trip.destination}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-calendar"></i>
                    <span><strong>Dates:</strong> ${startDate} → ${endDate}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-rupee-sign"></i>
                    <span><strong>Budget:</strong> ₹${trip.budget}/person</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-users"></i>
                    <span><strong>Members:</strong> ${trip.memberCount || 1}/${trip.maxMembers}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-user-circle"></i>
                    <span><strong>Created by:</strong> ${trip.creatorName} (${trip.creatorCollege})</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-pen"></i>
                    <span><strong>Description:</strong> ${trip.description}</span>
                </div>
                ${trip.rules && trip.rules !== 'No specific rules' ? `
                <div class="trip-detail-row">
                    <i class="fas fa-shield-alt"></i>
                    <span><strong>Rules:</strong> ${trip.rules}</span>
                </div>
                ` : ''}
                <div class="trip-types-display">
                    ${typesHTML}
                </div>
            </div>
            
            <div class="trip-card-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

function createTripCard(trip) {
    const typesHTML = (trip.types || []).map(t => `<span class="trip-type-pill">${t}</span>`).join('');
    
    const startDate = new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDate = new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return `
        <div class="trip-card-admin">
            <div class="trip-card-header">
                <h3>${trip.name}</h3>
                <span class="trip-status-badge pending">⏳ Pending</span>
            </div>
            
            <div class="trip-card-body">
                <div class="trip-detail-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <span><strong>Destination:</strong> ${trip.destination}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-calendar"></i>
                    <span><strong>Dates:</strong> ${startDate} → ${endDate}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-rupee-sign"></i>
                    <span><strong>Budget:</strong> ₹${trip.budget}/person</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-users"></i>
                    <span><strong>Max Members:</strong> ${trip.maxMembers}</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-user-circle"></i>
                    <span><strong>Created by:</strong> ${trip.creatorName} (${trip.creatorCollege})</span>
                </div>
                <div class="trip-detail-row">
                    <i class="fas fa-pen"></i>
                    <span><strong>Description:</strong> ${trip.description}</span>
                </div>
                ${trip.rules && trip.rules !== 'No specific rules' ? `
                <div class="trip-detail-row">
                    <i class="fas fa-shield-alt"></i>
                    <span><strong>Rules:</strong> ${trip.rules}</span>
                </div>
                ` : ''}
                <div class="trip-types-display">
                    ${typesHTML}
                </div>
            </div>
            
            <div class="trip-card-actions">
                <button class="btn-approve" onclick="approveTrip('${trip.id}')">
                    <i class="fas fa-check"></i> Approve Trip
                </button>
                <button class="btn-reject" onclick="rejectTrip('${trip.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `;
}

// ============================
// DELETE TRIP (ADMIN POWER)
// ============================
window.deleteTrip = async function(tripId, tripName) {
    const confirmMsg = `⚠️ DELETE TRIP: "${tripName}"\n\n` +
        `This will permanently remove:\n` +
        `❌ Trip details\n` +
        `❌ All members\n` +
        `❌ All messages\n` +
        `❌ All expenses\n` +
        `❌ All memories/photos\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Are you absolutely sure?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Double confirmation for safety
    const reason = prompt('Reason for deletion (optional but recommended):');
    if (reason === null) return; // User cancelled
    
    try {
        // Delete the trip document
        await deleteDoc(doc(db, "trips", tripId));
        
        // Note: Subcollections (messages, expenses, memories) 
        // will be auto-cleaned by Firebase eventually
        
        alert(`🗑️ Trip "${tripName}" deleted successfully!\n\nReason: ${reason || 'No reason provided'}`);
        
        // Reload trips
        loadAllTrips();
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('❌ Failed to delete trip. Try again!');
    }
};

console.log('🗑️ Admin Trip Delete System Loaded!');

// ============================
// APPROVE TRIP
// ============================
window.approveTrip = async function(tripId) {
    if (!confirm('Approve this trip? It will be visible to all users.')) return;
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        await setDoc(tripRef, {
            ...tripData,
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: currentAdmin.email
        }, { merge: true });
        
        alert('✅ Trip approved! It\'s now visible to all users.');
        loadAllTrips();
        
    } catch (error) {
        console.error('Approval error:', error);
        alert('❌ Failed to approve trip.');
    }
};

// ============================
// REJECT TRIP
// ============================
window.rejectTrip = async function(tripId) {
    const reason = prompt('Why are you rejecting this trip? (Optional)');
    if (reason === null) return; // User cancelled
    
    try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        const tripData = tripSnap.data();
        
        await setDoc(tripRef, {
            ...tripData,
            status: 'rejected',
            rejectedAt: new Date(),
            rejectedBy: currentAdmin.email,
            rejectionReason: reason || 'No reason provided'
        }, { merge: true });
        
        alert('❌ Trip rejected.');
        loadAllTrips();
        
    } catch (error) {
        console.error('Rejection error:', error);
        alert('Failed to reject trip.');
    }
};

// ============================
// UPDATE STATISTICS
// ============================
function updateStats() {
    const total = allUsers.length;
    const verified = allUsers.filter(u => u.verified).length;
    const pending = allUsers.filter(u => !u.verified).length;
    const admins = allUsers.filter(u => u.role === 'super_admin' || u.role === 'admin').length;
    
    // Quick stats on pending page
    document.getElementById('totalPending').textContent = pending;
    document.getElementById('totalApproved').textContent = verified;
    document.getElementById('totalUsersStat').textContent = total;
    document.getElementById('pendingBadge').textContent = pending;
    
    // Big stats on stats page
    document.getElementById('bigStatUsers').textContent = total;
    document.getElementById('bigStatVerified').textContent = verified;
    document.getElementById('bigStatPending').textContent = pending;
    document.getElementById('bigStatAdmins').textContent = admins;
}

// ============================
// DISPLAY PENDING USERS
// ============================
function displayPendingUsers() {
    const container = document.getElementById('pendingUsersList');
    const pendingUsers = allUsers.filter(u => !u.verified);
    
    if (pendingUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Caught Up! 🎉</h3>
                <p>No pending users. Everyone is approved!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pendingUsers.map(user => createUserCard(user, true)).join('');
}

// ============================
// DISPLAY ALL USERS
// ============================
function displayAllUsers() {
    const container = document.getElementById('allUsersList');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <i class="fas fa-users-slash"></i>
                <h3>No Users Yet</h3>
                <p>Users will appear here as they sign up.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allUsers.map(user => createUserCard(user, false)).join('');
}

// ============================
// CREATE USER CARD HTML
// ============================
function createUserCard(user, isPending) {
    const initial = (user.fullName || 'U')[0].toUpperCase();
    const verifiedBadge = user.verified 
        ? '<span class="status-badge verified">✓ Verified</span>' 
        : '<span class="status-badge pending">⏳ Pending</span>';
    
    const roleBadge = (user.role === 'super_admin' || user.role === 'admin')
        ? '<span class="role-badge admin-role">👑 Admin</span>'
        : '<span class="role-badge user-role">User</span>';
    
    const actions = isPending 
        ? `
            <button class="btn-approve" onclick="approveUser('${user.uid}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" onclick="rejectUser('${user.uid}')">
                <i class="fas fa-times"></i> Reject
            </button>
          `
        : `
            <button class="btn-view" onclick="viewUserDetails('${user.uid}')">
                <i class="fas fa-eye"></i> View
            </button>
            ${user.verified 
                ? `<button class="btn-reject" onclick="blockUser('${user.uid}')">
                    <i class="fas fa-ban"></i> Block
                   </button>`
                : `<button class="btn-approve" onclick="approveUser('${user.uid}')">
                    <i class="fas fa-check"></i> Approve
                   </button>`
            }
          `;
    
    return `
        <div class="user-card">
            <div class="user-card-avatar">${initial}</div>
            <div class="user-card-info">
                <h3>
                    ${user.fullName || 'No Name'}
                    ${roleBadge}
                    ${verifiedBadge}
                </h3>
                <div class="user-card-meta">
                    <span><i class="fas fa-envelope"></i> ${user.email || 'No email'}</span>
                    <span><i class="fas fa-phone"></i> ${user.phone || 'No phone'}</span>
                    <span><i class="fas fa-university"></i> ${user.college || 'No college'}</span>
                </div>
            </div>
            <div class="user-card-actions">
                ${actions}
            </div>
        </div>
    `;
}

// ============================
// DISPLAY ADMIN TEAM
// ============================
function displayAdminTeam() {
    const container = document.getElementById('adminTeamList');
    const admins = allUsers.filter(u => u.role === 'super_admin' || u.role === 'admin');
    
    if (admins.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No admins yet.</p>';
        return;
    }
    
    container.innerHTML = admins.map(admin => `
        <div class="admin-team-item">
            <div class="user-card-avatar">${(admin.fullName || 'A')[0].toUpperCase()}</div>
            <div>
                <strong>${admin.fullName}</strong>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">${admin.email}</p>
            </div>
            <span class="role-badge admin-role" style="margin-left: auto;">👑 Admin</span>
        </div>
    `).join('');
}

// ============================
// APPROVE USER
// ============================
window.approveUser = async function(uid) {
    if (!confirm('Approve this user? They will be able to login.')) return;
    
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        await setDoc(userRef, {
            ...userData,
            verified: true,
            verifiedAt: new Date(),
            verifiedBy: currentAdmin.email
        }, { merge: true });
        
        alert(`✅ User approved successfully!`);
        loadAllUsers(); // Refresh list
        
    } catch (error) {
        console.error('Approval error:', error);
        alert('❌ Failed to approve user.');
    }
};

// ============================
// REJECT USER
// ============================
window.rejectUser = async function(uid) {
    if (!confirm('Reject this user? They will not be able to login.')) return;
    
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        await setDoc(userRef, {
            ...userData,
            verified: false,
            rejected: true,
            rejectedAt: new Date(),
            rejectedBy: currentAdmin.email
        }, { merge: true });
        
        alert(`❌ User rejected.`);
        loadAllUsers();
        
    } catch (error) {
        console.error('Rejection error:', error);
        alert('Failed to reject user.');
    }
};

// ============================
// BLOCK USER
// ============================
window.blockUser = async function(uid) {
    if (uid === currentAdmin.uid) {
        alert('❌ You cannot block yourself!');
        return;
    }
    
    if (!confirm('Block this user? They will lose access.')) return;
    
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        await setDoc(userRef, {
            ...userData,
            verified: false,
            blocked: true,
            blockedAt: new Date(),
            blockedBy: currentAdmin.email
        }, { merge: true });
        
        alert('🚫 User blocked.');
        loadAllUsers();
        
    } catch (error) {
        console.error('Block error:', error);
        alert('Failed to block user.');
    }
};

// ============================
// VIEW USER DETAILS
// ============================
window.viewUserDetails = function(uid) {
    const user = allUsers.find(u => u.uid === uid);
    if (!user) return;
    
    alert(
        `👤 USER DETAILS\n\n` +
        `Name: ${user.fullName || '-'}\n` +
        `Email: ${user.email || '-'}\n` +
        `Phone: ${user.phone || '-'}\n` +
        `College: ${user.college || '-'}\n` +
        `Role: ${user.role || 'user'}\n` +
        `Verified: ${user.verified ? 'Yes ✅' : 'No ❌'}\n` +
        `Invite Code: ${user.inviteCode || '-'}\n` +
        `Trips Joined: ${user.tripsJoined || 0}\n` +
        `Trips Created: ${user.tripsCreated || 0}`
    );
};

// ============================
// SEARCH & FILTER
// ============================
const searchInput = document.getElementById('userSearch');
const filterRole = document.getElementById('filterRole');
const filterStatus = document.getElementById('filterStatus');

if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
}
if (filterRole) {
    filterRole.addEventListener('change', filterUsers);
}
if (filterStatus) {
    filterStatus.addEventListener('change', filterUsers);
}

function filterUsers() {
    const search = searchInput.value.toLowerCase();
    const role = filterRole.value;
    const status = filterStatus.value;
    
    let filtered = allUsers;
    
    if (search) {
        filtered = filtered.filter(u => 
            (u.fullName || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search)
        );
    }
    
    if (role !== 'all') {
        filtered = filtered.filter(u => u.role === role);
    }
    
    if (status === 'verified') {
        filtered = filtered.filter(u => u.verified);
    } else if (status === 'unverified') {
        filtered = filtered.filter(u => !u.verified);
    }
    
    const container = document.getElementById('allUsersList');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-admin-state">
                <i class="fas fa-search"></i>
                <h3>No Results</h3>
                <p>No users match your filters.</p>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map(user => createUserCard(user, false)).join('');
    }
}

// ============================
// PAGE NAVIGATION
// ============================
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageName}`)?.classList.add('active');
    
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) item.classList.add('active');
    });
    
    document.getElementById('sidebar')?.classList.remove('open');
}

window.showPage = showPage;

// SETUP NAVIGATION
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(item.dataset.page);
        });
    });
    
    // Menu toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Logout from admin panel?')) {
            await signOut(auth);
            window.location.href = 'index.html';
        }
    });
});

console.log('👑 Admin Panel Loaded!');