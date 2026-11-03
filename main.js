import './styles/main.css';

import { initFirebase } from './firebase/client.js';
import { initTelegramWebApp, isTelegramEnvironment, getDisplayName } from './telegram/webapp.js';
import { authenticate } from './telegram/auth.js';
import { branding } from './config/branding.js';
import { env } from './config/environment.js';
import { getFirebaseServices } from './firebase/client.js';
import { getLanguage, setLanguage, onLanguageChange, t, availableLanguages } from './localization/index.js';
import { SUPPORTED_CURRENCY_CODES } from './config/currencies.js';
import { formatCurrency } from './utils/currency.js';
import { doc, getDoc } from 'firebase/firestore';
import { el, clear, setLoadingText, hideLoadingScreen, showError } from './utils/dom.js';

/* ============================================================
   Bootstrap
   ============================================================ */

async function bootstrap() {
  try {
    setLoadingText(t('loading.initializing'));

    // 1. Firebase must be ready before any auth call.
    initFirebase();

    // 2. Telegram chrome (no-op in a normal browser).
    initTelegramWebApp();

    // 3. Authenticate.
    setLoadingText(t('loading.authenticating'));
    const user = await authenticate();

    // 4. Render the authenticated shell.
    setLoadingText(t('loading.connecting'));
    await renderApp(user);
    hideLoadingScreen();
  } catch (error) {
    console.error('[bootstrap]', error);
    const message = mapAuthError(error);
    showError(message, () => window.location.reload());
  }
}

function mapAuthError(error) {
  const code = error?.message ?? '';

  if (code === 'TELEGRAM_ENV_UNAVAILABLE') return t('errors.telegramOnly');
  if (code === 'TELEGRAM_INIT_DATA_MISSING' || code === 'invalid-argument') {
    return t('errors.invalidInitData');
  }
  if (code.includes('network') || error?.code === 'unavailable') return t('errors.network');
  return t('errors.generic');
}

/* ============================================================
   Authenticated shell
   ============================================================ */

async function renderApp(user) {
  const app = document.getElementById('app');
  clear(app);

  const shell = el('div', { className: 'app-shell' }, [
    renderHeader(),
    renderProfileCard(user),
    renderWalletCard(),
    env.devMode ? renderDevNotice() : null,
  ]);

  app.appendChild(shell);

  // Async wallet load — does not block the shell render.
  loadWallet(user);
}

function renderHeader() {
  const header = el('header', { className: 'app-header' }, [
    el('div', { className: 'app-header__brand' }, [
      el('div', {
        className: 'app-header__logo',
        textContent: branding.appShortName.charAt(0),
      }),
      el('div', {}, [
        el('h1', { className: 'app-header__title', textContent: t('app.name') }),
        el('p', { className: 'app-header__subtitle', textContent: t('app.tagline') }),
      ]),
    ]),
    renderLanguageSwitch(),
  ]);

  return header;
}

function renderLanguageSwitch() {
  const wrap = el('div', {
    className: 'lang-switch',
    role: 'group',
    'aria-label': t('common.language'),
  });

  const renderButtons = () => {
    clear(wrap);
    availableLanguages().forEach((lang) => {
      const isActive = getLanguage() === lang;
      const button = el('button', {
        className: 'lang-switch__btn',
        type: 'button',
        textContent: lang === 'bn' ? t('common.bengali') : t('common.english'),
        'aria-pressed': String(isActive),
        onClick: () => setLanguage(lang),
      });
      wrap.appendChild(button);
    });
  };

  renderButtons();
  onLanguageChange(renderButtons);

  return wrap;
}

function renderProfileCard(user) {
  const isAnonymous = user.isAnonymous === true;
  const displayName = getDisplayName() || (isAnonymous ? 'Dev User' : 'Telegram User');

  return el('section', { className: 'card' }, [
    el('h2', { className: 'card__title', textContent: t('profile.title') }),
    el('div', { className: 'profile-row' }, [
      el('span', { className: 'profile-row__label', textContent: t('profile.telegramId') }),
      el('span', {
        className: 'profile-row__value',
        textContent: isAnonymous ? 'DEV-ONLY' : user.uid,
      }),
    ]),
    el('div', { className: 'profile-row' }, [
      el('span', { className: 'profile-row__label', textContent: 'Name' }),
      el('span', { className: 'profile-row__value', textContent: displayName }),
    ]),
    el('div', { className: 'profile-row' }, [
      el('span', { className: 'profile-row__label', textContent: t('profile.accountStatus') }),
      el('span', { className: 'badge badge--success', textContent: t('profile.verified') }),
    ]),
  ]);
}

function renderWalletCard() {
  const card = el('section', { className: 'card', id: 'wallet-card' }, [
    el('h2', { className: 'card__title', textContent: t('wallet.title') }),
    el('div', { className: 'wallet-grid', id: 'wallet-grid' }, [
      el('div', { className: 'wallet-empty', textContent: t('wallet.loading') }),
    ]),
  ]);

  return card;
}

function renderDevNotice() {
  return el('div', { className: 'notice notice--dev', textContent: t('auth.devMode') });
}

/* ============================================================
   Wallet (read-only foundation)
   ============================================================ */

async function loadWallet(user) {
  const { db } = getFirebaseServices();
  const grid = document.getElementById('wallet-grid');
  if (!grid) return;

  try {
    const walletRef = doc(db, 'wallets', user.uid);
    const snapshot = await getDoc(walletRef);

    clear(grid);

    if (!snapshot.exists()) {
      grid.appendChild(
        el('div', { className: 'wallet-empty', textContent: t('wallet.empty') })
      );
      return;
    }

    const data = snapshot.data();
    const balances = data.balances ?? {};

    SUPPORTED_CURRENCY_CODES.forEach((code) => {
      const minor = Number.isInteger(balances[code]) ? balances[code] : 0;
      const display = formatCurrency(minor, code, getLanguage());

      grid.appendChild(
        el('div', { className: 'wallet-currency' }, [
          el('div', { className: 'wallet-currency__meta' }, [
            el('span', { className: 'wallet-currency__code', textContent: code }),
            el('span', { className: 'wallet-currency__name', textContent: t(`currency.${code}`) }),
          ]),
          el('span', { className: 'wallet-currency__balance', textContent: display }),
        ])
      );
    });

    onLanguageChange(() => loadWallet(user));
  } catch (error) {
    console.error('[wallet]', error);
    clear(grid);
    grid.appendChild(
      el('div', { className: 'wallet-empty', textContent: t('errors.generic') })
    );
  }
}

/* ============================================================
   Network status
   ============================================================ */

function watchNetwork() {
  window.addEventListener('online', () => console.info(t('network.online')));
  window.addEventListener('offline', () => console.warn(t('network.offline')));
}

/* ============================================================
   Boot
   ============================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    watchNetwork();
    bootstrap();
  });
} else {
  watchNetwork();
  bootstrap();
}

// Surface unexpected module-level errors to the loading screen.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[unhandledrejection]', event.reason);
});