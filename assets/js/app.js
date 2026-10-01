/**
 * app.js — Main Application Logic
 * airseen1 Portfolio
 */

'use strict';

// --- Fallback & Seed Content Data ---
const FALLBACK_DATA = {
  projects: [
    {
      slug: 'airsenuwu',
      title: 'airsenuwu',
      thumbnail: 'assets/images/projects/project-featured.svg',
      category: 'Portfolio Web & Workspace',
      description: 'Built with a mobile-first approach using pure HTML, CSS, and JavaScript. Integrated with Decap CMS for seamless content management.',
      status: 'Featured',
      tech: 'HTML5, CSS3, JavaScript, Decap CMS',
      repo: 'https://github.com/Ibnuwu/airsenuwu',
      demo: 'https://airsenuwu.is-a.dev',
      body: `### airsenuwu

Built with a mobile-first approach using pure HTML, CSS, and JavaScript. Integrated with Decap CMS for seamless content management.`
    }
  ],
  blog: [],
  creative: []
};

// --- Configurations & State ---
const GITHUB_REPO = 'Ibnuwu/airsenuwu';
const CACHE_KEY_PREFIX = 'airsenuwu_cache_';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes (TTL)

let loadedProjects = [];
let loadedBlogs = [];

// --- Helper: Client-Side Regex Frontmatter Parser ---
function parseMarkdownFile(text) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = text.match(frontmatterRegex);
  
  let attributes = {};
  let body = text;

  if (match) {
    const yaml = match[1];
    body = match[2];
    
    // Parse YAML lines (key: value)
    yaml.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        attributes[key] = val;
      }
    });
  }
  
  return { attributes, body };
}

