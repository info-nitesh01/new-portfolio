/* ========================================
   Admin Dashboard — JavaScript
   ======================================== */

// --- State ---
let currentTab = 'profile';

// --- Helpers ---
const LOADER_SVG = '<svg viewBox="0 0 100 100"><line class="bracket-seg seg-1" x1="35" y1="20" x2="10" y2="50"/><line class="bracket-seg seg-2" x1="10" y1="50" x2="35" y2="80"/><line class="bracket-seg seg-3" x1="65" y1="20" x2="90" y2="50"/><line class="bracket-seg seg-4" x1="90" y1="50" x2="65" y2="80"/></svg>';
const SPINNER = '<svg class="btn-spinner" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
const LOADER = '<div class="code-loader"><p class="text-text-muted text-xs font-mono">Loading...</p></div>';

function btnLoading(btn, text = 'Processing...') {
  btn._origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.classList.add('opacity-70', 'pointer-events-none');
  btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px">${SPINNER}<span>${text}</span></span>`;
}

function btnReset(btn) {
  btn.disabled = false;
  btn.classList.remove('opacity-70', 'pointer-events-none');
  btn.innerHTML = btn._origHTML;
}

// --- Toast ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- Auth ---
document.addEventListener('DOMContentLoaded', async () => {
  // Set login logo from profile (public read, no auth needed)
  fetchProfile().then(function (profile) {
    if (!profile) return;
    var logoHTML = renderLogo(profile, 'h-6');
    var loginLogo = document.getElementById('login-logo');
    if (loginLogo) loginLogo.innerHTML = logoHTML;
    var forgotLogo = document.getElementById('forgot-logo');
    if (forgotLogo) forgotLogo.innerHTML = logoHTML;
    var resetLogo = document.getElementById('reset-logo');
    if (resetLogo) resetLogo.innerHTML = logoHTML;
  });

  const { data: { session } } = await supabase.auth.getSession();
  // Remove page loader and show correct screen
  var pageLoader = document.getElementById('page-loader');
  if (pageLoader) pageLoader.remove();

  // Detect password recovery from URL hash (type=recovery) or auth event
  var isRecovery = window.location.hash.indexOf('type=recovery') !== -1;

  function showResetScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('forgot-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('reset-screen').classList.remove('hidden');
  }

  supabase.auth.onAuthStateChange(function (event) {
    if (event === 'PASSWORD_RECOVERY') {
      isRecovery = true;
      showResetScreen();
    }
  });

  if (isRecovery) {
    showResetScreen();
  } else if (session) {
    showDashboard();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
  }

  // Reset password form (set new password)
  document.getElementById('reset-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    var password = document.getElementById('reset-password').value;
    var confirm = document.getElementById('reset-password-confirm').value;
    var errorEl = document.getElementById('reset-error');
    var successEl = document.getElementById('reset-success');
    errorEl.classList.add('hidden');

    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.classList.remove('hidden');
      return;
    }

    btnLoading(btn, 'Updating...');
    var { error } = await supabase.auth.updateUser({ password: password });
    btnReset(btn);
    if (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
      return;
    }
    document.getElementById('reset-form').classList.add('hidden');
    successEl.classList.remove('hidden');
    setTimeout(function () {
      document.getElementById('reset-screen').classList.add('hidden');
      showDashboard();
      showToast('Password updated successfully!');
    }, 1500);
  });

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('hidden');

    btnLoading(btn, 'Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      btnReset(btn);
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
      return;
    }
    btnReset(btn);
    showDashboard();
    showToast('Signed in successfully!');
  });

  // Forgot password
  document.getElementById('forgot-link').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('forgot-screen').classList.remove('hidden');
    document.getElementById('forgot-email').value = document.getElementById('login-email').value;
  });

  document.getElementById('back-to-login').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('forgot-screen').classList.add('hidden');
    document.getElementById('forgot-form').classList.remove('hidden');
    document.getElementById('forgot-success').classList.add('hidden');
    document.getElementById('forgot-error').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
  });

  document.getElementById('forgot-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button[type="submit"]');
    var email = document.getElementById('forgot-email').value;
    var errorEl = document.getElementById('forgot-error');
    var successEl = document.getElementById('forgot-success');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    btnLoading(btn, 'Sending...');
    var redirectUrl = window.location.origin + window.location.pathname;
    var { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    btnReset(btn);
    if (error) {
      errorEl.textContent = error.message;
      errorEl.classList.remove('hidden');
      return;
    }
    document.getElementById('forgot-form').classList.add('hidden');
    successEl.classList.remove('hidden');
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm';
    modal.innerHTML = '<div class="bg-surface-card border border-border rounded-xl p-5 w-full max-w-xs mx-4 text-center">'
      + '<p class="text-white text-sm font-medium mb-1">Sign out?</p>'
      + '<p class="text-text-muted text-xs mb-4">You will need to sign in again.</p>'
      + '<div class="flex gap-2">'
      + '<button id="logout-cancel" class="flex-1 py-2 rounded-lg text-xs font-medium text-text-secondary bg-surface-hover hover:bg-border transition-colors">Cancel</button>'
      + '<button id="logout-confirm" class="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">Sign Out</button>'
      + '</div></div>';
    document.body.appendChild(modal);
    document.getElementById('logout-cancel').onclick = function() { modal.remove(); };
    document.getElementById('logout-confirm').onclick = async function() {
      var btn = this;
      btnLoading(btn, 'Signing out...');
      await supabase.auth.signOut();
      modal.remove();
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      showToast('Signed out successfully!');
    };
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
  });

  // Sidebar tabs
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      location.hash = currentTab;
      loadTab(currentTab);
    });
  });

  // Sidebar toggle — collapse/expand on all viewports
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    const sidebar = document.getElementById('admin-sidebar');
    sidebar.classList.toggle('collapsed');
    try { localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed')); } catch (e) {}
  });
});

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  // Apply site name and logo to admin UI
  fetchSiteMetadata().then(function (meta) {
    if (meta && meta.site_name) document.title = 'Admin | ' + meta.site_name;
  });
  fetchProfile().then(function (profile) {
    if (!profile) return;
    var loginLogo = document.getElementById('login-logo');
    var adminLogo = document.getElementById('admin-logo');
    if (loginLogo) loginLogo.innerHTML = renderLogo(profile, 'h-6');
    if (adminLogo) adminLogo.innerHTML = renderLogo(profile, 'h-5');
  });

  // Restore sidebar collapsed state (default collapsed on small screens)
  var sidebar = document.getElementById('admin-sidebar');
  var savedCollapsed = null;
  try { savedCollapsed = localStorage.getItem('sidebarCollapsed'); } catch (e) {}
  if (savedCollapsed === 'true' || (savedCollapsed === null && window.innerWidth < 768)) {
    sidebar.classList.add('collapsed');
  }

  // Read tab from URL hash or default to 'profile'
  const hashTab = location.hash.replace('#', '');
  const validTabs = Array.from(document.querySelectorAll('[data-tab]')).map(b => b.dataset.tab);
  const startTab = validTabs.includes(hashTab) ? hashTab : 'profile';
  currentTab = startTab;
  if (startTab !== 'profile') location.hash = startTab;

  // Highlight the active sidebar button
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === startTab));
  loadTab(startTab);

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const tab = location.hash.replace('#', '');
    if (validTabs.includes(tab) && tab !== currentTab) {
      currentTab = tab;
      document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      loadTab(tab);
    }
  });
}

