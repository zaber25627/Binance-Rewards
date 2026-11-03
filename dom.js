/**
 * Minimal DOM helpers so main.js stays readable without a framework.
 */

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === 'className') node.className = value;
    else if (key === 'textContent') node.textContent = value;
    else if (key === 'innerHTML') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, String(value));
    }
  });

  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null) return;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function setLoadingText(text) {
  const node = document.getElementById('loading-text');
  if (node) node.textContent = text;
}

export function hideLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  if (!screen) return;
  screen.style.opacity = '0';
  screen.style.transition = 'opacity 240ms ease';
  setTimeout(() => screen.remove(), 260);
}

export function showError(message, onRetry) {
  const app = document.getElementById('app');
  if (!app) return;

  clear(app);
  const wrap = el('div', { className: 'fatal-error' }, [
    el('div', { className: 'fatal-error__mark', textContent: '!' }),
    el('h2', { textContent: message }),
    onRetry
      ? el('button', { className: 'btn btn--gold', onClick: onRetry, textContent: 'Retry' })
      : null,
  ]);
  app.appendChild(wrap);
}