// --- API Client: Fetch content from GitHub API with caching ---
async function fetchFromGitHub(endpoint) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${endpoint}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GitHub API returned status ${response.status}`);
  }
  return await response.json();
}

async function loadSectionData(sectionName) {
  // 1. Try Cache First
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + sectionName);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        console.log(`Using cached data for ${sectionName}`);
        return parsed.data;
      }
    } catch (e) {
      console.warn('Failed to parse cache', e);
    }
  }

  // 2. Fetch from GitHub API
  console.log(`Fetching dynamic content from repo directory: content/${sectionName}...`);
  const files = await fetchFromGitHub(`content/${sectionName}`);
  
  // Filter out .gitkeep and keep only markdown files
  const mdFiles = files.filter(f => f.name.endsWith('.md') && f.name !== '.gitkeep');
  
  // If the directory has no markdown files, return an empty array (it will trigger mock data fallback)
  if (mdFiles.length === 0) {
    return [];
  }

  const contentPromises = mdFiles.map(async (file) => {
    const rawResponse = await fetch(file.download_url);
    if (!rawResponse.ok) {
      throw new Error(`Failed to fetch raw file: ${file.name}`);
    }
    const text = await rawResponse.text();
    const slug = file.name.replace(/\.md$/, '');
    const { attributes, body } = parseMarkdownFile(text);
    return {
      slug,
      ...attributes,
      body
    };
  });

  const data = await Promise.all(contentPromises);

  // Sorting
  if (sectionName === 'projects') {
    data.sort((a, b) => {
      // Featured status takes precedence
      const isAFeatured = a.status === 'Featured' || a.featured === 'true' || a.featured === true;
      const isBFeatured = b.status === 'Featured' || b.featured === 'true' || b.featured === true;
      if (isAFeatured && !isBFeatured) return -1;
      if (!isAFeatured && isBFeatured) return 1;
      return a.title.localeCompare(b.title);
    });
  } else if (sectionName === 'blog') {
    data.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });
  }

  // 3. Update Cache
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + sectionName, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn('Failed to store cache', e);
  }

  return data;
}

// --- Render Loading Skeleton Screens ---
function showSkeletons() {
  const projContainer = document.getElementById('projects-container');
  const blogContainer = document.getElementById('blog-container');
  const creativeContainer = document.getElementById('creative-container');

  if (projContainer) {
    projContainer.innerHTML = `
      <div class="skeleton-card skeleton-featured skeleton-animate card flex flex-col md:flex-row">
        <div class="skeleton-thumbnail skeleton-animate"></div>
        <div class="skeleton-content flex flex-col gap-3 flex-grow">
          <div class="skeleton-line skeleton-animate w-1/4"></div>
          <div class="skeleton-line skeleton-animate w-3/4"></div>
          <div class="skeleton-line skeleton-animate w-full"></div>
          <div class="skeleton-line skeleton-animate w-1/2"></div>
        </div>
      </div>
      <div class="projects-grid">
        <div class="skeleton-card card flex flex-col">
          <div class="skeleton-thumbnail skeleton-animate"></div>
          <div class="skeleton-content flex flex-col gap-3 p-5">
            <div class="skeleton-line skeleton-animate w-1/3"></div>
            <div class="skeleton-line skeleton-animate w-full"></div>
            <div class="skeleton-line skeleton-animate w-1/2"></div>
          </div>
        </div>
        <div class="skeleton-card card flex flex-col">
          <div class="skeleton-thumbnail skeleton-animate"></div>
          <div class="skeleton-content flex flex-col gap-3 p-5">
            <div class="skeleton-line skeleton-animate w-1/3"></div>
            <div class="skeleton-line skeleton-animate w-full"></div>
            <div class="skeleton-line skeleton-animate w-1/2"></div>
          </div>
        </div>
      </div>
    `;
  }

  if (blogContainer) {
    blogContainer.innerHTML = `
      <div class="skeleton-blog-item skeleton-animate card p-6 flex flex-col gap-3">
        <div class="skeleton-line skeleton-animate w-1/4"></div>
        <div class="skeleton-line skeleton-animate w-3/4"></div>
        <div class="skeleton-line skeleton-animate w-1/2"></div>
      </div>
      <div class="skeleton-blog-item skeleton-animate card p-6 flex flex-col gap-3">
        <div class="skeleton-line skeleton-animate w-1/4"></div>
        <div class="skeleton-line skeleton-animate w-3/4"></div>
        <div class="skeleton-line skeleton-animate w-1/2"></div>
      </div>
    `;
  }

  if (creativeContainer) {
    creativeContainer.innerHTML = `
      <div class="skeleton-card card p-0 flex flex-col">
        <div class="skeleton-thumbnail skeleton-animate" style="aspect-ratio: 1/1; border-bottom: none;"></div>
      </div>
      <div class="skeleton-card card p-0 flex flex-col">
        <div class="skeleton-thumbnail skeleton-animate" style="aspect-ratio: 1/1; border-bottom: none;"></div>
      </div>
    `;
  }
}

// --- Render Functions ---
function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  container.innerHTML = '';

  const featuredList = projects.filter(p => p.status === 'Featured' || p.featured === 'true' || p.featured === true);
  const normalList = projects.filter(p => !(p.status === 'Featured' || p.featured === 'true' || p.featured === true));

  // Determine featured card and normal list
  let featured = featuredList[0] || projects[0];
  let normals = featuredList[0] ? normalList : projects.slice(1);

  if (featured) {
    const techTags = (featured.tech || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t)
      .map(t => `<span class="pill">${t}</span>`)
      .join('');

    const featuredHtml = `
      <div class="project-card featured-card card flex flex-col" data-slug="${featured.slug}">
        <div class="project-thumbnail-wrapper">
          <img src="${featured.thumbnail || 'assets/images/projects/project-featured.svg'}" alt="${featured.title}" class="project-thumbnail" width="400" height="220" loading="lazy" decoding="async">
          <span class="project-status badge-completed">${featured.status || 'Featured'}</span>
        </div>
        <div class="project-content flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="project-category text-xs fw-semibold text-tertiary">${featured.category || 'Portfolio Web'}</span>
              <span class="pill">Featured</span>
            </div>
            <h3 class="project-title text-xl fw-bold text-primary mb-2">${featured.title}</h3>
            <p class="project-description text-sm text-secondary mb-4">${featured.description}</p>
            <div class="project-tech-stack flex flex-wrap gap-2 mb-6">
              ${techTags}
            </div>
          </div>
          <div class="project-links flex gap-4">
            <a href="${featured.repo || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm-action">
              <i data-lucide="github" class="icon-sm"></i>
              <span>Repository</span>
            </a>
            <a href="${featured.demo || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm-action ${(!featured.demo || featured.demo === '#') ? 'disabled' : ''}">
              <i data-lucide="external-link" class="icon-sm"></i>
              <span>Live Demo</span>
            </a>
            <button class="btn btn-outline btn-sm-action btn-read-more" style="margin-left: auto;" aria-label="Baca selengkapnya tentang ${featured.title}">
              <span>Detail</span>
              <i data-lucide="book-open" class="icon-sm"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += featuredHtml;
  }

  if (normals.length > 0) {
    const grid = document.createElement('div');
    grid.className = 'projects-grid';

    normals.forEach(proj => {
      const techTags = (proj.tech || '')
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
        .map(t => `<span class="pill">${t}</span>`)
        .join('');

      const projHtml = `
        <div class="project-card card flex flex-col" data-slug="${proj.slug}">
          <div class="project-thumbnail-wrapper">
            <img src="${proj.thumbnail || 'assets/images/projects/project-1.svg'}" alt="${proj.title}" class="project-thumbnail" width="400" height="220" loading="lazy" decoding="async">
          </div>
          <div class="project-content flex flex-col justify-between flex-grow">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="project-category text-xs fw-semibold text-tertiary">${proj.category || 'Project'}</span>
                <span class="pill status-${(proj.status || 'Active').toLowerCase().replace(' ', '-')}">${proj.status || 'Active'}</span>
              </div>
              <h3 class="project-title text-md fw-bold text-primary mb-2">${proj.title}</h3>
              <p class="project-description text-xs text-secondary mb-4">${proj.description}</p>
              <div class="project-tech-stack flex flex-wrap gap-2 mb-6">
                ${techTags}
              </div>
            </div>
            <div class="project-links flex gap-3">
              <a href="${proj.repo || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm-action">
                <i data-lucide="github" class="icon-sm"></i>
                <span>Repo</span>
              </a>
              <a href="${proj.demo || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm-action ${(!proj.demo || proj.demo === '#') ? 'disabled' : ''}">
                <i data-lucide="external-link" class="icon-sm"></i>
                <span>Demo</span>
              </a>
              <button class="btn btn-outline btn-sm-action btn-read-more" style="margin-left: auto; padding-inline: var(--space-3);" title="Detail Proyek" aria-label="Detail ${proj.title}">
                <i data-lucide="book-open" class="icon-sm"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      grid.innerHTML += projHtml;
    });

    container.appendChild(grid);
  }

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderBlog(posts) {
  const container = document.getElementById('blog-container');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state card text-center p-8 flex flex-col items-center justify-center">
        <i data-lucide="pen-tool" class="icon-lg text-tertiary mb-3" style="width:32px;height:32px;"></i>
        <h4 class="text-md fw-semibold text-primary mb-1">No Articles Published Yet</h4>
        <p class="text-xs text-secondary">Articles, technical notes, and reviews will appear here once published via Decap CMS.</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    return;
  }

  container.innerHTML = '';

  posts.forEach(post => {
    let dateFormatted = '';
    const dateRaw = post.date || '';
    if (dateRaw) {
      const d = new Date(dateRaw);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      dateFormatted = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }

    const postHtml = `
      <article class="blog-item card" data-slug="${post.slug}">
        <a href="#" class="blog-link flex flex-col justify-between h-full p-6 btn-read-blog" aria-label="Read ${post.title}">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <span class="pill">${post.category || 'Blog'}</span>
              <time class="blog-date text-xs text-tertiary" datetime="${dateRaw}">${dateFormatted}</time>
            </div>
            <h3 class="blog-title text-md fw-bold text-primary mb-2">${post.title}</h3>
            <p class="blog-excerpt text-xs text-secondary mb-4">${post.excerpt || post.description || ''}</p>
          </div>
          <div class="blog-footer flex items-center justify-between mt-2 pt-2 border-t border-solid border-border-hover">
            <span class="text-xs fw-medium text-accent">Read Article</span>
            <i data-lucide="arrow-up-right" class="icon-sm text-tertiary"></i>
          </div>
        </a>
      </article>
    `;
    container.innerHTML += postHtml;
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderCreative(items) {
  const container = document.getElementById('creative-container');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="empty-state card text-center p-8 flex flex-col items-center justify-center" style="grid-column: 1 / -1;">
        <i data-lucide="palette" class="icon-lg text-tertiary mb-3" style="width:32px;height:32px;"></i>
        <h4 class="text-md fw-semibold text-primary mb-1">No Creative Works Uploaded Yet</h4>
        <p class="text-xs text-secondary">Digital sketches, traditional sketchbook scans, and design assets will be displayed here.</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    return;
  }

  container.innerHTML = '';

  items.forEach(item => {
    const itemHtml = `
      <div class="creative-item card" data-category="${item.category || 'photography'}">
        <button class="gallery-trigger" aria-label="View ${item.title}">
          <div class="creative-img-wrapper">
            <img src="${item.image}" alt="${item.title}" class="creative-img" width="300" height="300" loading="lazy" decoding="async">
          </div>
          <div class="creative-meta p-4 flex justify-between items-center">
            <div>
              <span class="creative-category text-xs fw-semibold text-tertiary">${item.category || 'photography'}</span>
              <h4 class="creative-title text-sm fw-medium text-primary">${item.title}</h4>
            </div>
            <i data-lucide="maximize-2" class="icon-sm text-tertiary" aria-hidden="true"></i>
          </div>
        </button>
      </div>
    `;
    container.innerHTML += itemHtml;
  });

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// --- Filters Setup (for Creative Works tab) ---
function setupCreativeFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  if (filterButtons.length) {
    filterButtons.forEach(button => {
      // Re-bind click event to prevent duplicates
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', () => {
        const filter = newButton.getAttribute('data-filter');
        const creativeItems = document.querySelectorAll('.creative-item');

        // Update active class
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        newButton.classList.add('active');

        // Show/Hide cards
        creativeItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            item.classList.remove('hidden');
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          } else {
            item.classList.add('hidden');
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
          }
        });
      });
    });
  }
}

// --- Detail Reader Modal Logic ---
function setupReaderModal() {
  const modal = document.getElementById('reader-modal');
  const closeBtn = document.querySelector('.reader-modal-close');
  const overlay = document.querySelector('.reader-modal-overlay');

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add('modal-hidden');
    document.body.style.overflow = '';
    // Clean up
    document.getElementById('reader-img').src = '';
    document.getElementById('reader-category').textContent = '';
    document.getElementById('reader-date').textContent = '';
    document.getElementById('reader-title').textContent = '';
    document.getElementById('reader-content').innerHTML = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('modal-hidden')) {
      closeModal();
    }
  });

  // Handle Delegated Clicks to trigger the Reader Modal
  document.addEventListener('click', (e) => {
    // 1. Projects read detail click
    const projectCard = e.target.closest('.project-card');
    const readMoreBtn = e.target.closest('.btn-read-more');
    const thumbClick = e.target.closest('.project-thumbnail-wrapper');

    if (projectCard && (readMoreBtn || thumbClick) && !e.target.closest('.project-links a')) {
      e.preventDefault();
      const slug = projectCard.getAttribute('data-slug');
      const project = loadedProjects.find(p => p.slug === slug);
      if (project) {
        openReaderModal(project, 'project');
      }
    }

    // 2. Blog read click
    const blogItem = e.target.closest('.blog-item');
    if (blogItem && !e.target.closest('.blog-item a.disabled')) {
      e.preventDefault();
      const slug = blogItem.getAttribute('data-slug');
      const post = loadedBlogs.find(b => b.slug === slug);
      if (post) {
        openReaderModal(post, 'blog');
      }
    }
  });
}

function openReaderModal(item, type) {
  const modal = document.getElementById('reader-modal');
  const img = document.getElementById('reader-img');
  const heroWrapper = document.getElementById('reader-hero-wrapper');
  const category = document.getElementById('reader-category');
  const date = document.getElementById('reader-date');
  const title = document.getElementById('reader-title');
  const content = document.getElementById('reader-content');

  if (!modal) return;

  if (type === 'project') {
    if (item.thumbnail) {
      img.src = item.thumbnail;
      heroWrapper.style.display = 'block';
    } else {
      heroWrapper.style.display = 'none';
    }
    category.textContent = item.category || 'Portfolio';
    date.textContent = item.status || 'Completed';
    date.className = 'reader-date-text pill status-' + (item.status || 'Active').toLowerCase().replace(' ', '-');
  } else if (type === 'blog') {
    heroWrapper.style.display = 'none';
    category.textContent = item.category || 'Cerpen';
    
    let dateFormatted = '';
    if (item.date) {
      const d = new Date(item.date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      dateFormatted = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
    date.textContent = dateFormatted;
    date.className = 'reader-date-text';
  }

  title.textContent = item.title;

  // Compile markdown with marked.js
  if (typeof marked !== 'undefined' && item.body) {
    content.innerHTML = marked.parse(item.body);
  } else {
    content.innerHTML = `<p>${(item.body || item.description || '').replace(/\n/g, '<br>')}</p>`;
  }

  modal.classList.remove('modal-hidden');
  document.body.style.overflow = 'hidden';

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// --- Lightbox Modal (for Creative Works tab) ---
function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (!lightbox || !lightboxImg || !lightboxCaption) return;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.gallery-trigger');
    if (trigger) {
      e.preventDefault();
      const img = trigger.querySelector('.creative-img');
      const title = trigger.querySelector('.creative-title').textContent;
      const category = trigger.querySelector('.creative-category').textContent;

      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = `${category.toUpperCase()} — ${title}`;
        lightbox.classList.remove('modal-hidden');
        document.body.style.overflow = 'hidden';
      }
    }
  });

  const closeLightbox = () => {
    lightbox.classList.add('modal-hidden');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  };

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('modal-hidden')) {
      closeLightbox();
    }
  });
}

// --- Subtle Ambient Background Glow ---
function setupCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    window.requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
    });
  });
}

// --- Scroll Reveal for Sections ---
function setupScrollReveal() {
  const sections = document.querySelectorAll('#content-nav, #tab-content, .footer-container');
  sections.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  sections.forEach(el => observer.observe(el));
}

// --- Core Initializer ---
async function initContent() {
  showSkeletons();
  
  // 1. Load Projects
  try {
    const data = await loadSectionData('projects');
    loadedProjects = data.length > 0 ? data : FALLBACK_DATA.projects;
  } catch (e) {
    console.error('Failed to load projects, loading fallback data', e);
    loadedProjects = FALLBACK_DATA.projects;
  }
  renderProjects(loadedProjects);

  // 2. Load Blog
  try {
    const data = await loadSectionData('blog');
    loadedBlogs = data.length > 0 ? data : FALLBACK_DATA.blog;
  } catch (e) {
    console.error('Failed to load blog, loading fallback data', e);
    loadedBlogs = FALLBACK_DATA.blog;
  }
  renderBlog(loadedBlogs);

  // 3. Load Creative Works
  let loadedCreative = [];
  try {
    const data = await loadSectionData('creative');
    loadedCreative = data.length > 0 ? data : FALLBACK_DATA.creative;
  } catch (e) {
    console.error('Failed to load creative gallery, loading fallback data', e);
    loadedCreative = FALLBACK_DATA.creative;
  }
  renderCreative(loadedCreative);

  // Bind filter actions on newly rendered items
  setupCreativeFilters();
}

// --- Load Profile Settings from CMS ---
async function loadProfileSettings() {
  const PROFILE_CACHE_KEY = CACHE_KEY_PREFIX + 'profile';
  
  // Try cache first
  const cached = localStorage.getItem(PROFILE_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
        applyProfileSettings(parsed.data);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse profile cache', e);
    }
  }

  // Fetch from GitHub
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/content/settings/profile.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Profile fetch: ${response.status}`);
    const fileData = await response.json();
    
    // Decode base64 content
    const content = JSON.parse(atob(fileData.content));
    
    // Cache it
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: content
      }));
    } catch (e) {
      console.warn('Failed to cache profile', e);
    }
    
    applyProfileSettings(content);
  } catch (e) {
    console.log('Using default profile settings (API unavailable)', e);
    // Apply defaults (already in HTML, so no action needed)
  }
}

