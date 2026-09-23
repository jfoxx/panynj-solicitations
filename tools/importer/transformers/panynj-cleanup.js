/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: panynj site-wide cleanup.
 *
 * NOTE ON DOM SOURCE: The import pipeline passes `document.body` as `element`
 * (see import-solicitations-advertisements.js). During import the browser loads
 * the fully client-side-rendered live SPA at the template URL, whose body
 * includes the global header/footer chrome and the Google Translate widget.
 * That chrome is NOT present in migration-work/cleaned.html (which captured only
 * the #main app-shell fragment), so all header/footer/translation selectors
 * below were verified live via Playwright against the rendered DOM of
 * https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html.
 *
 * Verified live DOM structure (2026-09-23):
 *   #page > div > #root.App
 *     > div.aem-GridColumn > #header  > a.skip-to-content, header.Header   (global header)
 *     > #main                                                              (authorable content)
 *     > div.aem-GridColumn > #footer  > footer.Footer                      (global footer)
 *   body > #goog-gt-tt, div.VIpgJd-yAWNEb-L7lbkb.skiptranslate             (Google Translate chrome)
 *   Translate <select> widget: #google_translate_element / .goog-te-combo   (inside footer.Footer)
 *   GTM + Facebook pixel tags live in <noscript> elements.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header (site shell / nav chrome). #header wrapper also holds the
      // skip-to-content link; header.Header is the header element itself.
      // Verified live: <div id="header"><a class="skip-to-content">…<header class="Header">…
      '#header',
      'header.Header',

      // Global footer (link groups, copyright, legal links). #footer wrapper
      // contains footer.Footer and the embedded Google Translate widget.
      // Verified live: <div id="footer"><footer class="Footer">…
      '#footer',
      'footer.Footer',

      // Google Translate / translation chrome. The <select> widget lives inside
      // the footer (removed above), but Google injects tooltip/menu nodes at
      // body level, outside #footer. Verified live: #goog-gt-tt (body child) and
      // div.VIpgJd-yAWNEb-L7lbkb.skiptranslate; #google_translate_element wraps
      // the .goog-te-combo select.
      '#google_translate_element',
      '#goog-gt-tt',
      '.skiptranslate',
      '.VIpgJd-yAWNEb-L7lbkb',

      // GTM + Facebook pixel tracking. Verified live: <noscript> tags containing
      // googletagmanager.com/ns.html iframe and facebook.com/tr pixels.
      'noscript',

      // Non-authorable breadcrumb navigation rendered inside .SimpleHero.
      // Verified live: <nav class="cmp-breadcrumb"> inside .SimpleHero-wrapper.
      'nav.cmp-breadcrumb',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Analytics / tracking chrome that renders as body-level content: Adobe
    // demdex ID-sync iframe link, The Trade Desk (adsrvr.org) pixel, Facebook
    // pixels, and the Google Translate widget icon. These are injected
    // asynchronously by third-party scripts, so some appear only after
    // beforeTransform has run — remove them here (the latest hook, just before
    // serialization) so late-injected nodes are also caught. Non-authorable.
    WebImporter.DOMUtils.remove(element, [
      'a[href*="demdex.net"]',
      'img[src*="adsrvr.org"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="translate_24dp"]',
      'img[src*="/translate/"]',
    ]);

    // Those tracking elements sit alone inside their own <p> wrappers; once the
    // link/img is removed the empty paragraph would linger, so drop any
    // paragraph left with no text and no media.
    element.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, iframe, svg')) {
        p.remove();
      }
    });

    // Strip AEM RTE authoring artifacts and empty id attributes left by the
    // in-place editor. Found in captured HTML: data-rte-editelement="true", id="".
    element.querySelectorAll('[data-rte-editelement]').forEach((el) => {
      el.removeAttribute('data-rte-editelement');
    });
    element.querySelectorAll('[id=""]').forEach((el) => {
      el.removeAttribute('id');
    });
  }
}
