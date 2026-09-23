/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-solicit. Base: table.
 * Source: https://www.panynj.gov/port-authority/en/business-opportunities/solicitations-advertisements/Construction.html
 * Generated: 2026-09-23
 *
 * Library convention (Table): multiple columns, multiple rows.
 *   Row 1 = block name.
 *   Each subsequent row = a data row; cells hold headers, labels, or data points.
 * Source: <table> with one or more <tbody> holding <tr>. First data <tr> is the
 *   header (th cells); later rows are data (td) with rich multi-link/paragraph cells.
 * Column count varies across the 3 table instances on the page (5 or 6 columns),
 *   and some tables carry empty <tbody> elements. The parser flattens all rows
 *   across every tbody, drops empty rows, and pads every row to the widest row so
 *   the emitted block table has a uniform column count.
 *
 * Iteration key: tr (rows) — structure.json repeatingUnitConsensus "tbody"/tr,
 *   iterationSafe true, no invalid nesting. Cells preserved as elements to keep
 *   links, paragraphs, and <br> line breaks.
 */
export default function parse(element, { document }) {
  // Collect every row across all tbody/thead sections (some tbodys are empty).
  const rows = Array.from(element.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr'));

  // Build cell arrays per row, skipping rows that have no cells at all.
  const dataRows = [];
  rows.forEach((tr) => {
    const cellEls = Array.from(tr.querySelectorAll(':scope > th, :scope > td'));
    if (cellEls.length === 0) return;

    const rowCells = cellEls.map((cellEl) => {
      // Preserve the cell's rich content (links, paragraphs, <br>). Move the
      // child nodes into an array so createBlock renders them, not the <td>/<th>.
      const nodes = Array.from(cellEl.childNodes);
      // A cell holding only whitespace/&nbsp; becomes an empty string.
      const text = cellEl.textContent.replace(/ /g, ' ').trim();
      if (nodes.length === 0 || text === '') return '';
      return nodes.length === 1 ? nodes[0] : nodes;
    });
    dataRows.push(rowCells);
  });

  // Empty-block guard.
  if (dataRows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Normalize every row to the widest column count (pad short rows with '').
  const columnCount = dataRows.reduce((max, r) => Math.max(max, r.length), 0);
  const cells = dataRows.map((row) => {
    while (row.length < columnCount) row.push('');
    return row;
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-solicit', cells });
  element.replaceWith(block);
}
