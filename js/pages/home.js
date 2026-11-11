/* ========================================
   Home Page — JavaScript (Supabase Dynamic)
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {

  // Show skeletons while loading
  showSkeleton('bento-grid');
  showSkeleton('services-grid');
  showSkeleton('featured-projects-grid');

  // Fetch all data in parallel
  const [profile, socialLinks, services, featuredProjects, pageMeta] = await Promise.all([
    fetchProfile(),
    fetchSocialLinks(),
    fetchServices(),
    fetchFeaturedProjects(),
    fetchSiteMetadata()
  ]);

  // Apply page metadata before rendering
  applySiteMetadata(pageMeta);

  // --- Render Hero & Bento Grid ---
  if (profile) {
    const heroOverline = document.getElementById('hero-overline');
    const heroName = document.getElementById('hero-name');
    if (heroOverline) heroOverline.textContent = profile.title || 'Frontend Developer';
    if (heroName) {
      heroName.innerHTML = `${profile.hero_heading_line1 || profile.first_name} <span class="gradient-text-orange">${profile.hero_heading_line2 || profile.last_name}</span>`;
    }

    // Start typing effect with roles from DB
    const typingEl = document.getElementById('typing-text');
    if (typingEl) {
      const roles = profile.typing_roles || ['Frontend Developer'];
      startTypingEffect(typingEl, roles);
    }

    renderBentoGrid(profile);
  }

  // --- Hide page loader after above-the-fold content ---
  hidePageLoader();

  // --- Render Services ---
  if (services && services.length > 0) {
    renderServicesGrid(services);
  }
  hideSkeleton('services-grid');

  // --- Render Featured Projects ---
  if (featuredProjects && featuredProjects.length > 0) {
    renderFeaturedProjects(featuredProjects);
  }
  hideSkeleton('featured-projects-grid');

  // --- Render Contact CTA ---
  if (profile) {
    const contactEmail = document.getElementById('contact-email');
    if (contactEmail) {
      contactEmail.href = `mailto:${profile.email}`;
      contactEmail.textContent = profile.email;
    }
  }

  if (socialLinks && socialLinks.length > 0) {
    renderContactSocial(socialLinks);
  }

  // --- Render shared navbar and footer ---
  renderNavbar(profile);
  renderFooter(profile, socialLinks);

  // --- Re-initialize AOS for dynamic content ---
  if (typeof AOS !== 'undefined') AOS.refresh();

  // --- Re-initialize counter animations ---
  initCounterAnimations();

});

// --- Typing Effect ---
function startTypingEffect(el, roles) {
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typeSpeed = 80;
  const deleteSpeed = 40;
  const pauseTime = 2000;

  function type() {
    const currentRole = roles[roleIndex];

    if (isDeleting) {
      el.textContent = currentRole.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentRole.substring(0, charIndex + 1);
      charIndex++;
    }

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentRole.length) {
      delay = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }

    setTimeout(type, delay);
  }

  type();
}

// --- Render Bento Grid ---
function renderBentoGrid(profile) {
  const container = document.getElementById('bento-grid');
  if (!container) return;

  container.innerHTML = `
    <!-- Profile Card (Large - 2x2) -->
    <div class="md:col-span-2 md:row-span-2 bg-surface-card border border-border rounded-2xl overflow-hidden relative group card-hover" data-aos="fade-up">
      <div class="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent z-10"></div>
      <div class="absolute inset-0 bg-accent-orange/5"></div>
      ${profile.profile_image_url ? `<img src="${profile.profile_image_url}" alt="${profile.full_name}" class="absolute inset-0 w-full h-full object-cover" />` : ''}
      <div class="relative z-20 p-8 md:p-10 flex flex-col justify-end h-full min-h-[400px]">
        <p class="font-mono text-xs tracking-[0.2em] text-accent-cyan uppercase mb-3">About Me</p>
        <h2 class="font-display text-4xl md:text-5xl text-white uppercase mb-4">Crafting Digital Experiences</h2>
        <p class="text-text-secondary leading-relaxed max-w-lg">
          ${profile.bio_short || "I'm a passionate frontend developer with a keen eye for design and a love for creating seamless, user-friendly web experiences."}
        </p>
        <a href="about.html" class="inline-flex items-center gap-2 text-accent-orange hover:text-accent-orange-hover transition-colors mt-6 font-medium text-sm">
          Learn more about me
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
      </div>
    </div>

    <!-- Stat: Years -->
    <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center card-hover" data-aos="fade-up" data-aos-delay="100">
      <span class="font-display text-5xl md:text-6xl text-accent-orange" data-counter="${profile.years_experience || 5}" data-suffix="+">0+</span>
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mt-3">Years Experience</p>
    </div>

    <!-- Stat: Projects -->
    <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center card-hover" data-aos="fade-up" data-aos-delay="200">
      <span class="font-display text-5xl md:text-6xl text-accent-cyan" data-counter="${profile.projects_completed || 50}" data-suffix="+">0+</span>
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mt-3">Projects Completed</p>
    </div>

    <!-- Available Card (Wide) -->
    <div class="md:col-span-2 bg-surface-card border border-border rounded-2xl p-6 md:p-8 flex items-center justify-between card-hover" data-aos="fade-up" data-aos-delay="100">
      <div class="flex items-center gap-4">
        ${profile.availability_open ? '<span class="status-dot"></span>' : '<span class="w-2.5 h-2.5 rounded-full bg-text-muted flex-shrink-0"></span>'}
        <div>
          <p class="font-semibold text-white">${profile.availability_status || 'Available for Freelance'}</p>
          <p class="text-text-muted text-sm mt-0.5">${profile.availability_open ? 'Open to new opportunities' : 'Not available currently'}</p>
        </div>
      </div>
      <a href="mailto:${profile.email}" class="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:border-accent-orange hover:text-accent-orange transition-all text-text-secondary">
        Hire Me
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </a>
    </div>

    <!-- Stat: Clients -->
    <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center card-hover" data-aos="fade-up" data-aos-delay="100">
      <span class="font-display text-5xl md:text-6xl text-white" data-counter="${profile.happy_clients || 30}" data-suffix="+">0+</span>
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mt-3">Happy Clients</p>
    </div>

    <!-- Location Card -->
    <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center card-hover" data-aos="fade-up" data-aos-delay="200">
      <svg class="w-8 h-8 text-accent-orange mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
      <p class="font-semibold text-white">${profile.location_city || 'San Francisco'}</p>
      <p class="text-text-muted text-sm mt-0.5">${profile.location_region || 'California, USA'}</p>
    </div>
  `;

  hideSkeleton('bento-grid');
}

// --- Render Services Grid ---
function renderServicesGrid(services) {
  const container = document.getElementById('services-grid');
  if (!container) return;

  container.innerHTML = services.map((service, i) => {
    const isGradient = service.gradient_class === 'gradient-orange' || service.gradient_class === 'gradient-cyan';
    const iconWrapperClass = isGradient
      ? `w-14 h-14 rounded-xl ${service.gradient_class} flex items-center justify-center mb-5`
      : `w-14 h-14 rounded-xl bg-surface-hover flex items-center justify-center mb-5 border border-border`;
    const iconColor = isGradient ? 'text-white' : (service.gradient_class === 'gradient-orange' ? 'text-accent-orange' : 'text-accent-cyan');

    return `
      <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 card-hover group" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="${iconWrapperClass}">
          <svg class="w-7 h-7 ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            ${service.icon_svg}
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2 font-[Inter_Tight]">${service.title}</h3>
        <p class="text-text-secondary text-sm leading-relaxed">${service.description}</p>
      </div>
    `;
  }).join('');
}

// --- Render Featured Projects ---
function renderFeaturedProjects(projects) {
  const container = document.getElementById('featured-projects-grid');
  if (!container) return;

  container.innerHTML = projects.map((project, i) => `
    <article class="bg-surface-card rounded-2xl overflow-hidden border border-border group card-hover" data-aos="fade-up" data-aos-delay="${i * 100}">
      <div class="relative aspect-video overflow-hidden bg-surface-hover">
        ${project.image_url
          ? `<img src="${project.image_url}" alt="${project.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
          : `<div class="absolute inset-0 bg-gradient-to-br from-[${project.gradient_from || '#FF5722'}]/20 to-[${project.gradient_to || '#00B4D8'}]/20 flex items-center justify-center">
              <span class="font-display text-4xl text-white/20">PROJECT 0${i + 1}</span>
            </div>`
        }
        <div class="absolute inset-0 gradient-card-overlay project-overlay"></div>
        <div class="absolute bottom-4 left-4 right-4 project-overlay-content flex gap-3">
          ${project.live_url ? `<a href="${project.live_url}" class="px-4 py-2 rounded-lg bg-white text-surface text-sm font-semibold hover:bg-accent-orange hover:text-white transition-all" aria-label="View live demo">Live Demo</a>` : ''}
          ${project.github_url ? `<a href="${project.github_url}" class="px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-all" aria-label="View source code">GitHub</a>` : ''}
        </div>
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold text-white font-[Inter_Tight]">${project.title}</h3>
        <p class="text-text-secondary text-sm mt-2 leading-relaxed">${project.description}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          ${(project.tech_tags || []).map(tag => `<span class="px-3 py-1 text-xs font-mono bg-surface-hover text-accent-cyan rounded-full">${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

// --- Render Contact Social Links ---
function renderContactSocial(socialLinks) {
  const container = document.getElementById('contact-social');
  if (!container) return;

  container.innerHTML = socialLinks.map(link => `
    <a href="${link.url}" class="w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-white hover:border-accent-orange transition-all" aria-label="${link.platform}" target="_blank" rel="noopener noreferrer">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="${link.icon_svg}" /></svg>
    </a>
  `).join('');
}
