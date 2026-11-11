/* ========================================
   Resume Page — JavaScript (Supabase Dynamic)
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {

  showSkeleton('experience-timeline');
  showSkeleton('resume-skills-grid');
  showSkeleton('certifications-grid');

  const [profile, experience, education, skills, certifications, resumeTools, socialLinks, pageMeta] = await Promise.all([
    fetchProfile(),
    fetchExperience(),
    fetchEducation(),
    fetchSkills('resume'),
    fetchCertifications(),
    fetchResumeTools(),
    fetchSocialLinks(),
    fetchSiteMetadata()
  ]);

  // Apply page metadata before rendering
  applySiteMetadata(pageMeta);

  // Render Summary
  if (profile) {
    renderResumeSummary(profile);
    renderNavbar(profile);
  }

  // Render Experience
  if (experience && experience.length > 0) {
    renderExperienceTimeline(experience);
  }
  hideSkeleton('experience-timeline');

  // Render Education
  if (education && education.length > 0) {
    renderEducationGrid(education);
  }

  // Render Skills
  if (skills && skills.length > 0 || resumeTools && resumeTools.length > 0) {
    renderResumeSkills(skills || [], resumeTools || []);
  }
  hideSkeleton('resume-skills-grid');

  // Render Certifications
  if (certifications && certifications.length > 0) {
    renderCertificationsGrid(certifications);
  }
  hideSkeleton('certifications-grid');

  // Render Footer
  renderFooter(profile, socialLinks);

  if (typeof AOS !== 'undefined') AOS.refresh();
  initSkillBarAnimations();

  hidePageLoader();
});

function renderResumeSummary(profile) {
  const container = document.getElementById('resume-summary-content');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-2xl">
      <h2 class="font-display text-3xl md:text-4xl text-white uppercase mb-2">${profile.full_name}</h2>
      <p class="text-accent-cyan font-medium mb-4">${profile.summary_title || profile.title}</p>
      <p class="text-text-secondary leading-relaxed">${profile.summary_text || ''}</p>
    </div>
    ${profile.resume_file_url ? `
    <a href="${profile.resume_file_url}" download class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold gradient-orange text-white hover:opacity-90 transition-opacity whitespace-nowrap no-print">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
      Download Resume
    </a>` : ''}
  `;
}

function renderExperienceTimeline(experience) {
  const container = document.getElementById('experience-timeline');
  if (!container) return;

  container.innerHTML = experience.map((exp, i) => {
    const isRight = i % 2 === 0;
    const accentColor = exp.accent_color || (i % 2 === 0 ? 'orange' : 'cyan');
    const dotClass = accentColor === 'orange' ? 'bg-accent-orange' : 'bg-accent-cyan';
    const badgeClass = accentColor === 'orange' ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-cyan/10 text-accent-cyan';

    return `
      <div class="relative flex flex-col lg:flex-row items-start" data-aos="fade-up">
        <div class="absolute left-5 lg:left-1/2 w-4 h-4 rounded-full ${dotClass} border-4 border-surface -translate-x-1/2 mt-8 z-10"></div>
        <div class="${isRight ? 'lg:w-1/2 lg:ml-auto pl-12 lg:pl-10' : 'lg:w-1/2 lg:mr-auto lg:pr-10 pl-12 lg:pl-0'}">
          <span class="inline-block px-3 py-1 text-xs font-mono ${badgeClass} rounded-full mb-3">${exp.date_range}</span>
          <div class="bg-surface-card border border-border rounded-2xl p-6 card-hover">
            <h3 class="text-lg font-bold text-white font-[Inter_Tight]">${exp.role}</h3>
            <p class="text-accent-cyan text-sm font-medium mt-1">${exp.company}</p>
            <ul class="mt-4 space-y-2 text-text-secondary text-sm leading-relaxed">
              ${(exp.achievements || []).map(a => `
                <li class="flex items-start gap-2">
                  <span class="w-1.5 h-1.5 rounded-full ${dotClass} mt-1.5 flex-shrink-0"></span>
                  ${a}
                </li>
              `).join('')}
            </ul>
            <div class="flex flex-wrap gap-2 mt-4">
              ${(exp.tech_tags || []).map(tag => `<span class="px-2.5 py-1 text-xs font-mono bg-surface-hover text-text-muted rounded-full">${tag}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderEducationGrid(education) {
  const container = document.getElementById('education-grid');
  if (!container) return;

  container.innerHTML = education.map((edu, i) => {
    const accentColor = edu.accent_color || (i % 2 === 0 ? 'orange' : 'cyan');
    const badgeClass = accentColor === 'orange' ? 'bg-accent-orange/10 text-accent-orange' : 'bg-accent-cyan/10 text-accent-cyan';
    const bulletClass = accentColor === 'orange' ? 'bg-accent-orange' : 'bg-accent-cyan';

    return `
      <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 card-hover" data-aos="fade-up" data-aos-delay="${i * 100}">
        <span class="inline-block px-3 py-1 text-xs font-mono ${badgeClass} rounded-full mb-4">${edu.date_range}</span>
        <h3 class="text-lg font-bold text-white font-[Inter_Tight]">${edu.degree}</h3>
        <p class="text-accent-cyan text-sm font-medium mt-1">${edu.institution}</p>
        <ul class="mt-4 space-y-2 text-text-secondary text-sm">
          ${(edu.details || []).map(d => `
            <li class="flex items-start gap-2">
              <span class="w-1.5 h-1.5 rounded-full ${bulletClass} mt-1.5 flex-shrink-0"></span>
              ${d}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');
}

function renderResumeSkills(skills, resumeTools) {
  const container = document.getElementById('resume-skills-grid');
  if (!container) return;

  // Group skills by category
  const grouped = {};
  skills.forEach(skill => {
    if (!grouped[skill.category]) grouped[skill.category] = [];
    grouped[skill.category].push(skill);
  });

  const categoryIcons = {
    languages: `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`,
    frameworks: `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25" /></svg>`
  };

  const categoryNames = {
    languages: 'Languages',
    frameworks: 'Frameworks & Libraries'
  };

  const categoryGradients = {
    languages: 'gradient-orange',
    frameworks: 'gradient-cyan'
  };

  let html = '';
  let delay = 0;

  Object.entries(grouped).forEach(([category, items]) => {
    html += `
      <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 card-hover" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-lg ${categoryGradients[category] || 'gradient-orange'} flex items-center justify-center">
            ${categoryIcons[category] || categoryIcons.languages}
          </div>
          <h3 class="font-bold text-white font-[Inter_Tight]">${categoryNames[category] || category}</h3>
        </div>
        <div class="space-y-4">
          ${items.map(skill => `
            <div>
              <div class="flex justify-between mb-1.5"><span class="text-sm text-text-secondary">${skill.name}</span><span class="text-xs font-mono text-accent-cyan">${skill.percentage}%</span></div>
              <div class="w-full h-2 bg-surface-hover rounded-full overflow-hidden"><div class="skill-bar-fill h-full rounded-full ${skill.gradient_class || 'gradient-orange'}" style="--target-width: ${skill.percentage}%"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    delay += 100;
  });

  // Tools & Platforms card (resume_tools tag cloud)
  if (resumeTools && resumeTools.length > 0) {
    html += `
      <div class="bg-surface-card border border-border rounded-2xl p-6 md:p-8 card-hover" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-lg bg-surface-hover border border-border flex items-center justify-center">
            <svg class="w-5 h-5 text-accent-orange" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17l-5.384 3.112 1.028-5.994L2.88 8.28l6.02-.875L11.42 2l2.578 5.405 6.02.875-4.184 4.008 1.028 5.994z" /></svg>
          </div>
          <h3 class="font-bold text-white font-[Inter_Tight]">Tools & Platforms</h3>
        </div>
        <div class="flex flex-wrap gap-2">
          ${resumeTools.map(tool => `<span class="px-3 py-1.5 text-sm bg-surface-hover text-text-secondary rounded-lg border border-border">${tool.name}</span>`).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderCertificationsGrid(certifications) {
  const container = document.getElementById('certifications-grid');
  if (!container) return;

  const gradientIcons = {
    'gradient-orange': `<div class="w-12 h-12 rounded-xl gradient-orange flex items-center justify-center flex-shrink-0">`,
    'gradient-cyan': `<div class="w-12 h-12 rounded-xl gradient-cyan flex items-center justify-center flex-shrink-0">`,
    'bg-surface-hover': `<div class="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center flex-shrink-0">`
  };

  container.innerHTML = certifications.map((cert, i) => {
    const wrapper = gradientIcons[cert.gradient_class] || gradientIcons['gradient-orange'];
    const iconColor = cert.gradient_class === 'bg-surface-hover' ? 'text-accent-orange' : 'text-white';

    return `
      <div class="bg-surface-card border border-border rounded-2xl p-6 card-hover group" data-aos="fade-up" data-aos-delay="${i * 100}">
        <div class="flex items-start gap-4">
          ${wrapper}
            <svg class="w-6 h-6 ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
          </div>
          <div>
            <h3 class="font-bold text-white text-sm font-[Inter_Tight]">${cert.name}</h3>
            <p class="text-text-muted text-xs mt-1">${cert.issuer} — ${cert.year}</p>
            ${cert.verify_url ? `
            <a href="${cert.verify_url}" class="inline-flex items-center gap-1 text-xs text-accent-orange hover:text-accent-orange-hover transition-colors mt-2" target="_blank" rel="noopener noreferrer">
              Verify
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </a>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
