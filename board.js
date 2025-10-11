import { listenGratitudes, EMOTIONS } from './firebase.js';

const gridEl = document.getElementById('grid');
const legendEl = document.getElementById('legend');
const barEl = document.getElementById('bar');
const totalEl = document.getElementById('total');

const orderKeys = ['bad','notgreat','okay','good','great'];

function renderLegend(stats){
  legendEl.innerHTML = '';
  for (const key of orderKeys) {
    const emo = EMOTIONS[key];
    const count = stats[key] || 0;
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `<span class="dot" style="background:${emo.color}"></span>${emo.label}: <strong>${count}</strong>`;
    legendEl.appendChild(chip);
  }
}

function renderBar(stats, total){
  barEl.innerHTML = '';
  for (const key of orderKeys) {
    const emo = EMOTIONS[key];
    const count = stats[key] || 0;
    const pct = total ? (count/total*100) : 0;
    const seg = document.createElement('div');
    seg.className = 'seg';
    seg.style.cssText = `width:${pct}%; background:${emo.color}`;
    seg.title = `${emo.label} ${Math.round(pct)}% (${count})`;
    barEl.appendChild(seg);
  }
  totalEl.textContent = `Tổng: ${total} mục`;
}

function timeAgo(ts){
  const t = typeof ts === 'number' ? ts : +ts;
  const s = Math.floor((Date.now() - t)/1000);
  if (s<60) return `${s}s trước`;
  const m = Math.floor(s/60); if (m<60) return `${m}p trước`;
  const h = Math.floor(m/60); if (h<24) return `${h}g trước`;
  const d = Math.floor(h/24); return `${d} ngày trước`;
}

function renderGrid(items){
  gridEl.innerHTML = '';
  for (const it of items) {
    const div = document.createElement('article');
    div.className = 'note';
    div.style.borderLeftColor = it.color || '#ddd';
    div.innerHTML = `
      <div class="text"></div>
      <div class="meta">
        <span class="badge" style="background: color-mix(in srgb, ${it.color||'#eee'} 20%, #fff)">
          <span style="width:8px;height:8px;border-radius:50%;background:${it.color};display:inline-block"></span>
          ${it.emotionLabel || ''}
        </span>
        <span aria-hidden="true">•</span>
        <span>${timeAgo(it.createdAt || Date.now())}</span>
      </div>
    `;
    div.querySelector('.text').textContent = it.text;
    gridEl.appendChild(div);
  }
  gridEl.setAttribute('aria-busy','false');
}

listenGratitudes((items) => {
  const stats = { bad:0, notgreat:0, okay:0, good:0, great:0 };
  for (const it of items) if (stats[it.emotionKey] !== undefined) stats[it.emotionKey]++;
  renderLegend(stats);
  renderBar(stats, items.length);
  renderGrid(items);
});