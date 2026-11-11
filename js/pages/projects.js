/* ========================================
   Projects Page — JavaScript (Supabase Dynamic)
   ======================================== */

document.addEventListener('DOMContentLoaded', async () => {

  showSkeleton('projects-grid');
  showSkeleton('practice-projects-grid');

  const [profile, professionalProjects, practiceProjects, socialLinks, pageMeta] = await Promise.all([
    fetchProfile(),
    fetchProjects('professional'),
    fetchProjects('practice'),
    fetchSocialLinks(),
    fetchSiteMetadata()
  ]);

  // Apply page metadata before rendering
  applySiteMetadata(pageMeta);

  // Render professional projects
  if (professionalProjects && professionalProjects.length > 0) {
    renderProjectCards('projects-grid', professionalProjects, false);
  }
  hideSkeleton('projects-grid');

  // Render practice projects
  if (practiceProjects && practiceProjects.length > 0) {
    renderProjectCards('practice-projects-grid', practiceProjects, true);
  }
  hideSkeleton('practice-projects-grid');

  // Re-attach filter logic
  initProjectFilters();

  // Render shared components
  renderNavbar(profile);
  renderFooter(profile, socialLinks);

  if (typeof AOS !== 'undefined') AOS.refresh();

  hidePageLoader();
});

function renderProjectCards(containerId, projects, isPractice) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = projects.map((project, i) => `
    <article class="bg-surface-card rounded-2xl overflow-hidden border border-border group ${isPractice ? 'hover:border-accent-cyan/40' : ''} transition-all card-hover" data-category="${project.category}" data-aos="fade-up" data-aos-delay="${(i % 3) * 100}">
      <div class="relative aspect-video overflow-hidden bg-surface-hover">
        ${project.image_url
          ? `<img src="${project.image_url}" alt="${project.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
          : `<div class="absolute inset-0 bg-gradient-to-br from-[${project.gradient_from || '#FF5722'}]/20 to-[${project.gradient_to || '#00B4D8'}]/10 flex items-center justify-center">
              ${isPractice
                ? `<svg class="w-12 h-12 text-white/10" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>`
                : `<span class="font-display text-3xl text-white/20">0${i + 1}</span>`
              }
            </div>`
        }
        ${isPractice ? `<div class="absolute top-3 right-3"><span class="px-3 py-1 text-xs font-mono bg-accent-cyan/20 text-accent-cyan rounded-full">Practice</span></div>` : ''}
        <div class="absolute inset-0 gradient-card-overlay project-overlay"></div>
        <div class="absolute bottom-4 left-4 right-4 project-overlay-content flex gap-3">
          ${project.live_url ? `<a href="${project.live_url}" class="px-4 py-2 rounded-lg bg-white text-surface text-sm font-semibold hover:bg-${isPractice ? 'accent-cyan' : 'accent-orange'} hover:text-white transition-all">${isPractice ? 'Demo' : 'Live Demo'}</a>` : ''}
          ${project.github_url ? `<a href="${project.github_url}" class="px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-all">${isPractice ? 'Code' : 'GitHub'}</a>` : ''}
        </div>
      </div>
      <div class="p-6">
        <h3 class="text-lg font-bold text-white font-[Inter_Tight]">${project.title}</h3>
        <p class="text-text-secondary text-sm mt-2 leading-relaxed line-clamp-2">${project.description}</p>
        <div class="flex flex-wrap gap-2 mt-4">
          ${(project.tech_tags || []).map(tag => `<span class="px-3 py-1 text-xs font-mono bg-surface-hover text-accent-cyan rounded-full">${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}
