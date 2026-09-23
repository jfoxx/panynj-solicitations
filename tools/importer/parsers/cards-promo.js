/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards (no-images variant).
 * Source: https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html
 * Generated: 2026-09-23
 *
 * Library convention (Cards, no images): 1 column, multiple rows.
 *   Row 1 = block name.
 *   Each subsequent row = one card cell containing:
 *     Heading (optional), Description (optional), CTA link (optional).
 * Source (.CTABreakerList) has .CTABreakerList-layout > div.CTABreaker (×3), each with:
 *   .CTABreaker-title (h4 > a linked title), .CTABreaker-subtitle (h5), a.CTABreaker-link (CTA).
 * Iteration: div.CTABreaker — structure.json repeatingUnits[0], count 3, iterationSafe true,
 *   not nested inside another interactive element (no invalid nesting).
 */
export default function parse(element, { document }) {
  // Iterate the stable card wrapper (block-level div, not an inline anchor).
  const cardEls = Array.from(element.querySelectorAll(':scope .CTABreaker'));

  // Empty-block guard.
  if (cardEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // First row: block name (added by createBlock).
  const cells = [];

  cardEls.forEach((card) => {
    const cellContent = [];

    // Linked title heading — keep the heading element (it wraps the anchor).
    const title = card.querySelector('.CTABreaker-title, [class*="title"] h4, h4, h3, h2');
    if (title) cellContent.push(title);

    // Subtitle / description.
    const subtitle = card.querySelector('.CTABreaker-subtitle, [class*="subtitle"], h5, p');
    if (subtitle) cellContent.push(subtitle);

    // Bottom CTA link ("Learn More" / "Visit Website").
    const cta = card.querySelector('a.CTABreaker-link, a[class*="text-arrow"], a.Link--text-arrow-right');
    if (cta) cellContent.push(cta);

    // One card = one row with a single cell (1-column no-images cards).
    cells.push([cellContent]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);
}
