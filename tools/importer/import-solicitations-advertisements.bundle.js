/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-solicitations-advertisements.js
  var import_solicitations_advertisements_exports = {};
  __export(import_solicitations_advertisements_exports, {
    default: () => import_solicitations_advertisements_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document: document2 }) {
    let heading = element.querySelector(".Title h1, .Title h2, .SimpleHero-wrapper h1, h1, h2");
    const titleContainer = element.querySelector('.Title, [class*="title"]');
    if (!heading && titleContainer) {
      const text = titleContainer.textContent.trim();
      if (text) {
        heading = document2.createElement("h1");
        heading.textContent = text;
      }
    }
    const subheading = element.querySelector('.SubTitle, [class*="subtitle"]');
    const ctaLinks = Array.from(element.querySelectorAll("a.button, a.cta, .SimpleHero-cta a"));
    const bgImage = element.querySelector('img[class*="background"], img[class*="bg"], picture img');
    if (!heading && !subheading && !bgImage && ctaLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) cells.push([bgImage]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading) contentCell.push(subheading);
    contentCell.push(...ctaLinks);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-solicit.js
  function parse2(element, { document: document2 }) {
    const rows = Array.from(element.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr"));
    const dataRows = [];
    rows.forEach((tr) => {
      const cellEls = Array.from(tr.querySelectorAll(":scope > th, :scope > td"));
      if (cellEls.length === 0) return;
      const rowCells = cellEls.map((cellEl) => {
        const nodes = Array.from(cellEl.childNodes);
        const text = cellEl.textContent.replace(/ /g, " ").trim();
        if (nodes.length === 0 || text === "") return "";
        return nodes.length === 1 ? nodes[0] : nodes;
      });
      dataRows.push(rowCells);
    });
    if (dataRows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const columnCount = dataRows.reduce((max, r) => Math.max(max, r.length), 0);
    const cells = dataRows.map((row) => {
      while (row.length < columnCount) row.push("");
      return row;
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-solicit", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  function parse3(element, { document: document2 }) {
    const cardEls = Array.from(element.querySelectorAll(":scope .CTABreaker"));
    if (cardEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cardEls.forEach((card) => {
      const cellContent = [];
      const title = card.querySelector('.CTABreaker-title, [class*="title"] h4, h4, h3, h2');
      if (title) cellContent.push(title);
      const subtitle = card.querySelector('.CTABreaker-subtitle, [class*="subtitle"], h5, p');
      if (subtitle) cellContent.push(subtitle);
      const cta = card.querySelector('a.CTABreaker-link, a[class*="text-arrow"], a.Link--text-arrow-right');
      if (cta) cellContent.push(cta);
      cells.push([cellContent]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/panynj-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global header (site shell / nav chrome). #header wrapper also holds the
        // skip-to-content link; header.Header is the header element itself.
        // Verified live: <div id="header"><a class="skip-to-content">…<header class="Header">…
        "#header",
        "header.Header",
        // Global footer (link groups, copyright, legal links). #footer wrapper
        // contains footer.Footer and the embedded Google Translate widget.
        // Verified live: <div id="footer"><footer class="Footer">…
        "#footer",
        "footer.Footer",
        // Google Translate / translation chrome. The <select> widget lives inside
        // the footer (removed above), but Google injects tooltip/menu nodes at
        // body level, outside #footer. Verified live: #goog-gt-tt (body child) and
        // div.VIpgJd-yAWNEb-L7lbkb.skiptranslate; #google_translate_element wraps
        // the .goog-te-combo select.
        "#google_translate_element",
        "#goog-gt-tt",
        ".skiptranslate",
        ".VIpgJd-yAWNEb-L7lbkb",
        // GTM + Facebook pixel tracking. Verified live: <noscript> tags containing
        // googletagmanager.com/ns.html iframe and facebook.com/tr pixels.
        "noscript",
        // Non-authorable breadcrumb navigation rendered inside .SimpleHero.
        // Verified live: <nav class="cmp-breadcrumb"> inside .SimpleHero-wrapper.
        "nav.cmp-breadcrumb"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        'a[href*="demdex.net"]',
        'img[src*="adsrvr.org"]',
        'img[src*="facebook.com/tr"]',
        'img[src*="translate_24dp"]',
        'img[src*="/translate/"]'
      ]);
      element.querySelectorAll("p").forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector("img, picture, iframe, svg")) {
          p.remove();
        }
      });
      element.querySelectorAll("[data-rte-editelement]").forEach((el) => {
        el.removeAttribute("data-rte-editelement");
      });
      element.querySelectorAll('[id=""]').forEach((el) => {
        el.removeAttribute("id");
      });
    }
  }

  // tools/importer/transformers/panynj-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-solicitations-advertisements.js
  var parsers = {
    "hero-banner": parse,
    "table-solicit": parse2,
    "cards-promo": parse3
  };
  var PAGE_TEMPLATE = {
    name: "solicitations-advertisements",
    description: "Construction solicitations/advertisements listing page with a hero banner, intro guidance content, multiple solicitation data tables, and a promotional CTA card row.",
    urls: [
      "https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".SimpleHero"]
      },
      {
        name: "table-solicit",
        instances: [".AppPage table", ".Text table"]
      },
      {
        name: "cards-promo",
        instances: [".CTABreakerList"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "hero",
        selector: [".SimpleHero"],
        style: null,
        blocks: ["hero-banner"],
        defaultContent: []
      },
      {
        id: "section-2",
        name: "body",
        selector: ["#main .AppPage", ".AppPage"],
        style: null,
        blocks: ["table-solicit"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "cta-breaker",
        selector: [".CTABreakerList"],
        style: "gray",
        blocks: ["cards-promo"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var TRACKING_SELECTORS = [
    'a[href*="demdex.net"]',
    'img[src*="adsrvr.org"]',
    'img[src*="facebook.com/tr"]',
    'img[src*="translate_24dp"]',
    'img[src*="/translate/"]'
  ];
  function stripTracking(root) {
    root.querySelectorAll(TRACKING_SELECTORS.join(",")).forEach((el) => {
      const wrapper = el.closest("p");
      el.remove();
      if (wrapper && !wrapper.textContent.trim() && !wrapper.querySelector("img, picture, iframe, svg")) {
        wrapper.remove();
      }
    });
  }
  var import_solicitations_advertisements_default = {
    /**
     * Runs before transform. Third-party scripts inject tracking chrome (demdex,
     * Google Translate, ad pixels) at unpredictable times — including during the
     * async markdown conversion that happens after transform() returns, which a
     * one-shot sweep can't catch. Install a MutationObserver that deletes matching
     * nodes as they appear, for the whole page lifetime, plus one immediate sweep.
     */
    onLoad: ({ document: document2 }) => {
      const isTracking = (node) => {
        if (!node || node.nodeType !== 1) return false;
        if (typeof node.matches === "function" && node.matches(TRACKING_SELECTORS.join(","))) return true;
        return typeof node.querySelector === "function" && !!node.querySelector(TRACKING_SELECTORS.join(","));
      };
      const guard = (proto, method) => {
        const original = proto[method];
        if (typeof original !== "function") return;
        proto[method] = function(...nodes) {
          if (nodes.some(isTracking)) return nodes[0];
          return original.apply(this, nodes);
        };
      };
      try {
        guard(Node.prototype, "appendChild");
        guard(Node.prototype, "insertBefore");
        if (typeof Element !== "undefined") {
          guard(Element.prototype, "append");
          guard(Element.prototype, "prepend");
        }
      } catch (e) {
      }
      document2.querySelectorAll("script").forEach((s) => {
        const src = s.getAttribute("src") || "";
        const txt = s.textContent || "";
        if (/adobedtm\.com|demdex|dpm\.|appmeasurement|visitorapi/i.test(src) || /_satellite|demdex|Visitor\.getInstance|AppMeasurement/i.test(txt)) {
          s.remove();
        }
      });
      stripTracking(document2);
    },
    transform: (payload) => {
      const { document: document2, url, html, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      stripTracking(document2);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const output = main.cloneNode(true);
      console.log(`[tracking] clone demdex before strip: ${output.querySelectorAll('a[href*="demdex.net"]').length}; live doc demdex: ${document2.querySelectorAll('a[href*="demdex.net"]').length}`);
      stripTracking(output);
      console.log(`[tracking] clone demdex after strip: ${output.querySelectorAll('a[href*="demdex.net"]').length}`);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: output,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_solicitations_advertisements_exports);
})();
