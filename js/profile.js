// Scope isolated strictly to profile layout features
(function() {
  const PROFILE_ICONS = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V10M12 19V5M20 19v-7"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4.5-4.5"/></rect></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-2 4.5-2 7a4 4 0 1 0 8 0c0-1-.3-2-1-3 2 1 4 3.5 4 7a7 7 0 1 1-14 0c0-4 2-6 5-11z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 4H5a3 3 0 0 0 3 5M16 4h3a3 3 0 0 1-3 5"/><path d="M12 13v3M9 20h6M10 16.5h4v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.6 5.7 20.8l1.7-6.9L2 9.2l7.1-.6L12 2z"/></svg>'
  };

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getInitial(name) {
    return (name || '').trim().charAt(0).toUpperCase();
  }

  // Globally accessible callback to handle component loads
  window.loadUserProfileData = async function(username) {
    try {
      const res = await fetch(`database/profiles/${username}.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Profile target data could not be fetched for ${username}`);
      const userData = await res.json();
      renderUserProfile(userData);
    } catch (err) {
      console.error('Profile View Engine Failure:', err);
    }
  };

  function renderUserProfile(userData) {
    document.getElementById('avatarLetter').textContent = getInitial(userData.name);
    document.getElementById('profileName').textContent = userData.name;
    document.getElementById('profileUsername').textContent = '@' + userData.username;
    document.getElementById('streakText').textContent = userData.overview.currentStreak + ' day streak';

    const pct = Math.min(100, Math.round((userData.overview.currentStreak / 10) * 100));
    document.getElementById('avatarRing').style.setProperty('--streak-pct', pct + '%');

    // Build Overview Panels HTML
    const ov = userData.overview;
    const overviewItems = [
      { icon: 'clock',    color: 'mint',  value: ov.totalHours + ' hrs', title: 'Total Hours' },
      { icon: 'chart',    color: 'sky',   value: ov.dailyAverage + ' hrs', title: 'Daily Average' },
      { icon: 'calendar', color: 'amber', value: ov.completedDays, title: 'Completed Days' },
      { icon: 'flame',    color: 'coral', value: ov.currentStreak + ' days', title: 'Current Streak' }
    ];

    document.getElementById('overviewGrid').innerHTML = overviewItems.map(item => `
      <div class="stat-card">
        <div class="stat-icon ${item.color}">${PROFILE_ICONS[item.icon]}</div>
        <div class="stat-value">${item.value}</div>
        <div class="stat-title">${item.title}</div>
      </div>
    `).join('');

    // Build Records Panels HTML
    const pr = userData.personalRecords;
    const recordItems = [
      { icon: 'flame',   color: 'coral', value: pr.longestStreak.value + ' days', title: 'Longest Streak', date: pr.longestStreak.date },
      { icon: 'star',    color: 'amber', value: pr.perfectDays.value, title: 'Perfect Days', date: pr.perfectDays.date },
      { icon: 'trophy',  color: 'mint',  value: pr.bestStudyDay.hours + ' hrs', title: 'Best Study Day', date: pr.bestStudyDay.date }
    ];

    document.getElementById('recordsGrid').innerHTML = recordItems.map(item => `
      <div class="record-card">
        <div class="record-icon ${item.color}">${PROFILE_ICONS[item.icon]}</div>
        <div class="record-body">
          <div class="record-value">${item.value}</div>
          <div class="record-title">${item.title}</div>
        </div>
        <div class="record-date">${formatDate(item.date)}</div>
      </div>
    `).join('');
  }

  // Bind Switch Event Sub-handlers
  document.querySelectorAll('.profile-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('ppanel-' + btn.dataset.ptab).classList.add('active');
    });
  });
})();

