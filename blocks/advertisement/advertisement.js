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
  const contractNumber = data.contractnumber;
  const advertisementLink = data.advertisementlink?.querySelector('a')?.href;
  const dueDate = data.duedate?.textContent?.trim() || '';
  const description = data.description || '';
  const solicitationDoc = data.solicitationdocument || '';
  const responseDoc = data.response || data.responsetobiddersquestions || '';

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
  const row = document.createElement('tr');

  // Contract Number cell (make link)
  const tdContract = document.createElement('td');
  const contractText = contractNumber?.textContent?.trim();
  if (contractText) {
    const link = document.createElement('a');
    link.href = advertisementLink || '#';
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
  tbody.append(row);
  table.append(tbody);

  // Replace contents
  block.textContent = '';
  block.append(table);
}
