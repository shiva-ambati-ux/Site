/* Interactivity: render project cards, lazy-load images, subtle reveal animations, modal, loader */

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Auto year
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Projects data (thumb + hero reference root-level filenames)
const dataEl = $("#case-data");
const projectsHolder = $("#projects");
let projects = [];
if (dataEl && projectsHolder) {
  try {
    projects = JSON.parse(dataEl.textContent);
    renderProjects(projects);
  } catch (e) { console.error("Project JSON parse error", e); }
}

function renderProjects(list) {
  projectsHolder.innerHTML = list.map((p, i) => `
    <article class="card" data-index="${i}">
      <img class="thumb lazy-img" data-src="${p.thumb || ''}" alt="${escapeHtml(p.title)} thumbnail" width="120" height="80" />
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.summary || '')}</p>
      <div class="meta">${[p.year, (p.tags||[]).join(" · ")].filter(Boolean).join(" — ")}</div>
      <div class="actions">
        ${(p.links||[]).map(l => `<a class="btn" target="_blank" rel="noopener" href="${l.url}">${l.label}</a>`).join(" ")}
        <button class="btn open" data-i="${i}">more</button>
      </div>
    </article>
  `).join("");
  // Bind modal opens
  $$(".open", projectsHolder).forEach(btn => btn.addEventListener("click", (e) => {
    const idx = Number(btn.dataset.i);
    openModal(idx);
  }));
  // Observe newly created cards for reveal and lazy images
  setupObservers();
}

/* Simple HTML escape for safety */
function escapeHtml(s){
  if(!s) return "";
  return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* Modal logic */
const dialog = $("#caseModal");
const closeBtn = $("#closeModal");
function openModal(i){
  const it = projects[i];
  if(!it) return;
  $("#modalTitle").textContent = it.title;
  $("#modalBody").innerHTML = `
    ${it.hero ? `<img class="modal-hero lazy-img" data-src="${it.hero}" alt="${escapeHtml(it.title)} hero" style="width:100%;border-radius:10px;margin-bottom:12px;">` : ""}
    <p>${escapeHtml(it.summary || "")}</p>
    ${(it.details ? `<div>${it.details}</div>` : "")}
    ${(it.links||[]).map(l => `<p><a class="link" target="_blank" rel="noopener" href="${l.url}">${l.label}</a></p>`).join("")}
  `;
  // ensure modal images will lazy-load
  setupObservers(); // set up observers again so modal hero lazy-loads
  if(typeof dialog.showModal === "function") dialog.showModal();
}
closeBtn && closeBtn.addEventListener("click", ()=> dialog.close());
dialog && dialog.addEventListener("click", (e) => { if(e.target === dialog) dialog.close(); });

/* Lazy-loading images + reveal on scroll */
let ioImgs, ioReveal;
function setupObservers(){
  // Images observer
  const lazyImgs = Array.from(document.querySelectorAll('img.lazy-img:not(.lazy-observed)'));
  if(lazyImgs.length){
    if(!ioImgs){
      ioImgs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            const img = entry.target;
            const src = img.dataset.src;
            if(src){
              img.src = src;
              img.addEventListener('load', () => {
                img.classList.add('lazy-loaded');
              }, {once:true});
            } else {
              // No src provided - still mark as loaded to animate if present
              img.classList.add('lazy-loaded');
            }
            img.classList.add('lazy-observed');
            obs.unobserve(img);
          }
        });
      }, {root:null, rootMargin:'120px', threshold:0.05});
    }
    lazyImgs.forEach(img => ioImgs.observe(img));
  }

  // Reveal observer
  const revealables = Array.from(document.querySelectorAll('.reveal:not(.reveal-observed)'));
  if(revealables.length){
    if(!ioReveal){
      ioReveal = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('revealed');
            entry.target.classList.remove('reveal');
            entry.target.classList.add('reveal-observed');
            obs.unobserve(entry.target);
          }
        });
      }, {root:null, rootMargin:'0px', threshold: 0.12});
    }
    revealables.forEach(node => ioReveal.observe(node));
  }

  // Also animate each card individually
  const cards = Array.from(document.querySelectorAll('.card:not(.card-observed)'));
  cards.forEach((c, idx) => {
    if(!ioReveal) continue;
    ioReveal.observe(c);
    c.classList.add('card-observed');
  });

}

/* Loader: fade out when everything ready */
function hideLoader(){
  const loader = document.getElementById('siteLoader');
  if(!loader) return;
  loader.classList.add('hidden');
  document.body.classList.remove('preload');
}

/* Utility: wait for DOM + small timeout for smoother UX */
document.addEventListener('DOMContentLoaded', ()=> {
  // small delay so things don't jump
  setTimeout(()=> {
    setupObservers();
    // reveal already-visible elements
    document.querySelectorAll('.reveal').forEach(el => {
      // If already in viewport, reveal now
      const r = el.getBoundingClientRect();
      if(r.top < window.innerHeight) el.classList.add('revealed');
    });
    // hide loader after images above the fold have time to load
    hideLoader();
  }, 180);
});

/* Smooth scroll for hash links */
document.addEventListener('click', (e) => {
  const a = e.target.closest("a[href^='#']");
  if(!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if(el){
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth', block:'start'});
    history.pushState(null, '', '#'+id);
  }
});

/* Accessibility: close modal with escape */
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') {
    dialog && dialog.close && dialog.close();
  }
});