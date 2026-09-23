/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import tableSolicitParser from './parsers/table-solicit.js';
import cardsPromoParser from './parsers/cards-promo.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/panynj-cleanup.js';
import sectionsTransformer from './transformers/panynj-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'table-solicit': tableSolicitParser,
  'cards-promo': cardsPromoParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'solicitations-advertisements',
  description: 'Construction solicitations/advertisements listing page with a hero banner, intro guidance content, multiple solicitation data tables, and a promotional CTA card row.',
  urls: [
    'https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.SimpleHero'],
    },
    {
      name: 'table-solicit',
      instances: ['.AppPage table', '.Text table'],
    },
    {
      name: 'cards-promo',
      instances: ['.CTABreakerList'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'hero',
      selector: ['.SimpleHero'],
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'body',
      selector: ['#main .AppPage', '.AppPage'],
      style: null,
      blocks: ['table-solicit'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'cta-breaker',
      selector: ['.CTABreakerList'],
      style: 'gray',
      blocks: ['cards-promo'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first; section transformer runs when 2+ sections
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document
 * @param {Object} template
 * @returns {Array} block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // A block may match multiple selectors (e.g. table via two selectors) — dedupe by element.
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// Selectors for async-injected analytics/tracking chrome (Adobe demdex ID-sync
// link, ad pixels, Google Translate widget icon). Non-authorable.
const TRACKING_SELECTORS = [
  'a[href*="demdex.net"]',
  'img[src*="adsrvr.org"]',
  'img[src*="facebook.com/tr"]',
  'img[src*="translate_24dp"]',
  'img[src*="/translate/"]',
];

/**
 * Remove tracking nodes (and their now-empty <p> wrappers) from a root.
 * @param {Document|Element} root
 */
function stripTracking(root) {
  root.querySelectorAll(TRACKING_SELECTORS.join(',')).forEach((el) => {
    const wrapper = el.closest('p');
    el.remove();
    if (wrapper && !wrapper.textContent.trim()
      && !wrapper.querySelector('img, picture, iframe, svg')) {
      wrapper.remove();
    }
  });
}

// EXPORT DEFAULT CONFIGURATION
export default {
  /**
   * Runs before transform. Third-party scripts inject tracking chrome (demdex,
   * Google Translate, ad pixels) at unpredictable times — including during the
   * async markdown conversion that happens after transform() returns, which a
   * one-shot sweep can't catch. Install a MutationObserver that deletes matching
   * nodes as they appear, for the whole page lifetime, plus one immediate sweep.
   */
  onLoad: ({ document }) => {
    // Adobe Launch (already running in memory) injects tracking chrome — the
    // demdex ID-sync <a>, Google Translate widget, ad pixels — into the live
    // document.body asynchronously. html2md's markdown conversion reads that
    // live body, and the injection lands mid-conversion, after transform() has
    // returned — too late for any synchronous sweep or MutationObserver
    // microtask. The only timing-independent fix is to reject the nodes at the
    // moment of insertion, so patch the DOM insertion methods to drop any node
    // (or subtree) that matches a tracking selector.
    const isTracking = (node) => {
      if (!node || node.nodeType !== 1) return false;
      if (typeof node.matches === 'function' && node.matches(TRACKING_SELECTORS.join(','))) return true;
      return typeof node.querySelector === 'function'
        && !!node.querySelector(TRACKING_SELECTORS.join(','));
    };
    const guard = (proto, method) => {
      const original = proto[method];
      if (typeof original !== 'function') return;
      // eslint-disable-next-line no-param-reassign, func-names
      proto[method] = function (...nodes) {
        if (nodes.some(isTracking)) return nodes[0];
        return original.apply(this, nodes);
      };
    };
    try {
      guard(Node.prototype, 'appendChild');
      guard(Node.prototype, 'insertBefore');
      if (typeof Element !== 'undefined') {
        guard(Element.prototype, 'append');
        guard(Element.prototype, 'prepend');
      }
    } catch (e) {
      // Prototype patch unavailable — the sweeps below still run.
    }

    // Remove the analytics <script> tags and strip anything already injected.
    document.querySelectorAll('script').forEach((s) => {
      const src = s.getAttribute('src') || '';
      const txt = s.textContent || '';
      if (/adobedtm\.com|demdex|dpm\.|appmeasurement|visitorapi/i.test(src)
        || /_satellite|demdex|Visitor\.getInstance|AppMeasurement/i.test(txt)) {
        s.remove();
      }
    });
    stripTracking(document);
  },

  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 4b. Sweep async-injected tracking chrome from the live document.
    stripTracking(document);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5b. Detach the result from the live DOM. html2md serializes asynchronously,
    // and Adobe Launch (already running in memory) injects the demdex ID-sync
    // <a> into the live document.body during that await — too late for any
    // synchronous sweep. Returning a deep clone, swept once more, gives the
    // serializer a static tree Launch can no longer mutate.
    const output = main.cloneNode(true);
    console.log(`[tracking] clone demdex before strip: ${output.querySelectorAll('a[href*="demdex.net"]').length}; live doc demdex: ${document.querySelectorAll('a[href*="demdex.net"]').length}`);
    stripTracking(output);
    console.log(`[tracking] clone demdex after strip: ${output.querySelectorAll('a[href*="demdex.net"]').length}`);

    // 6. Generate sanitized path (map root URL to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: output,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
