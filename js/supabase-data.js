/* ========================================
   Supabase Data Layer
   ========================================
   Shared data-fetching, rendering, and
   re-initialization helpers used by all
   public pages.
   ======================================== */

// ----------------------------------------
// Helpers
// ----------------------------------------

function renderLogo(profile, cssClass) {
  if (profile.logo_svg) {
    return '<span class="logo-svg ' + (cssClass || 'h-6') + '">' + profile.logo_svg + '</span>';
  }
  return profile.logo_text + '<span class="text-white">.</span>';
}

// ----------------------------------------
// Fetch Functions
// ----------------------------------------

async function fetchVisible(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching ' + table + ':', error);
    return [];
  }
  return data;
}

async function fetchProfile() {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

function fetchSocialLinks() { return fetchVisible('social_links'); }
function fetchServices() { return fetchVisible('services'); }
function fetchExperience() { return fetchVisible('experience'); }
function fetchEducation() { return fetchVisible('education'); }
function fetchCertifications() { return fetchVisible('certifications'); }
function fetchResumeTools() { return fetchVisible('resume_tools'); }

async function fetchProjects(type) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_visible', true)
    .eq('project_type', type)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data;
}

async function fetchFeaturedProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_visible', true)
    .eq('is_featured', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching featured projects:', error);
    return [];
  }
  return data;
}

async function fetchSkills(page) {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .eq('is_visible', true)
    .eq('page', page)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
  return data;
}

