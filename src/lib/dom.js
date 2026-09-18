// Крихітний DOM-хелпер. Жодних залежностей.
// h('div.card', {onclick}, child, child) -> HTMLElement

const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop', 'use',
  'clipPath', 'mask', 'pattern', 'filter', 'feGaussianBlur', 'symbol',
]);

/** @param {string} sel  @param {object|null} props  @param {...any} kids */
export function h(sel, props, ...kids) {
  const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
  const tag = m[1] || 'div';
  // SVG-елементи ОБОВ'ЯЗКОВО створюються у своєму неймспейсі, інакше
  // браузер робить HTMLUnknownElement і нічого не малює.
  const el = SVG_TAGS.has(tag)
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);
  const mods = (m[2] || '').match(/[.#][\w-]+/g) || [];
  for (const mod of mods) {
    if (mod[0] === '.') el.classList.add(mod.slice(1));
    else el.id = mod.slice(1);
  }
  if (props && typeof props === 'object' && !(props instanceof Node) && !Array.isArray(props)) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') { String(v).split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c)); }
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'ref' && typeof v === 'function') v(el);
      else if (el instanceof SVGElement) el.setAttribute(k, v === true ? '' : v);
      else if (k in el && k !== 'list' && typeof v !== 'object') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
      else el.setAttribute(k, v === true ? '' : v);
    }
  } else if (props != null) {
    kids.unshift(props);
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const k of kids.flat(4)) {
    if (k == null || k === false || k === '') continue;
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

/** Іконки (інлайн SVG, без зовнішніх ресурсів). */
export function icon(name, size = 20) {
  const paths = {
    back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    mic: '<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/>',
    play: '<path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/>',
    pause: '<rect x="7" y="5" width="4" height="14" rx="1.4" fill="currentColor"/><rect x="13" y="5" width="4" height="14" rx="1.4" fill="currentColor"/>',
    check: '<path d="M4.5 12.5l5 5 10-11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    gear: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12a8.5 8.5 0 0 1 .3-2.2l-1.6-1.3 1.8-3.1 2 .7A8.5 8.5 0 0 1 8 4.5L8.4 2.4h3.2L12 4.5a8.5 8.5 0 0 1 2 .6l2-.7 1.8 3.1-1.6 1.3c.2.7.3 1.4.3 2.2s-.1 1.5-.3 2.2l1.6 1.3-1.8 3.1-2-.7a8.5 8.5 0 0 1-2 .6l-.4 2.1H8.4L8 19.5a8.5 8.5 0 0 1-2-.6l-2 .7-1.8-3.1 1.6-1.3A8.5 8.5 0 0 1 3.5 12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    speak: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    redo: '<path d="M20 11a8 8 0 1 0-2.3 5.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    bookmark: '<path d="M7 4h10v16l-5-4-5 4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>',
  };
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = paths[name] || '';
  return s;
}

/** Плавна заміна екрана. */
export function mount(root, el) {
  clear(root);
  root.appendChild(el);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
