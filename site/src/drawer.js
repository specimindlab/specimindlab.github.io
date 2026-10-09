// The drawer's search box and filters (inlined into / by site/build.mjs). No requests, no storage:
// the state lives in the URL (?q=47&pillar=3D&verdict=Captured) so a filtered drawer can be shared.
(() => {
  const form = document.getElementById("finder");
  const q = document.getElementById("q");
  if (!form || !q) return;
  const items = [...document.querySelectorAll("[data-code]")];
  const drawers = [...document.querySelectorAll(".drawer")];
  const empties = [...document.querySelectorAll(".cell.empty")];
  const status = document.getElementById("status");
  const known = new Set(items.map((i) => i.dataset.code));
  const total = items.filter((i) => /^\d{3}$/.test(i.dataset.code)).length;

  // "47", "047", "#47", "Nº 47" -> "047"; "p1", "P-01" -> "P01". Anything else is a text search.
  const norm = (s) => {
    s = s.trim().toUpperCase().replace(/^(?:N\s*[º°O]\.?|#)\s*(?=\d)/, "");
    let m = s.match(/^0*(\d{1,3})$/);
    if (m) return m[1].padStart(3, "0");
    m = s.match(/^([PDMWX])\s*-?0*(\d{1,2})$/);
    return m ? m[1] + m[2].padStart(2, "0") : null;
  };
  const picked = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value || "";

  const apply = () => {
    const text = q.value.trim().toLowerCase();
    const code = norm(q.value);
    const digits = /^\d+$/.test(text) ? String(+text) : null;
    const pillar = picked("pillar");
    const verdict = picked("verdict");
    let shown = 0;
    for (const it of items) {
      const d = it.dataset;
      let ok = (!pillar || d.pillar === pillar || d.pillar === "All") && (!verdict || d.verdict === verdict);
      if (ok && text) {
        ok = code
          ? d.code === code || (digits !== null && /^\d{3}$/.test(d.code) && String(+d.code).startsWith(digits))
          : d.search.includes(text);
      }
      it.hidden = !ok;
      if (ok && /^\d{3}$/.test(d.code)) shown++;
    }
    const filtering = Boolean(text || pillar || verdict);
    for (const e of empties) e.hidden = filtering;
    for (const d of drawers) d.hidden = filtering && !d.querySelector("[data-code]:not([hidden])");
    if (code && !known.has(code)) status.textContent = `#${code} isn't here yet.`;
    else if (code) status.textContent = `#${code} is here. Press Enter to open it.`;
    else if (filtering) status.textContent = `${shown} of ${total} tests match.`;
    else status.textContent = "";
    const p = new URLSearchParams();
    if (q.value.trim()) p.set("q", q.value.trim());
    if (pillar) p.set("pillar", pillar);
    if (verdict) p.set("verdict", verdict);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = norm(q.value);
    if (code && known.has(code)) return void (location.href = `/${code}/`);
    const visible = items.filter((i) => !i.hidden);
    if (q.value.trim() && visible.length === 1) location.href = `/${visible[0].dataset.code}/`;
  });
  q.addEventListener("input", apply);
  form.addEventListener("change", apply);

  const p = new URLSearchParams(location.search);
  if (p.get("q")) q.value = p.get("q");
  for (const name of ["pillar", "verdict"]) {
    const v = p.get(name);
    const r = v && [...document.querySelectorAll(`input[name="${name}"]`)].find((i) => i.value === v);
    if (r) r.checked = true;
  }
  if ([...p.keys()].length) apply();
})();
