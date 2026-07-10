const USERS_JSON_PATH = 'database/users/users.json';
const SESSION_COOKIE_NAME = 'studyapp_session';
const SESSION_COOKIE_DAYS = 30;

const FALLBACK_USERS_DB = {
  users: [
    { id: 'user1', username: 'knight', name: 'Study Knight', joinedDate: '2026-06-21', active: true },
    { id: 'user2', username: 'hydra', name: 'Hydra', joinedDate: '2026-06-21', active: true },
    { id: 'user3', username: 'sia', name: 'Sia Study', joinedDate: '2026-06-27', active: true }
  ]
};

let usersDB = { users: [] };
let currentUserId = null;

// DOM Selectors
const userSelectScreen = document.getElementById('userSelectScreen');
const userSelectList   = document.getElementById('userSelectList');
const appRoot          = document.getElementById('appRoot');
const topbarRow        = document.getElementById('topbarRow');
const profileSwitch    = document.getElementById('profileSwitch');
const psMain           = document.getElementById('psMain');
const psDropdown       = document.getElementById('psDropdown');
const psAvatar         = document.getElementById('psAvatar');
const psName           = document.getElementById('psName');
const psUsername       = document.getElementById('psUsername');
const addBtn           = document.getElementById('addBtn');
const navBtns          = document.querySelectorAll('.nav-btn');
const pages            = document.querySelectorAll('.page');

// Cookie Handlers
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function readSession() {
  const raw = getCookie(SESSION_COOKIE_NAME);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function saveSession(userId) {
  const user = findUser(userId);
  if (!user) return;
  const payload = {
    userId: user.id,
    username: user.username,
    lastLogin: new Date().toISOString()
  };
  setCookie(SESSION_COOKIE_NAME, JSON.stringify(payload), SESSION_COOKIE_DAYS);
}

// Data Resolvers
function findUser(id) {
  return usersDB.users.find(u => u.id === id) || null;
}

function activeUsers() {
  return usersDB.users.filter(u => u.active !== false);
}

function initial(name) {
  return (name || '').trim().charAt(0).toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function formatJoined(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

async function loadUsersDB() {
  try {
    const res = await fetch(USERS_JSON_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error('Status: ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('Using local configuration context fallback registry', err);
    return FALLBACK_USERS_DB;
  }
}

// User Selection View Manager
function renderUserSelectList() {
  const session = readSession();
  const list = activeUsers();
  userSelectList.innerHTML = '';

  if (list.length === 0) {
    userSelectList.innerHTML = '<div class="user-select-empty">No users found in database.</div>';
    return;
  }

  list.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-select-card';
    const lastUsedBadge = (session && session.userId === u.id) ? '<div class="user-select-badge">Last used</div>' : '';

    card.innerHTML = `
      <div class="ps-avatar">${escapeHtml(initial(u.name))}</div>
      <div class="user-select-text">
        <div class="user-select-name">${escapeHtml(u.name)}</div>
        <div class="user-select-username">@${escapeHtml(u.username)}</div>
        <div class="user-select-joined">Joined ${escapeHtml(formatJoined(u.joinedDate))}</div>
        ${lastUsedBadge}
      </div>
      <div class="user-select-enter" aria-label="Enter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
      </div>`;

    card.addEventListener('click', () => enterApp(u.id));
    userSelectList.appendChild(card);
  });
}

function enterApp(userId) {
  currentUserId = userId;
  saveSession(userId);
  renderProfileSwitch();

  const user = findUser(userId);
  if (user && typeof window.loadUserProfileData === 'function') {
    window.loadUserProfileData(user.username);
  }

  userSelectScreen.classList.add('hidden');
  appRoot.classList.remove('hidden');
}

// Account Switcher Interface Components
function renderProfileSwitch() {
  const cur = findUser(currentUserId);
  if (!cur) return;

  psAvatar.textContent = initial(cur.name);
  psName.textContent = cur.name;
  psUsername.textContent = '@' + cur.username;
  renderDropdownList();
}

function renderDropdownList() {
  const others = activeUsers().filter(u => u.id !== currentUserId);
  psDropdown.innerHTML = '';

  if (others.length === 0) {
    psDropdown.innerHTML = '<div class="ps-dropdown-empty">No other accounts available.</div>';
    return;
  }

  others.forEach(u => {
    const row = document.createElement('div');
    row.className = 'ps-dropdown-row';
    row.innerHTML = `
      <div class="ps-avatar">${escapeHtml(initial(u.name))}</div>
      <div class="ps-text">
        <div class="ps-name">${escapeHtml(u.name)}</div>
        <div class="ps-username">@${escapeHtml(u.username)}</div>
      </div>
      <div class="ps-switch-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/></svg>
      </div>`;

    row.addEventListener('click', () => handleUserSwitch(u.id));
    psDropdown.appendChild(row);
  });
}

function setExpanded(expanded) {
  profileSwitch.classList.toggle('expanded', expanded);
  topbarRow.classList.toggle('expanded', expanded);
  psDropdown.classList.toggle('open', expanded);
}

psMain.addEventListener('click', () => setExpanded(!profileSwitch.classList.contains('expanded')));

function handleUserSwitch(nextUserId) {
  currentUserId = nextUserId;
  saveSession(nextUserId);
  renderProfileSwitch();
  setExpanded(false);

  const nextUser = findUser(nextUserId);
  if (nextUser && typeof window.loadUserProfileData === 'function') {
    window.loadUserProfileData(nextUser.username);
  }
}

document.addEventListener('click', (e) => {
  if (!profileSwitch.contains(e.target) && profileSwitch.classList.contains('expanded')) {
    setExpanded(false);
  }
});

addBtn.addEventListener('click', () => console.log('Add button tapped'));

// Shell Page Routing Context Execution
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.page;
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + target).classList.add('active');
    setExpanded(false);
  });
});

// App Entry Point Initial Orchestrator
(async function init() {
  // 1. Core data dependencies fetched first
  usersDB = await loadUsersDB();
  
  // 2. Validate current state tokens
  const savedSession = readSession();

  // 3. Render and unhide the correct UI context matching existence criteria
  if (savedSession && savedSession.userId && findUser(savedSession.userId)) {
    currentUserId = savedSession.userId;
    renderProfileSwitch();

    const user = findUser(savedSession.userId);
    if (user && typeof window.loadUserProfileData === 'function') {
      window.loadUserProfileData(user.username);
    }

    appRoot.classList.remove('hidden');
  } else {
    renderUserSelectList();
    userSelectScreen.classList.remove('hidden');
  }
})();
      