// --- Tab Router ---
function loadTab(tab) {
  const content = document.getElementById('admin-content');
  content.innerHTML = LOADER;

  switch (tab) {
    case 'profile': loadProfileTab(); break;
    case 'services': loadCrudTab('services', serviceFields()); break;
    case 'projects': loadCrudTab('projects', projectFields()); break;
    case 'skills': loadCrudTab('skills', skillFields()); break;
    case 'tools': loadCrudTab('tools', toolFields()); break;
    case 'experience': loadCrudTab('experience', experienceFields()); break;
    case 'education': loadCrudTab('education', educationFields()); break;
    case 'certifications': loadCrudTab('certifications', certificationFields()); break;
    case 'social': loadCrudTab('social_links', socialFields()); break;
    case 'metadata': loadMetadataTab(); break;
  }
}

// ========================================
// PROFILE TAB (singleton — always edit mode)
// ========================================
async function loadProfileTab() {
  const content = document.getElementById('admin-content');
  const { data: profile, error } = await supabase.from('profile').select('*').limit(1).single();

  if (error) {
    content.innerHTML = `<div class="text-red-500">Error loading profile: ${error.message}</div>`;
    return;
  }

  content.innerHTML = `
    <div>
      <h2 class="font-display text-2xl text-white uppercase mb-6">Edit <span class="gradient-text-orange">Profile</span></h2>
      <form id="profile-form" class="admin-form space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label>Hero Name Line 1</label><input name="hero_heading_line1" value="${esc(profile.hero_heading_line1)}" placeholder="First name" /></div>
          <div><label>Hero Name Line 2</label><input name="hero_heading_line2" value="${esc(profile.hero_heading_line2)}" placeholder="Last name (gradient)" /></div>
          <div><label>Title</label><input name="title" value="${esc(profile.title)}" /></div>
          <div><label>Logo Text</label><input name="logo_text" value="${esc(profile.logo_text)}" placeholder="JD" /></div>
          <div class="sm:col-span-2 lg:col-span-3">
            <label>Logo SVG <span class="text-text-muted font-normal">(paste SVG code — color adapts to accent color)</span></label>
            <div class="flex gap-3 items-start">
              <div id="logo-svg-preview" class="w-10 h-10 rounded border border-border flex items-center justify-center flex-shrink-0 bg-surface">${profile.logo_svg ? '<span class="logo-svg h-6">' + profile.logo_svg + '</span>' : '<span class="text-text-muted text-xs">—</span>'}</div>
              <textarea name="logo_svg" rows="3" class="flex-1 font-mono text-xs" placeholder='<svg viewBox="0 0 24 24">...</svg>'>${esc(profile.logo_svg || '')}</textarea>
            </div>
          </div>
          <div><label>Email</label><input name="email" type="email" value="${esc(profile.email)}" /></div>
          <div><label>Phone</label><input name="phone" value="${esc(profile.phone || '')}" /></div>
          <div><label>Location City</label><input name="location_city" value="${esc(profile.location_city)}" /></div>
          <div><label>Location Region</label><input name="location_region" value="${esc(profile.location_region)}" /></div>
        </div>
        <div>
          <label>Typing Roles (comma-separated)</label>
          <input name="typing_roles" value="${esc((profile.typing_roles || []).join(', '))}" placeholder="Frontend Developer, React.js Developer" />
        </div>

        <h3 class="admin-section-title">About</h3>
        <div><label>Short Bio</label><textarea name="bio_short" rows="2">${esc(profile.bio_short || '')}</textarea></div>
        <div><label>About Heading</label><input name="about_heading" value="${esc(profile.about_heading || '')}" /></div>
        <div>
          <label>Bio Paragraphs (one per line)</label>
          <textarea name="bio_paragraphs" rows="6">${esc((profile.bio_paragraphs || []).join('\n'))}</textarea>
        </div>

        <h3 class="admin-section-title">Resume Summary</h3>
        <div><label>Summary Title</label><input name="summary_title" value="${esc(profile.summary_title || '')}" /></div>
        <div><label>Summary Text</label><textarea name="summary_text" rows="4">${esc(profile.summary_text || '')}</textarea></div>

        <h3 class="admin-section-title">Stats</h3>
        <div class="grid grid-cols-3 gap-4">
          <div><label>Years Experience</label><input name="years_experience" type="number" value="${profile.years_experience || 0}" /></div>
          <div><label>Projects Completed</label><input name="projects_completed" type="number" value="${profile.projects_completed || 0}" /></div>
          <div><label>Happy Clients</label><input name="happy_clients" type="number" value="${profile.happy_clients || 0}" /></div>
        </div>

        <h3 class="admin-section-title">Availability</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div><label>Availability Status</label><input name="availability_status" value="${esc(profile.availability_status || '')}" /></div>
          <div class="flex items-end gap-3 pb-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="availability_open" ${profile.availability_open ? 'checked' : ''} class="w-4 h-4 accent-accent-orange" />
              <span class="text-text-secondary text-sm">Open for opportunities</span>
            </label>
          </div>
        </div>

        <h3 class="admin-section-title">Media</h3>
        <div>
          <label>Profile Image</label>
          <div class="flex gap-2 items-center">
            ${profile.profile_image_url ? `<img src="${profile.profile_image_url}" alt="Profile" class="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0" />` : ''}
            <div class="flex-1"><input name="profile_image_url" value="${esc(profile.profile_image_url || '')}" placeholder="Paste URL or upload file..." /></div>
            <label class="admin-btn admin-btn-secondary text-xs cursor-pointer flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload
              <input type="file" id="profile-image-upload" accept="image/*" class="hidden" />
            </label>
          </div>
        </div>
        <div>
          <label>Resume PDF</label>
          <div class="flex gap-2 items-center">
            <div class="flex-1"><input name="resume_file_url" value="${esc(profile.resume_file_url || '')}" placeholder="Paste URL or upload file..." /></div>
            <label class="admin-btn admin-btn-secondary text-xs cursor-pointer flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload
              <input type="file" id="resume-file-upload" accept=".pdf" class="hidden" />
            </label>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="submit" class="admin-btn admin-btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            Save Profile
          </button>
        </div>
      </form>
    </div>
  `;

  // Logo SVG live preview
  document.querySelector('textarea[name="logo_svg"]').addEventListener('input', function () {
    var preview = document.getElementById('logo-svg-preview');
    var val = this.value.trim();
    if (val && val.indexOf('<svg') !== -1) {
      preview.innerHTML = '<span class="logo-svg h-6">' + val + '</span>';
    } else {
      preview.innerHTML = '<span class="text-text-muted text-xs">—</span>';
    }
  });

  // Profile image upload
  document.getElementById('profile-image-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadBtn = e.target.closest('label');
    try {
      btnLoading(uploadBtn, 'Uploading...');
      const url = await uploadFile(file, 'profile');
      document.querySelector('input[name="profile_image_url"]').value = url;
      showToast('Image uploaded!');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      btnReset(uploadBtn);
    }
  });

  // Resume PDF upload
  document.getElementById('resume-file-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadBtn = e.target.closest('label');
    try {
      btnLoading(uploadBtn, 'Uploading...');
      const url = await uploadFile(file, 'resume');
      document.querySelector('input[name="resume_file_url"]').value = url;
      showToast('File uploaded!');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    } finally {
      btnReset(uploadBtn);
    }
  });

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const fd = new FormData(e.target);
    const updates = Object.fromEntries(fd.entries());

    // Parse special fields
    updates.typing_roles = updates.typing_roles ? updates.typing_roles.split(',').map(s => s.trim()).filter(Boolean) : [];
    updates.bio_paragraphs = updates.bio_paragraphs ? updates.bio_paragraphs.split('\n').filter(s => s.trim()) : [];
    updates.availability_open = fd.has('availability_open');
    updates.years_experience = parseInt(updates.years_experience) || 0;
    updates.projects_completed = parseInt(updates.projects_completed) || 0;
    updates.happy_clients = parseInt(updates.happy_clients) || 0;

    // Auto-compute name fields from hero headings
    updates.first_name = updates.hero_heading_line1 || '';
    updates.last_name = updates.hero_heading_line2 || '';
    updates.full_name = (updates.first_name + ' ' + updates.last_name).trim();

    btnLoading(btn, 'Saving...');
    const { error } = await supabase.from('profile').update(updates).eq('id', profile.id);
    btnReset(btn);
    if (error) {
      showToast('Error saving profile: ' + error.message, 'error');
    } else {
      showToast('Profile saved successfully!');
    }
  });
}