async function fetchTools() {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('is_visible', true)
    .order('category', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
  return data;
}

async function fetchSiteMetadata() {
  var { data, error } = await supabase
    .from('site_metadata')
    .select('*')
    .limit(1)
    .single();
  if (error) {
    console.error('Error fetching site metadata:', error);
    return null;
  }
  return data;
}

function applySiteMetadata(meta) {
  if (!meta) return;
  if (meta.title) document.title = meta.title;
  try { localStorage.setItem('siteMeta', JSON.stringify(meta)); } catch (e) {}

  var metaTags = [
    ['meta[name="description"]', meta.description],
    ['meta[property="og:title"]', meta.og_title],
    ['meta[property="og:description"]', meta.og_description],
    ['meta[property="og:image"]', meta.og_image],
    ['meta[property="og:url"]', meta.og_url]
  ];
  metaTags.forEach(function (pair) {
    if (!pair[1]) return;
    var el = document.querySelector(pair[0]);
    if (el) { el.setAttribute('content', pair[1]); return; }
    if (pair[0].indexOf('og:') !== -1) {
      var tag = document.createElement('meta');
      tag.setAttribute('property', pair[0].match(/og:[^"]+/)[0]);
      tag.setAttribute('content', pair[1]);
      document.head.appendChild(tag);
    }
  });
}

// ----------------------------------------
// Skeleton Loading Helpers
// ----------------------------------------

// Failsafe: hide loader after 5 seconds regardless
setTimeout(function() { hidePageLoader(); }, 5000);

function hidePageLoader() {
  var loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.style.opacity = '0';
  loader.style.transition = 'opacity 0.2s ease';
  setTimeout(function() {
    loader.remove();
  }, 200);
}

function showSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="skeleton-placeholder">
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    </div>
  `;
}

function hideSkeleton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const skeleton = container.querySelector('.skeleton-placeholder');
  if (skeleton) {
    skeleton.remove();
  }
}

// ----------------------------------------
// Shared Rendering Functions
// ----------------------------------------

function renderNavbar(profile) {
  if (!profile) return;

  // Update all mailto links within the navbar
  const nav = document.querySelector('nav');
  if (nav) {
    const mailtoLinks = nav.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach(function (link) {
      link.href = 'mailto:' + profile.email;
    });

    // Update logo text
    const logoEl = nav.querySelector('.font-display');
    if (logoEl) {
      logoEl.innerHTML = renderLogo(profile, 'h-6');
    }
  }
}

function renderFooter(profile, socialLinks) {
  if (!profile) return;

  const footer = document.getElementById('site-footer');
  if (!footer) return;

  // Update footer logo text
  const footerLogo = footer.querySelector('.font-display');
  if (footerLogo) {
    footerLogo.innerHTML = renderLogo(profile, 'h-5');
  }

  // Update footer bio text
  const bioEl = footer.querySelector('.text-text-secondary.text-sm');
  if (bioEl) {
    bioEl.textContent = profile.bio_short;
  }

  // Update footer email link
  const mailtoLinks = footer.querySelectorAll('a[href^="mailto:"]');
  mailtoLinks.forEach(function (link) {
    link.href = 'mailto:' + profile.email;
  });

  // Rebuild social icon links
  if (socialLinks && socialLinks.length > 0) {
    const socialContainer = footer.querySelector('.flex.gap-3');
    if (socialContainer) {
      socialContainer.innerHTML = socialLinks.map(function (social) {
        return '<a href="' + social.url + '" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-text-secondary hover:text-white hover:border-accent-orange transition-all" aria-label="' + social.platform + '">' +
          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="' + social.icon_svg + '" /></svg>' +
        '</a>';
      }).join('');
    }
  }

  // Update copyright name
  const copyrightEl = footer.querySelector('.text-text-muted.text-sm');
  if (copyrightEl) {
    const year = new Date().getFullYear();
    copyrightEl.innerHTML = '&copy; ' + year + ' ' + profile.full_name + '. All rights reserved. <a href="admin.html" target="_blank" class="text-text-muted hover:text-accent-orange transition-colors ml-2" title="Admin">'
      + '<svg class="w-3.5 h-3.5 inline-block align-middle" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><circle cx="12" cy="12" r="3" /></svg>'
      + '</a>';
  }
}

// ----------------------------------------
// Shared Component Injection
// ----------------------------------------

function injectNavbar() {
  var el = document.getElementById('navbar');
  if (!el || el.children.length) return;
  el.innerHTML =
    '<nav class="max-w-6xl mx-auto px-3 sm:px-6" aria-label="Main navigation">'
    + '<div class="flex items-center justify-between bg-surface-card/80 backdrop-blur-xl border border-border rounded-full px-2 sm:px-3 py-1.5 sm:py-2">'
    + '<a href="index.html" class="font-display text-2xl text-accent-orange tracking-wide px-3">JD<span class="text-white">.</span></a>'
    + '<div class="hidden md:flex items-center gap-1">'
    + '<a href="index.html" data-nav-link class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 text-text-secondary hover:text-white hover:bg-surface-hover">Home</a>'
    + '<a href="about.html" data-nav-link class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 text-text-secondary hover:text-white hover:bg-surface-hover">About</a>'
    + '<a href="projects.html" data-nav-link class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 text-text-secondary hover:text-white hover:bg-surface-hover">Projects</a>'
    + '<a href="resume.html" data-nav-link class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 text-text-secondary hover:text-white hover:bg-surface-hover">Resume</a>'
    + '</div>'
    + '<a href="mailto:" class="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium gradient-orange text-white hover:opacity-90 transition-opacity">Let\'s Talk</a>'
    + '<button id="nav-hamburger" class="md:hidden p-2 text-text-secondary hover:text-white transition-colors" aria-label="Toggle menu" aria-expanded="false">'
    + '<svg id="hamburger-icon" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>'
    + '<svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>'
    + '</button>'
    + '</div>'
    + '<div id="mobile-nav" class="mobile-nav md:hidden bg-surface-card rounded-2xl">'
    + '<div class="flex flex-col gap-1">'
    + '<a href="index.html" data-nav-link class="px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-hover transition-all">Home</a>'
    + '<a href="about.html" data-nav-link class="px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-hover transition-all">About</a>'
    + '<a href="projects.html" data-nav-link class="px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-hover transition-all">Projects</a>'
    + '<a href="resume.html" data-nav-link class="px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-surface-hover transition-all">Resume</a>'
    + '<hr class="border-border my-2" />'
    + '<a href="mailto:" class="px-4 py-3 rounded-xl text-sm font-medium text-center gradient-orange text-white">Let\'s Talk</a>'
    + '</div>'
    + '</div>'
    + '</nav>';
}

function injectFooter() {
  var el = document.getElementById('site-footer');
  if (!el || el.children.length) return;
  el.innerHTML =
    '<div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">'
    + '<div class="grid grid-cols-1 md:grid-cols-3 gap-10">'
    + '<div>'
    + '<a href="index.html" class="font-display text-3xl text-accent-orange">JD<span class="text-white">.</span></a>'
    + '<p class="text-text-secondary text-sm mt-3 leading-relaxed max-w-xs"></p>'
    + '</div>'
    + '<div>'
    + '<h4 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>'
    + '<ul class="space-y-2.5">'
    + '<li><a href="index.html" class="text-text-secondary hover:text-accent-orange transition-colors text-sm">Home</a></li>'
    + '<li><a href="about.html" class="text-text-secondary hover:text-accent-orange transition-colors text-sm">About</a></li>'
    + '<li><a href="projects.html" class="text-text-secondary hover:text-accent-orange transition-colors text-sm">Projects</a></li>'
    + '<li><a href="resume.html" class="text-text-secondary hover:text-accent-orange transition-colors text-sm">Resume</a></li>'
    + '</ul>'
    + '</div>'
    + '<div>'
    + '<h4 class="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Connect</h4>'
    + '<div class="flex gap-3"></div>'
    + '</div>'
    + '</div>'
    + '<hr class="border-border my-8" />'
    + '<p class="text-text-muted text-sm text-center">&copy; ' + new Date().getFullYear() + '</p>'
    + '</div>';
}

function injectPageLoader() {
  var el = document.getElementById('page-loader');
  if (!el || el.children.length) return;
  el.innerHTML =
    '<div class="code-loader" style="height:auto">'
    + '<svg viewBox="0 0 100 100">'
    + '<line class="bracket-seg seg-1" x1="35" y1="20" x2="10" y2="50" />'
    + '<line class="bracket-seg seg-2" x1="10" y1="50" x2="35" y2="80" />'
    + '<line class="bracket-seg seg-3" x1="65" y1="20" x2="90" y2="50" />'
    + '<line class="bracket-seg seg-4" x1="90" y1="50" x2="65" y2="80" />'
    + '</svg>'
    + '</div>';
}

// Auto-inject shared components
injectNavbar();
injectFooter();
injectPageLoader();

// ----------------------------------------
// Re-initialization Helpers
// ----------------------------------------

function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-counter'), 10);
          const suffix = el.getAttribute('data-suffix') || '';
          const duration = 2000;
          const startTime = performance.now();
          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(updateCounter);
          }
          requestAnimationFrame(updateCounter);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (counter) { observer.observe(counter); });
  }
}

function initSkillBarAnimations() {
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  if (skillBars.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    skillBars.forEach(function (bar) { observer.observe(bar); });
  }
}

function initProjectFilters() {
  const filterBtns = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('[data-category]');
  if (filterBtns.length > 0 && projectCards.length > 0) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        projectCards.forEach(function (card) {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = '';
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            requestAnimationFrame(function () {
              card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(function () { card.style.display = 'none'; }, 300);
          }
        });
      });
    });
  }
}
