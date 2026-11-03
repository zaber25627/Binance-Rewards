/**
 * Hash-based router (GitHub Pages compatible — no server rewrite needed).
 *
 * A route is registered with a path pattern like "/task/:id".
 * Path parameters are extracted and passed to the handler.
 *
 * The router is deliberately tiny: no nested layouts, no guards.
 * Guards are enforced by the pages via the `requireAuth` flag when
 * registering, which the AppShell checks before mounting.
 */

const routes = [];
let notFoundHandler = null;
let currentRoute = null;
const changeListeners = new Set();
let started = false;

function parseHash(hash) {
  const raw = (hash || '#/').replace(/^#/, '');
  const [path, queryString = ''] = raw.split('?');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { path: cleanPath, query };
}

function matchRoute(path) {
  for (const route of routes) {
    const { regex, keys } = route._compiled;
    const match = path.match(regex);
    if (!match) continue;
    const params = {};
    keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] ?? '');
    });
    return { route, params };
  }
  return null;
}

function compilePattern(pattern) {
  const keys = [];
  const regexStr = pattern
    .replace(/\/+$/, '')
    .replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${regexStr || '/'}$`), keys };
}

export function defineRoute(pattern, handler, options = {}) {
  const normalized = pattern.replace(/\/+$/, '') || '/';
  routes.push({
    pattern: normalized,
    handler,
    requireAuth: options.requireAuth !== false, // auth required by default
    titleKey: options.titleKey ?? null,
    _compiled: compilePattern(normalized),
  });
}

export function setNotFoundHandler(handler) {
  notFoundHandler = handler;
}

export function navigate(path, params = {}, { replace = false } = {}) {
  const target = `#${path}`;
  if (replace) window.location.replace(target);
  else window.location.hash = path;

  if (Object.keys(params).length > 0) {
    // Params are stringified into the query so URL is shareable.
    const qs = new URLSearchParams(params).toString();
    window.location.hash = `${path}?${qs}`;
  }
}

export function getCurrentRoute() {
  return currentRoute;
}

export function onRouteChange(listener) {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

async function handleLocationChange() {
  const { path, query } = parseHash(window.location.hash);
  const match = matchRoute(path);

  if (!match) {
    currentRoute = { path, params: query, route: null };
    if (notFoundHandler) await notFoundHandler(currentRoute);
    emit();
    return;
  }

  currentRoute = {
    path,
    params: { ...match.params, ...query },
    route: match.route,
    requireAuth: match.route.requireAuth,
    titleKey: match.route.titleKey,
  };

  emit();

  try {
    await match.route.handler(currentRoute);
  } catch (error) {
    console.error('[router] handler error', error);
  }
}

function emit() {
  changeListeners.forEach((fn) => {
    try {
      fn(currentRoute);
    } catch (error) {
      console.warn('[router] listener error', error);
    }
  });
}

export function startRouter() {
  if (started) return;
  started = true;
  if (!window.location.hash) {
    window.location.replace('#/');
  }
  window.addEventListener('hashchange', handleLocationChange);
  handleLocationChange();
}