function applyProfileSettings(profile) {
  if (!profile) return;
  
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const nicknameEl = document.getElementById('profile-nickname');
  const quoteEl = document.getElementById('profile-quote');
  const quoteSourceEl = document.getElementById('profile-quote-source');
  
  if (avatarEl && profile.avatar) {
    // Handle both absolute and relative paths
    const avatarSrc = profile.avatar.startsWith('/') 
      ? profile.avatar.substring(1) 
      : profile.avatar;
    avatarEl.src = avatarSrc;
  }
  if (nameEl && profile.name) nameEl.textContent = profile.name;
  if (nicknameEl && profile.nickname) nicknameEl.textContent = profile.nickname;
  if (quoteEl && profile.quote) quoteEl.textContent = `"${profile.quote}"`;
  if (quoteSourceEl && profile.quote_source) quoteSourceEl.textContent = `— ${profile.quote_source}`;
}

// --- Setup Hidden About Modal / Bottom Sheet ---
function setupAboutModal() {
  const aboutTrigger = document.getElementById('about-trigger');
  const aboutModal = document.getElementById('about-modal');
  const aboutOverlay = document.getElementById('about-overlay');
  const aboutClose = document.getElementById('about-close');

  if (!aboutModal) return;

  const openAboutModal = () => {
    aboutModal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeAboutModal = () => {
    aboutModal.classList.add('modal-hidden');
    document.body.style.overflow = '';
  };

  aboutTrigger?.addEventListener('click', openAboutModal);
  aboutClose?.addEventListener('click', closeAboutModal);
  aboutOverlay?.addEventListener('click', closeAboutModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutModal.classList.contains('modal-hidden')) {
      closeAboutModal();
    }
  });
}

// --- Run Application ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('ibnuwu portfolio initialized');
  
  // Lucide SVG Icons initial compile
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Setup cursor glow background light
  setupCursorGlow();

  // Setup scroll reveal animations
  setupScrollReveal();

  // Load Profile from CMS settings
  loadProfileSettings();

  // Load Content from Git/Local
  initContent();

  // Setup modals
  setupAboutModal();
  setupReaderModal();
  setupLightbox();
});

