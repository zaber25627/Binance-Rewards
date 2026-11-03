import './styles/admin.css';
import { el, clear } from '../utils/dom.js';
import { t, registerDictionary } from '../localization/index.js';
import { adminEn } from './localization/admin.en.js';
import { adminBn } from './localization/admin.bn.js';
import { AdminShell } from './components/AdminShell.js';
import { Dashboard } from './pages/Dashboard.js';
import { checkAdminClaim, adminSignOut } from './adminAuth.js';

// Register admin namespace ONCE at module load.
// Safe to call repeatedly — registerDictionary overwrites idempotently.
registerDictionary('en', 'admin', adminEn);
registerDictionary('bn', 'admin', adminBn);

/**
 * Mount the admin panel.
 * @param {import('firebase/auth').User} user — authenticated Phase 1 user
 * @returns {Promise<{mounted: boolean, reason?: string}>}
 */
export async function mountAdminPanel(user) {
  const isAdmin = await checkAdminClaim(user, { forceRefresh: true });

  if (!isAdmin) {
    renderUnauthorized();
    return { mounted: false, reason: 'NOT_ADMIN' };
  }

  const app = document.getElementById('app');
  if (!app) return { mounted: false, reason: 'NO_APP_ROOT' };
  clear(app);

  const shell = AdminShell({
    user,
    onSignOut: async () => {
      try {
        await adminSignOut();
      } catch (error) {
        console.warn('[admin] signOut failed', error?.code ?? error);
      }
      window.location.hash = '#/';
      window.location.reload();
    },
    onBackToApp: () => {
      window.location.hash = '#/';
      window.location.reload();
    },
  });
  app.appendChild(shell);

  const content = shell.querySelector('#admin-content');
  const renderPage = () => renderAdminRoute(content, user);

  renderPage();
  window.addEventListener('hashchange', renderPage);

  return { mounted: true };
}

function renderAdminRoute(content, user) {
  if (!content) return;
  clear(content);

  const hash = window.location.hash.replace(/^#\/admin\/?/, '');
  const segment = (hash.split('/')[0] || 'dashboard');

  switch (segment) {
    case 'dashboard':
    case '':
      content.appendChild(Dashboard({ user }));
      return;
    default:
      content.appendChild(renderPlaceholder(segment));
  }
}

function renderPlaceholder(section) {
  return el('div', { className: 'admin-card' }, [
    el('div', { className: 'admin-state' }, [
      el('p', {
        className: 'admin-state__title',
        textContent: t(`admin.nav.${section}`, section),
      }),
      el('p', {
        className: 'admin-state__msg',
        textContent: t('admin.common.phase4Notice'),
      }),
    ]),
  ]);
}

function renderUnauthorized() {
  const app = document.getElementById('app');
  if (!app) return;
  clear(app);

  const wrap = el('div', { className: 'admin-unauthorized' }, [
    el('div', { className: 'admin-unauthorized__icon', textContent: '!' }),
    el('h1', { className: 'admin-unauthorized__title', textContent: t('admin.unauthorized') }),
    el('p', { className: 'admin-unauthorized__msg', textContent: t('admin.verifyingAccess') }),
    el('button', {
      className: 'ui-btn ui-btn--primary',
      type: 'button',
      textContent: t('admin.backToApp'),
      onClick: () => {
        window.location.hash = '#/';
        window.location.reload();
      },
    }),
  ]);
  app.appendChild(wrap);
}