// app.js — Wedding Seating Lookup

(function () {
  'use strict';

  // ── State ─────────────────────────────────────────────
  let guestList = [];
  let debounceTimer = null;

  // ── Init ───────────────────────────────────────────────
  function init() {
    // Always load directly from guests.js — never cache locally
    // This ensures updates to guests.js are always reflected immediately
    if (window.GUEST_LIST && window.GUEST_LIST.length) {
      guestList = window.GUEST_LIST;
    }

    // Clear any old cached data from previous versions
    localStorage.removeItem('weddingGuestList');

    bindEvents();
    registerServiceWorker();
  }

  function bindEvents() {
    const firstIn = document.getElementById('firstName');
    const lastIn  = document.getElementById('lastName');

    // Enter key submits
    [firstIn, lastIn].forEach(el => {
      el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
      el.addEventListener('input', onTyping);
    });

    // Drag-and-drop on upload area
    const uploadLabel = document.getElementById('upload-label');
    if (uploadLabel) {
      uploadLabel.addEventListener('dragover', e => { e.preventDefault(); uploadLabel.classList.add('drag-over'); });
      uploadLabel.addEventListener('dragleave', () => uploadLabel.classList.remove('drag-over'));
      uploadLabel.addEventListener('drop', e => {
        e.preventDefault();
        uploadLabel.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) processCSVFile(file);
      });
    }
  }

  // ── Live search as you type ────────────────────────────
  function onTyping() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(showLiveResults, 180);
  }

  function showLiveResults() {
    const container = document.getElementById('live-results');
    const first = val('firstName');
    const last  = val('lastName');

    if (first.length < 2 && last.length < 2) { container.innerHTML = ''; return; }

    const matches = search(first, last);
    container.innerHTML = '';

    if (matches.length === 0 || matches.length > 8) return;

    matches.slice(0, 5).forEach(g => {
      const item = document.createElement('div');
      item.className = 'live-result-item';
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `${g.firstName} ${g.lastName}, Table ${g.table}`);
      item.innerHTML = `
        <span class="live-result-name">${esc(g.firstName)} ${esc(g.lastName)}</span>
        <span class="live-result-table">Table ${esc(g.table)}</span>`;
      item.addEventListener('click', () => showResult([g]));
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showResult([g]); });
      container.appendChild(item);
    });
  }

  // ── Search ─────────────────────────────────────────────
  function search(first, last) {
    const f = norm(first);
    const l = norm(last);
    if (!f && !l) return [];

    return guestList.filter(g => {
      const gf = norm(g.firstName);
      const gl = norm(g.lastName);
      const full = gf + ' ' + gl;

      if (f && l) {
        // Both provided: partial match on each
        return gf.includes(f) && gl.includes(l);
      } else if (f) {
        return gf.includes(f) || full.includes(f);
      } else {
        return gl.includes(l);
      }
    });
  }

  // ── Handle search button ───────────────────────────────
  window.handleSearch = function () {
    const first = val('firstName');
    const last  = val('lastName');

    if (!first && !last) {
      shake(document.getElementById('firstName'));
      return;
    }

    const matches = search(first, last);
    document.getElementById('live-results').innerHTML = '';
    showResult(matches);
  };

  // ── Show result view ───────────────────────────────────
  function showResult(matches) {
    hide('view-search');
    show('view-result');

    hide('result-found');
    hide('result-multiple');
    hide('result-notfound');

    if (matches.length === 0) {
      show('result-notfound');
    } else if (matches.length === 1) {
      renderFound(matches[0]);
    } else {
      renderMultiple(matches);
    }
  }

  function renderFound(g) {
    document.getElementById('result-name').textContent = `${g.firstName} ${g.lastName}`.trim();
    document.getElementById('table-number').textContent = g.table;

    // Optional extras
    const extraEl = document.getElementById('extra-info');
    const mealEl  = document.getElementById('meal-info');
    const seatEl  = document.getElementById('seat-info');
    let hasExtra  = false;

    if (g.meal) {
      mealEl.innerHTML = `Meal choice: <span>${esc(g.meal)}</span>`;
      show('meal-info'); hasExtra = true;
    } else { hide('meal-info'); }

    if (g.seat) {
      seatEl.innerHTML = `Seat number: <span>${esc(g.seat)}</span>`;
      show('seat-info'); hasExtra = true;
    } else { hide('seat-info'); }

    hasExtra ? show('extra-info') : hide('extra-info');
    show('result-found');
  }

  function renderMultiple(matches) {
    const list = document.getElementById('multiple-list');
    list.innerHTML = '';
    matches.forEach(g => {
      const item = document.createElement('div');
      item.className = 'match-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.innerHTML = `
        <span class="match-name">${esc(g.firstName)} ${esc(g.lastName)}</span>
        <span class="match-table">Table ${esc(g.table)}</span>`;
      item.addEventListener('click', () => renderFound(g));
      item.addEventListener('keydown', e => { if (e.key === 'Enter') renderFound(g); });
      list.appendChild(item);
    });
    show('result-multiple');
  }

  // ── Go back ────────────────────────────────────────────
  window.goBack = function () {
    hide('view-result');
    show('view-search');
  };

  // ── Admin panel ────────────────────────────────────────
  window.toggleAdmin = function () {
    const panel = document.getElementById('admin-panel');
    panel.classList.toggle('hidden');
  };

  window.handleCSVUpload = function (event) {
    const file = event.target.files[0];
    if (file) processCSVFile(file);
  };

  function processCSVFile(file) {
    if (!file.name.endsWith('.csv')) {
      setStatus('Please upload a .csv file.'); return;
    }
    const reader = new FileReader();
    reader.onload = e => parseAndSaveCSV(e.target.result);
    reader.readAsText(file);
  }

  window.loadPastedCSV = function () {
    const text = document.getElementById('csv-paste').value.trim();
    if (!text) { setStatus('Please paste CSV data first.'); return; }
    parseAndSaveCSV(text);
  };

  function parseAndSaveCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) { setStatus('CSV must have a header row and at least one guest.'); return; }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const fIdx = findCol(headers, ['first name', 'firstname', 'first']);
    const lIdx = findCol(headers, ['last name', 'lastname', 'last']);
    const tIdx = findCol(headers, ['table', 'table number', 'table #', 'tableno']);
    const mIdx = findCol(headers, ['meal', 'meal choice', 'food']);
    const sIdx = findCol(headers, ['seat', 'seat number', 'seat #']);

    if (fIdx < 0 || tIdx < 0) {
      setStatus('CSV must have "First Name" and "Table" columns.'); return;
    }

    const guests = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      if (!cols[fIdx] && !cols[lIdx]) continue;
      const g = {
        firstName: (cols[fIdx] || '').trim(),
        lastName:  (lIdx >= 0 ? cols[lIdx] : '') || '',
        table:     (cols[tIdx] || '').trim()
      };
      if (mIdx >= 0 && cols[mIdx]) g.meal = cols[mIdx].trim();
      if (sIdx >= 0 && cols[sIdx]) g.seat = cols[sIdx].trim();
      guests.push(g);
    }

    if (guests.length === 0) { setStatus('No valid guests found in CSV.'); return; }

    guestList = guests;
    setStatus(`✓ ${guests.length} guests loaded successfully!`);
  }

  function findCol(headers, names) {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function splitCSVLine(line) {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
      else { cur += c; }
    }
    result.push(cur);
    return result;
  }

  function setStatus(msg) {
    const el = document.getElementById('upload-status');
    if (el) el.textContent = msg;
  }

  // ── Service Worker (offline caching) ──────────────────
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  // ── Helpers ────────────────────────────────────────────
  function norm(str) { return (str || '').toLowerCase().trim(); }
  function val(id)   { return (document.getElementById(id)?.value || '').trim(); }
  function esc(str)  {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
  function show(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  }
  function hide(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('active'); el.classList.add('hidden'); }
  }
  function shake(el) {
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = 'shake 0.4s ease';
    });
  }

  // CSS shake animation (injected once)
  const style = document.createElement('style');
  style.textContent = `@keyframes shake {
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 60%{transform:translateX(8px)} 80%{transform:translateX(-4px)}
  }`;
  document.head.appendChild(style);

  // ── Start ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
