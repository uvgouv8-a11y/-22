(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- التبويبات ---------- */
  $$(".tabbar button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".tabbar button").forEach((x) => x.classList.toggle("on", x === b));
      $$(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-" + b.dataset.tab));
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
  );

  /* ---------- الملخصات ---------- */
  let part = "الكل";
  let query = "";
  const parts = ["الكل", ...new Set(SUMMARIES.map((s) => s.part))];

  function blockHtml(b) {
    let h = `<div class="blk"><h4>${esc(b.h)}</h4>`;
    if (b.p) h += `<p>${esc(b.p)}</p>`;
    if (b.list) h += `<ul>${b.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    if (b.table) {
      h += `<div class="tbl"><table><thead><tr>${b.table.head.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>`;
      h += b.table.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("");
      h += `</tbody></table></div>`;
    }
    return h + "</div>";
  }
  const plain = (s) =>
    [s.title, ...s.blocks.flatMap((b) => [b.h, b.p || "", ...(b.list || []), ...(b.table ? [...b.table.head, ...b.table.rows.flat()] : [])])].join(" ");

  function renderSummaries() {
    const box = $("#summaries");
    const list = SUMMARIES.filter((s) => (part === "الكل" || s.part === part) && (!query || plain(s).includes(query)));
    if (!list.length) { box.innerHTML = `<div class="empty">مفيش نتائج 🤷‍♂️</div>`; return; }
    let html = "", last = "";
    list.forEach((s) => {
      if (part === "الكل" && s.part !== last) { html += `<h3 class="part-title">${esc(s.part)}</h3>`; last = s.part; }
      const n = SUMMARIES.indexOf(s) + 1;
      html += `<details class="sum" ${query ? "open" : ""}><summary><span class="num">${n}</span>${esc(s.title)}</summary><div class="sum-body">${s.blocks.map(blockHtml).join("")}</div></details>`;
    });
    box.innerHTML = html;
    if (query) {
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      $$("#summaries .blk p, #summaries .blk li, #summaries .blk td, #summaries .blk h4").forEach((el) => {
        if (el.textContent.includes(query)) el.innerHTML = el.innerHTML.replace(re, (m) => `<mark>${m}</mark>`);
      });
    }
  }
  $("#chips").innerHTML = parts.map((p, i) => `<button class="chip ${i ? "" : "on"}" data-p="${p}">${p}</button>`).join("");
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    part = b.dataset.p;
    $$(".chip").forEach((c) => c.classList.toggle("on", c === b));
    renderSummaries();
  });
  $("#q").addEventListener("input", (e) => { query = e.target.value.trim(); renderSummaries(); });
  renderSummaries();

  /* ---------- الخريطة الذهنية ---------- */
  function nodeHtml(n, level, color) {
    const has = n.c && n.c.length;
    const c = n.color || color;
    const cls = ["node", level === 0 ? "root" : "l" + Math.min(level, 2), has ? "has" : "", level < 2 && has ? "open" : ""].join(" ");
    return `<div class="${cls}" style="--b:${c || "var(--gold)"}"><div class="row">${esc(n.t)}</div>` +
      (has ? `<div class="kids">${n.c.map((k) => nodeHtml(k, level + 1, c)).join("")}</div>` : "") + `</div>`;
  }
  const mm = $("#mindmap");
  mm.innerHTML = nodeHtml(MINDMAP, 0, "#f2a33a");
  mm.addEventListener("click", (e) => {
    const row = e.target.closest(".row"); if (!row) return;
    const n = row.parentElement; if (n.classList.contains("has")) n.classList.toggle("open");
  });
  $("#expandAll").onclick = () => $$(".node.has", mm).forEach((n) => n.classList.add("open"));
  $("#collapseAll").onclick = () => $$(".node.has", mm).forEach((n) => n.classList.toggle("open", n.classList.contains("root")));

  /* ---------- اسأل القناص (واتساب) ---------- */
  $("#askForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#question").value.trim();
    if (!q) return;
    const text = encodeURIComponent("سؤال للقناص 🎯\n\n" + q);
    const num = (CONFIG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    const url = num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener");
  });
})();
