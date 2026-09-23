/**
 * Walks back through immediately preceding advertisement blocks to find the
 * table that this group of adjacent blocks should share.
 * @param {Element} wrapper The block's wrapper div (main > .section > div)
 * @returns {HTMLTableElement|null}
 */
function findSharedTable(wrapper) {
  let sibling = wrapper.previousElementSibling;
  while (sibling) {
    const prevBlock = sibling.querySelector(':scope > .advertisement.block');
    if (!prevBlock) return null;
    const table = prevBlock.querySelector(':scope > table.advertisement-table');
    if (table) return table;
    sibling = sibling.previousElementSibling;
  }
  return null;
}

export default function decorate(block) {
  // 🔹 Remove "button" class from any links inside this block
  block.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button');
  });

  const ad = block.closest('.advertisement') || block;
  if (!ad) return;

  // Collect data
  const data = {};
  ad.querySelectorAll(':scope > div').forEach((section) => {
    const label = section.querySelector(':scope > div:first-of-type')?.textContent?.trim();
    const value = section.querySelector(':scope > div:nth-of-type(2)');
    if (label && value) {
      // normalize label to a safe key like "contractnumber"
      const key = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      data[key] = value.cloneNode(true);
    }
  });

  // Extract relevant fields (safe, lint-clean)
  // label is authored as "Contract Number(Link to ad)", so match by prefix
  const contractNumberKey = Object.keys(data).find((key) => key.startsWith('contractnumber'));
  const contractNumber = contractNumberKey && data[contractNumberKey];
  const dueDate = data.duedate?.textContent?.trim() || '';
  const description = data.description || '';
  const solicitationDoc = data.solicitationdocument || '';
  const responseDoc = data.response || data.responsetobiddersquestions || '';

  // Build data row
  const row = document.createElement('tr');

  // Contract Number cell (the value div itself contains the ad link)
  const tdContract = document.createElement('td');
  const contractLink = contractNumber?.querySelector('a');
  const contractText = contractLink?.textContent?.trim() || contractNumber?.textContent?.trim();
  if (contractText) {
    const link = document.createElement('a');
    link.href = contractLink?.href || '#';
    link.textContent = contractText;
    tdContract.append(link);
  } else {
    tdContract.textContent = '';
  }

  const tdDue = document.createElement('td');
  tdDue.textContent = dueDate;

  const tdDesc = document.createElement('td');
  tdDesc.innerHTML = description.innerHTML || '';

  const tdSolicit = document.createElement('td');
  tdSolicit.innerHTML = solicitationDoc.innerHTML || '';

  const tdResponse = document.createElement('td');
  tdResponse.innerHTML = responseDoc.innerHTML || '';

  row.append(tdContract, tdDue, tdDesc, tdSolicit, tdResponse);

  // If immediately adjacent to another advertisement block, join its table
  // instead of rendering a separate one-row table.
  const wrapper = block.parentElement;
  const sharedTable = wrapper && findSharedTable(wrapper);
  if (sharedTable) {
    sharedTable.querySelector('tbody').append(row);
    block.textContent = '';
    if (wrapper) wrapper.style.display = 'none';
    return;
  }

  // Build table
  const table = document.createElement('table');
  table.classList.add('advertisement-table');

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  [
    'Contract Number (Link to ad)',
    'Due Date',
    'Description',
    'Solicitation Document',
    'Response to Bidder’s Questions',
  ].forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement('tbody');
  tbody.append(row);
  table.append(tbody);

  // Replace contents
  block.textContent = '';
  block.append(table);
}
