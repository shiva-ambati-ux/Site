// Build cards from JSON and keep the minimalist feel
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const dataEl = $("#case-data");
const holder = $("#projects");
let items = [];
if (dataEl && holder) {
  try {
    items = JSON.parse(dataEl.textContent);
    render(items);
  } catch (e) { console.error(e); }
}

function render(list) {
  holder.innerHTML = list.map((it, i) => `
    <article class="card">
      <h3>${it.title}</h3>
      <p>${it.summary || ""}</p>
      <div class="meta">${[it.year, (it.tags||[]).join(" · ")].filter(Boolean).join(" — ")}</div>
      <div class="actions">
        ${(it.links||[]).map(l => `<a class="btn" target="_blank" rel="noopener" href="${l.url}">${l.label}</a>`).join(" ")}
        <button class="btn open" data-i="${i}">more</button>
      </div>
    </article>
  `).join("");

  $$(".open", holder).forEach(b => b.addEventListener("click", () => openModal(Number(b.dataset.i))));
}

// Modal
const dialog = $("#caseModal");
const closeBtn = $("#closeModal");
function openModal(i) {
  const it = items[i]; if (!it) return;
  $("#modalTitle").textContent = it.title;
  $("#modalBody").innerHTML = `
    <p>${it.summary || ""}</p>
    ${(it.details ? `<div>${it.details}</div>` : "")}
    ${(it.links||[]).map(l => `<p><a class="link" target="_blank" rel="noopener" href="${l.url}">${l.label}</a></p>`).join("")}
  `;
  dialog?.showModal();
}
closeBtn?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

// Smooth scroll for hash links
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='#']");
  if (!a) return;
  const id = a.getAttribute("href").slice(1);
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({behavior: "smooth", block:"start"});
    history.pushState(null, "", "#" + id);
  }
});
