import { el, clear } from '../../utils/dom.js';
import { t, getLanguage, setLanguage, onLanguageChange } from '../../localization/index.js';
import { applyTheme, getStoredTheme, THEMES } from '../../config/themes.js';

const NAV_GROUPS = [
  {
    key: 'overview',
    items: [{ id: 'dashboard', labelKey: 'admin.nav.dashboard' }],
  },
  {
    key: 'finance',
    items: [
      { id: 'withdrawals', labelKey: 'admin.nav.withdrawals' },
      { id: 'earnings', labelKey: 'admin.nav.earnings' },
      { id: 'transactions', labelKey: 'admin.nav.transactions' },
    ],
  },
  {
    key: 'engagement',
    items: [
      { id: 'tasks', labelKey: 'admin.nav.tasks' },
      { id: 'submissions', labelKey: 'admin.nav.submissions' },
      { id: 'dailyBonus', labelKey: 'admin.nav.dailyBonus' },
      { id: 'spinWheel', labelKey: 'admin.nav.spinWheel' },
      { id: 'giveaways', labelKey: 'admin.nav.giveaways' },
      { id: 'promo', labelKey: 'admin.nav.promo' },
      { id: 'referrals', labelKey: 'admin.nav.referrals' },
      { id: 'vip', labelKey: 'admin.nav.vip' },
      { id: 'achievements', labelKey: 'admin.nav.achievements' },
    ],
  },
  {
    key: 'operations',
    items: [
      { id: 'users', labelKey: 'admin.nav.users' },
      { id: 'support', labelKey: 'admin.nav.support' },
      { id: 'notifications', labelKey: 'admin.nav.notifications' },
      { id: 'security', labelKey: 'admin.nav.security' },
      { id: 'activity', labelKey: 'admin.nav.activity' },
    ],
  },
  {
    key: 'system',
    items: [
      { id: 'settings', labelKey: 'admin.nav.settings' },
      { id: 'export', labelKey: 'admin.nav.export' },
    ],
  },
];

/**
 * @param {object} opts { user, onSignOut, onBackToApp }
 * @returns {HTMLElement}
 */
export function AdminShell(opts) {
  const { user, onSignOut, onBackToApp } = opts;

  const shell = el('div', { className: 'admin-shell', 'data-admin-root': 'true' });

  // ---------- Sidebar / drawer ----------
  const sidebar = el('aside', { className: 'admin-sidebar', id: 'admin-sidebar' }, [
    el('div', { className: 'admin-sidebar__brand' }, [
      el('div', { className: 'admin-sidebar__logo', textContent: 'B' }),
      el('div', {}, [
        el('h1', { className: 'admin-sidebar__title', textContent: t('admin.title') }),
        el('p', { className: 'admin-sidebar__sub', textContent: t('admin.subtitle') }),
      ]),
    ]),
    renderNav(),
    el('div', { className: 'admin-sidebar__footer' }, [
      el('button', {
        className: 'admin-nav__item admin-nav__item--secondary',
        type: 'button',
        onClick: onBackToApp,
        textContent: t('admin.backToApp'),
      }),
      el('button', {
        className: 'admin-nav__item admin-nav__item--danger',
        type: 'button',
        onClick: onSignOut,
        textContent: t('admin.signOut'),
      }),
    ]),
  ]);

  function renderNav() {
    const nav = el('nav', { className: 'admin-nav' });
    NAV_GROUPS.forEach((group) => {
      nav.appendChild(
        el('div', { className: 'admin-nav__group-label', textContent: t(`admin.groups.${group.key}`) })
      );
      group.items.forEach((item) => {
        const active = isActive(item.id);
        nav.appendChild(
          el(
            'button',
            {
              className: `admin-nav__item${active ? ' is-active' : ''}`,
              type: 'button',
              'data-nav-id': item.id,
              onClick: () => {
                window.location.hash = `#/admin/${item.id}`;
                closeDrawer();
              },
            },
            [t(item.labelKey)]
          )
        );
      });
    });
    return nav;
  }

  // ---------- Topbar (mobile) ----------
  const topbar = el('header', { className: 'admin-topbar' }, [
    el('button', {
      className: 'admin-topbar__btn',
      type: 'button',
      'aria-label': 'Menu',
      onClick: openDrawer,
      innerHTML:
        '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>',
    }),
    el('div', { className: 'admin-topbar__title', textContent: t('admin.title') }),
    renderControls(),
  ]);

  // ---------- Content area ----------
  const content = el('main', { className: 'admin-content', id: 'admin-content' });

  // ---------- Drawer backdrop ----------
  const backdrop = el('div', {
    className: 'admin-backdrop',
    id: 'admin-backdrop',
    onClick: closeDrawer,
  });

  shell.appendChild(sidebar);
  shell.appendChild(backdrop);
  shell.appendChild(el('div', { className: 'admin-main' }, [topbar, content]));

  // ---------- Controls (theme + language) ----------
  function renderControls() {
    const wrap = el('div', { className: 'admin-controls' });

    // Theme select
    const themeSelect = el('select', {
      className: 'admin-controls__select',
      'aria-label': t('admin.theme.label'),
    });
    Object.values(THEMES).forEach((theme) => {
      themeSelect.appendChild(
        el('option', {
          value: theme.id,
          textContent: t(`admin.theme.${camel(theme.id)}`),
        })
      );
    });
    themeSelect.value = getStoredTheme();
    themeSelect.addEventListener('change', () => {
      applyTheme(themeSelect.value);
    });
    wrap.appendChild(themeSelect);

    // Language toggle
    const langBtn = el('button', {
      className: 'admin-controls__btn',
      type: 'button',
      textContent: getLanguage() === 'bn' ? t('admin.language.bn') : t('admin.language.en'),
      onClick: () => {
        setLanguage(getLanguage() === 'bn' ? 'en' : 'bn');
      },
    });
    wrap.appendChild(langBtn);
    onLanguageChange(() => {
      langBtn.textContent = getLanguage() === 'bn' ? t('admin.language.bn') : t('admin.language.en');
    });

    return wrap;
  }

  // ---------- Drawer helpers ----------
  function openDrawer() {
    shell.classList.add('drawer-open');
  }
  function closeDrawer() {
    shell.classList.remove('drawer-open');
  }

  // Highlight active nav on hash change
  function isActive(id) {
    const hash = window.location.hash;
    return hash === `#/admin/${id}` || hash.startsWith(`#/admin/${id}/`);
  }

  function refreshActiveNav() {
    const nav = shell.querySelector('.admin-nav');
    if (!nav) return;
    nav.querySelectorAll('[data-nav-id]').forEach((btn) => {
      const id = btn.getAttribute('data-nav-id');
      btn.classList.toggle('is-active', isActive(id));
    });
  }

  window.addEventListener('hashchange', refreshActiveNav);

  return shell;
}

function camel(id) {
  // 'black-gold' -> 'blackGold'
  return id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}