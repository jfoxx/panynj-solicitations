// Header / navigation block.
// Content-first: all labels, links, and images live in /content/nav.plain.html.
// This module fetches that fragment and builds the header UI (primary nav,
// a click-triggered "More" megamenu, and utility controls). All functions are
// generic and data-driven — no site-specific names.

const MOBILE_QUERY = window.matchMedia('(max-width: 899px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch: /content first
 * (localhost / aem up), then site root (DA/EDS production).
 * @returns {Promise<Document|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // The fragment uses relative image paths (validator requirement). Resolve them
  // against the nav content root so they load regardless of the page's own path.
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !/^https?:/i.test(src)) {
      img.setAttribute('src', `/content/${src}`);
    }
  });
  return doc;
}

/** Build an SVG icon by name (utility controls are created in JS, not the fragment). */
function icon(name) {
  const svgs = {
    favorite: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.9-10-9.3C.6 8.5 2 5 5.3 5c2 0 3.3 1.2 4 2.3C10 6.2 11.4 5 13.4 5 16.7 5 18 8.5 16.7 11.7 14.2 16.1 12 21 12 21z"/></svg>',
    accessibility: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 5.5-5 .9V20h-2v-5h-2v5H9V10.4l-5-.9V7.5l8 1.5 8-1.5v2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>',
  };
  const span = document.createElement('span');
  span.className = `nav-icon nav-icon-${name}`;
  span.innerHTML = svgs[name] || '';
  return span;
}

export default async function decorate(block) {
  const doc = await fetchNav();
  block.textContent = '';
  if (!doc) return;

  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  // Section 0 = logo, 1 = primary nav, 2 = "More" heading, 3+ = megamenu columns.
  const logoSection = sections[0];
  const primarySection = sections[1];
  const moreSection = sections[2];
  const columnSections = sections.slice(3);

  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // --- Brand / logo ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (logoSection) brand.append(...logoSection.childNodes);
  nav.append(brand);

  // --- Primary nav + More trigger ---
  const primary = document.createElement('div');
  primary.className = 'nav-primary';
  if (primarySection) {
    const list = primarySection.querySelector('ul');
    if (list) primary.append(list);
  }

  // "More" megamenu built from the flat column sections.
  const hasMore = moreSection && columnSections.length > 0;
  let moreWrapper;
  if (hasMore) {
    const moreLabel = (moreSection.textContent || 'More').trim();
    moreWrapper = document.createElement('div');
    moreWrapper.className = 'nav-more';

    const trigger = document.createElement('button');
    trigger.className = 'nav-more-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.innerHTML = `<span>${moreLabel}</span><span class="nav-more-chevron" aria-hidden="true"></span>`;

    const panel = document.createElement('div');
    panel.className = 'nav-more-panel';
    columnSections.forEach((col) => {
      const column = document.createElement('div');
      column.className = 'nav-more-column';
      column.append(...col.childNodes);

      // Turn the column heading into an accordion toggle. It does nothing on
      // desktop (CSS keeps the list open) but drives expand/collapse on mobile.
      const heading = column.querySelector('h6');
      const list = column.querySelector('ul');
      if (heading && list) {
        const toggle = document.createElement('button');
        toggle.className = 'nav-more-accordion';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = `<span>${heading.textContent}</span><span class="nav-accordion-chevron" aria-hidden="true"></span>`;
        toggle.addEventListener('click', () => {
          const open = toggle.getAttribute('aria-expanded') === 'true';
          toggle.setAttribute('aria-expanded', String(!open));
          column.classList.toggle('is-expanded', !open);
        });
        heading.replaceWith(toggle);
      }
      panel.append(column);
    });

    trigger.addEventListener('click', () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      moreWrapper.classList.toggle('is-open', !open);
    });

    moreWrapper.append(trigger, panel);
    primary.append(moreWrapper);
  }
  nav.append(primary);

  // --- Utility controls (built in JS, not the fragment) ---
  const tools = document.createElement('div');
  tools.className = 'nav-tools';

  const favorite = document.createElement('button');
  favorite.className = 'nav-tool';
  favorite.setAttribute('aria-label', 'Page Favorite');
  favorite.append(icon('favorite'));

  const accessibility = document.createElement('button');
  accessibility.className = 'nav-tool';
  accessibility.setAttribute('aria-label', 'Accessibility');
  accessibility.append(icon('accessibility'));

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'nav-search';
  const searchToggle = document.createElement('button');
  searchToggle.className = 'nav-tool';
  searchToggle.setAttribute('aria-label', 'Search Port Authority');
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.append(icon('search'));
  const searchForm = document.createElement('form');
  searchForm.className = 'nav-search-form';
  searchForm.setAttribute('role', 'search');
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Search Port Authority';
  searchInput.setAttribute('aria-label', 'Search Port Authority');
  searchForm.append(searchInput);
  searchToggle.addEventListener('click', () => {
    const open = searchToggle.getAttribute('aria-expanded') === 'true';
    searchToggle.setAttribute('aria-expanded', String(!open));
    searchWrapper.classList.toggle('is-open', !open);
    if (!open) searchInput.focus();
  });
  searchWrapper.append(searchToggle, searchForm);

  tools.append(favorite, accessibility, searchWrapper);
  nav.append(tools);

  // --- Mobile hamburger toggle ---
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open navigation menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!open));
    hamburger.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
    nav.classList.toggle('is-mobile-open', !open);
  });
  nav.prepend(hamburger);

  // Reset transient state when crossing the desktop/mobile breakpoint.
  const onBreakpointChange = () => {
    nav.classList.remove('is-mobile-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    if (moreWrapper) {
      moreWrapper.classList.remove('is-open');
      moreWrapper.querySelector('.nav-more-trigger')?.setAttribute('aria-expanded', 'false');
    }
    searchWrapper.classList.remove('is-open');
    searchToggle.setAttribute('aria-expanded', 'false');
  };
  MOBILE_QUERY.addEventListener('change', onBreakpointChange);

  block.append(nav);
}