// ========================================
// GENERIC CRUD TAB
// ========================================
async function loadCrudTab(table, fields) {
  const content = document.getElementById('admin-content');
  const displayName = table.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Fetch items
  const { data: items, error } = await supabase
    .from(table)
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    content.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    return;
  }

  const titleField = fields.find(f => f.isTitle)?.name || fields[0]?.name || 'id';

  content.innerHTML = `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-display text-2xl text-white uppercase"><span class="gradient-text-orange">${displayName}</span></h2>
        <button id="add-new-btn" class="admin-btn admin-btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add New
        </button>
      </div>

      ${items.length === 0 ? `
        <div class="text-center py-16 text-text-muted">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          <p>No ${displayName.toLowerCase()} yet.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xxl:grid-cols-8 gap-2">
          ${items.map((item, idx) => `
            <div class="relative bg-surface-card border border-border rounded-lg px-3 py-2.5 hover:border-border-hover transition-colors flex flex-col">
              <div class="absolute top-1 right-1 flex items-center gap-0.5">
                <button onclick="startEdit('${table}', '${item.id}')" class="p-1 rounded text-text-muted hover:text-white transition-colors" title="Edit"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg></button>
                <button onclick="deleteItem('${table}', '${item.id}', '${esc(item[titleField] || 'this item')}', this)" class="p-1 rounded text-text-muted hover:text-red-400 transition-colors" title="Delete"><svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
              </div>
              <p class="text-white text-xs font-medium truncate pr-10">${esc(item[titleField] || 'Untitled')}</p>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="text-accent-cyan text-[10px] font-mono">#${idx + 1}</span>
                ${item.is_visible !== undefined ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full ${item.is_visible ? 'bg-green-500/10 text-green-500' : 'bg-surface-hover text-text-muted'}">${item.is_visible ? 'Visible' : 'Hidden'}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  document.getElementById('add-new-btn').addEventListener('click', () => {
    loadEditForm(table, fields, 'new');
  });
}

// --- Edit/Add Form (Modal) ---
async function loadEditForm(table, fields, id) {
  const displayName = table.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  let item = {};

  if (id !== 'new') {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) {
      showToast('Error: ' + error.message, 'error');
      return;
    }
    item = data;
  }

  var modal = document.createElement('div');
  modal.className = 'edit-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = '<div class="modal-card bg-surface-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">'
    + '<div class="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">'
    + '<h2 class="font-display text-2xl text-white uppercase">' + (id === 'new' ? 'Add' : 'Edit') + ' <span class="gradient-text-orange">' + displayName.replace(/s$/i, '') + '</span></h2>'
    + '<button id="modal-close" class="p-1 rounded text-text-muted hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>'
    + '</div>'
    + '<form id="edit-form" class="admin-form flex flex-col flex-1 min-h-0">'
    + '<div class="space-y-4 p-5 overflow-y-auto flex-1">'
    + fields.map(f => renderField(f, item)).join('')
    + '</div>'
    + '<div class="flex gap-3 px-5 py-3 border-t border-border flex-shrink-0 justify-end">'
    + '<button type="submit" class="admin-btn admin-btn-primary"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>' + (id === 'new' ? 'Create' : 'Save Changes') + '</button>'
    + '<button type="button" id="cancel-btn" class="admin-btn admin-btn-secondary">Cancel</button>'
    + '</div>'
    + '</form>'
    + '</div>';
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('active'));

  function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 200);
  }

  modal.querySelector('#modal-close').addEventListener('click', closeModal);
  modal.querySelector('#cancel-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });

  attachUploadHandlers('projects');

  modal.querySelector('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const fd = new FormData(e.target);
    const data = {};

    fields.forEach(f => {
      if (f.type === 'checkbox') {
        data[f.name] = fd.has(f.name);
      } else if (f.type === 'number') {
        data[f.name] = parseFloat(fd.get(f.name)) || 0;
      } else if (f.type === 'json-array') {
        const val = fd.get(f.name) || '';
        data[f.name] = val.split(',').map(s => s.trim()).filter(Boolean);
      } else if (f.type === 'textarea-lines') {
        const val = fd.get(f.name) || '';
        data[f.name] = val.split('\n').filter(s => s.trim());
      } else {
        data[f.name] = fd.get(f.name) || '';
      }
    });

    btnLoading(btn, id === 'new' ? 'Creating...' : 'Saving...');
    let error;
    if (id === 'new') {
      ({ error } = await supabase.from(table).insert([data]));
    } else {
      ({ error } = await supabase.from(table).update(data).eq('id', id));
    }
    btnReset(btn);

    if (error) {
      showToast('Error: ' + error.message, 'error');
    } else {
      showToast(id === 'new' ? 'Created successfully!' : 'Saved successfully!');
      closeModal();
      loadTab(currentTab);
    }
  });
}

function renderField(f, item) {
  const val = item[f.name];

  if (f.type === 'checkbox') {
    return '<label class="inline-flex items-center gap-2 cursor-pointer mb-5"><input type="checkbox" name="' + f.name + '" ' + (val ? 'checked' : '') + ' class="w-fit h-4 accent-accent-orange flex-shrink-0" /><span class="text-sm text-text-secondary">' + f.label + '</span></label>';
  }

  if (f.type === 'select') {
    return `
      <div>
        <label>${f.label}</label>
        <select name="${f.name}">
          ${f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>`;
  }

  if (f.type === 'textarea' || f.type === 'textarea-lines') {
    const display = f.type === 'textarea-lines' ? (val || []).join('\n') : (val || '');
    return `
      <div>
        <label>${f.label}${f.hint ? ` <span class="text-text-muted font-normal normal-case tracking-normal">(${f.hint})</span>` : ''}</label>
        <textarea name="${f.name}" rows="${f.rows || 3}">${esc(display)}</textarea>
      </div>`;
  }

  if (f.type === 'image-upload') {
    return `
      <div>
        <label>${f.label}</label>
        <div class="flex gap-2 items-center">
          ${val ? `<img src="${val}" alt="" class="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0" />` : ''}
          <div class="flex-1"><input name="${f.name}" value="${esc(val || '')}" placeholder="${f.placeholder || 'Paste URL or upload...'}" /></div>
          <label class="admin-btn admin-btn-secondary text-xs cursor-pointer flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            Upload
            <input type="file" data-upload-for="${f.name}" accept="image/*" class="hidden" />
          </label>
        </div>
      </div>`;
  }

  if (f.type === 'json-array') {
    const display = (val || []).join(', ');
    return `
      <div>
        <label>${f.label} <span class="text-text-muted font-normal normal-case tracking-normal">(comma-separated)</span></label>
        <input name="${f.name}" value="${esc(display)}" />
      </div>`;
  }

  // Default: text/number/email/url
  return `
    <div>
      <label>${f.label}</label>
      <input type="${f.type || 'text'}" name="${f.name}" value="${esc(val != null ? val : (f.default || ''))}" ${f.placeholder ? `placeholder="${f.placeholder}"` : ''} />
    </div>`;
}

// --- Delete ---
function deleteItem(table, id, name) {
  var modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm';
  modal.innerHTML = '<div class="bg-surface-card border border-border rounded-xl p-5 w-full max-w-xs mx-4 text-center">'
    + '<p class="text-white text-sm font-medium mb-1">Delete "' + esc(name) + '"?</p>'
    + '<p class="text-text-muted text-xs mb-4">This cannot be undone.</p>'
    + '<div class="flex gap-2">'
    + '<button id="delete-cancel" class="flex-1 py-2 rounded-lg text-xs font-medium text-text-secondary bg-surface-hover hover:bg-border transition-colors">Cancel</button>'
    + '<button id="delete-confirm" class="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors">Delete</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  document.getElementById('delete-cancel').onclick = function() { modal.remove(); };
  document.getElementById('delete-confirm').onclick = async function() {
    var btn = this;
    btnLoading(btn, 'Deleting...');
    var { error } = await supabase.from(table).delete().eq('id', id);
    modal.remove();
    if (error) {
      showToast('Error deleting: ' + error.message, 'error');
    } else {
      showToast('Deleted successfully!');
      loadTab(currentTab);
    }
  };
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

// Make globally accessible
window.startEdit = function(table, id) {
  var fieldMap = {
    services: serviceFields, projects: projectFields, skills: skillFields,
    tools: toolFields, experience: experienceFields, education: educationFields,
    certifications: certificationFields, social_links: socialFields
  };
  if (fieldMap[table]) loadEditForm(table, fieldMap[table](), id);
};
window.deleteItem = deleteItem;

// --- File Upload ---
function attachUploadHandlers(folder) {
  document.querySelectorAll('[data-upload-for]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fieldName = input.dataset.uploadFor;
      const uploadBtn = e.target.closest('label');
      try {
        btnLoading(uploadBtn, 'Uploading...');
        const url = await uploadFile(file, folder);
        document.querySelector(`input[name="${fieldName}"]`).value = url;
        showToast('Uploaded!');
      } catch (err) {
        showToast('Upload failed: ' + err.message, 'error');
      } finally {
        btnReset(uploadBtn);
      }
    });
  });
}

async function uploadFile(file, folder) {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('portfolio')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(data.path);
  return urlData.publicUrl;
}

// --- Escape HTML ---
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================================
// FIELD DEFINITIONS
// ========================================

function serviceFields() {
  return [
    { name: 'title', label: 'Title', isTitle: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'icon_svg', label: 'Icon SVG (path content)', type: 'textarea', rows: 2, hint: 'SVG path elements' },
    { name: 'gradient_class', label: 'Gradient Class', type: 'select', options: [
      { value: 'gradient-orange', label: 'Orange Gradient' },
      { value: 'gradient-cyan', label: 'Cyan Gradient' },
      { value: '', label: 'None (outlined)' }
    ]},
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function projectFields() {
  return [
    { name: 'title', label: 'Title', isTitle: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'image_url', label: 'Project Image', type: 'image-upload', placeholder: 'Paste URL or upload...' },
    { name: 'category', label: 'Category', type: 'select', options: [
      { value: 'frontend', label: 'Frontend' },
      { value: 'fullstack', label: 'Full Stack' },
      { value: 'react', label: 'React / Next.js' }
    ]},
    { name: 'project_type', label: 'Project Type', type: 'select', options: [
      { value: 'professional', label: 'Professional' },
      { value: 'practice', label: 'Practice' }
    ]},
    { name: 'tech_tags', label: 'Tech Tags', type: 'json-array' },
    { name: 'live_url', label: 'Live Demo URL', placeholder: 'https://...' },
    { name: 'github_url', label: 'GitHub URL', placeholder: 'https://github.com/...' },
    { name: 'is_featured', label: 'Featured (show on home page)', type: 'checkbox' },
    { name: 'gradient_from', label: 'Gradient From (hex)', placeholder: '#FF5722', default: '#FF5722' },
    { name: 'gradient_to', label: 'Gradient To (hex)', placeholder: '#00B4D8', default: '#00B4D8' },
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function skillFields() {
  return [
    { name: 'name', label: 'Skill Name', isTitle: true },
    { name: 'percentage', label: 'Percentage (0-100)', type: 'number', default: '80' },
    { name: 'category', label: 'Category', placeholder: 'Frontend, Backend, etc.' },
    { name: 'page', label: 'Page', type: 'select', options: [
      { value: 'about', label: 'About Page' },
      { value: 'resume', label: 'Resume Page' }
    ]},
    { name: 'gradient_class', label: 'Gradient Class', type: 'select', options: [
      { value: 'gradient-orange', label: 'Orange Gradient' },
      { value: 'gradient-cyan', label: 'Cyan Gradient' }
    ]},
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function toolFields() {
  return [
    { name: 'name', label: 'Tool Name', isTitle: true },
    { name: 'category', label: 'Category', type: 'select', options: [
      { value: 'Frontend', label: 'Frontend' },
      { value: 'Backend & Database', label: 'Backend & Database' },
      { value: 'Design & DevOps', label: 'Design & DevOps' }
    ]},
    { name: 'icon_svg', label: 'Icon SVG (path content)', type: 'textarea', rows: 2, hint: 'SVG path elements' },
    { name: 'icon_color', label: 'Icon Color Class', placeholder: 'text-accent-orange' },
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function experienceFields() {
  return [
    { name: 'role', label: 'Role / Title', isTitle: true },
    { name: 'company', label: 'Company' },
    { name: 'date_range', label: 'Date Range', placeholder: 'Jan 2022 — Present' },
    { name: 'start_date', label: 'Start Date (for sorting)', type: 'text', placeholder: '2022-01-01' },
    { name: 'achievements', label: 'Achievements', type: 'textarea-lines', rows: 5, hint: 'one per line' },
    { name: 'tech_tags', label: 'Tech Tags', type: 'json-array' },
    { name: 'accent_color', label: 'Accent Color', placeholder: '#FF5722' },
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function educationFields() {
  return [
    { name: 'degree', label: 'Degree / Certificate', isTitle: true },
    { name: 'institution', label: 'Institution' },
    { name: 'date_range', label: 'Date Range', placeholder: '2018 — 2022' },
    { name: 'details', label: 'Details', type: 'textarea-lines', rows: 4, hint: 'one per line' },
    { name: 'accent_color', label: 'Accent Color', placeholder: '#00B4D8' },
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function certificationFields() {
  return [
    { name: 'name', label: 'Certification Name', isTitle: true },
    { name: 'issuer', label: 'Issuer' },
    { name: 'year', label: 'Year' },
    { name: 'verify_url', label: 'Verification URL', placeholder: 'https://...' },
    { name: 'gradient_class', label: 'Gradient Class', type: 'select', options: [
      { value: 'gradient-orange', label: 'Orange Gradient' },
      { value: 'gradient-cyan', label: 'Cyan Gradient' }
    ]},
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

function socialFields() {
  return [
    { name: 'platform', label: 'Platform Name', isTitle: true },
    { name: 'url', label: 'URL', placeholder: 'https://...' },
    { name: 'icon_svg', label: 'SVG Path (d attribute)', type: 'textarea', rows: 2, hint: 'SVG path d attribute value' },
    { name: 'display_order', label: 'Display Order', type: 'number', default: '0' },
    { name: 'is_visible', label: 'Visible', type: 'checkbox' }
  ];
}

// ========================================
// SEO / METADATA TAB (singleton — always edit mode)
// ========================================
async function loadMetadataTab() {
  const content = document.getElementById('admin-content');
  const { data: meta, error } = await supabase.from('site_metadata').select('*').limit(1).single();

  if (error) {
    content.innerHTML = `<div class="text-red-500">Error loading metadata: ${error.message}</div>`;
    return;
  }

  const fields = [
    { name: 'site_name', label: 'Site Name', placeholder: 'John Doe' },
    { name: 'title', label: 'Site Title', placeholder: 'John Doe | Frontend Developer' },
    { name: 'description', label: 'Meta Description', type: 'textarea', rows: 2 },
    { name: 'og_title', label: 'OG Title', placeholder: 'Title for social sharing' },
    { name: 'og_description', label: 'OG Description', type: 'textarea', rows: 2 },
    { name: 'og_image', label: 'OG Image', type: 'image-upload', placeholder: 'Paste URL or upload...' },
    { name: 'og_url', label: 'OG URL', type: 'url', placeholder: 'https://yourdomain.com' }
  ];

  content.innerHTML = `
    <div>
      <h2 class="font-display text-2xl text-white uppercase mb-6">Site <span class="gradient-text-orange">SEO</span></h2>
      <form id="metadata-form" class="admin-form space-y-4">
        ${fields.map(f => renderField(f, meta)).join('')}
        <div class="flex gap-3 pt-4">
          <button type="submit" class="admin-btn admin-btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            Save Metadata
          </button>
        </div>
      </form>
    </div>
  `;

  attachUploadHandlers('metadata');

  document.getElementById('metadata-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const fd = new FormData(e.target);
    const updates = {};
    fields.forEach(f => { updates[f.name] = fd.get(f.name) || ''; });

    btnLoading(btn, 'Saving...');
    const { error } = await supabase.from('site_metadata').update(updates).eq('id', meta.id);
    btnReset(btn);
    if (error) {
      showToast('Error saving metadata: ' + error.message, 'error');
    } else {
      showToast('Metadata saved successfully!');
    }
  });
}
