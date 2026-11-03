import { el, clear } from '../../utils/dom.js';
import { t } from '../../localization/index.js';
import { getDashboardSnapshot } from '../services/adminData.service.js';
import { formatCurrency } from '../../utils/currency.js';

export function Dashboard({ user }) {
  const root = el('section', { className: 'admin-dashboard' });

  root.appendChild(renderHeader());

  const grid = el('div', { className: 'stack-3' });
  root.appendChild(grid);

  loadInto(grid);

  return root;
}

function renderHeader() {
  const refreshBtn = el('button', {
    className: 'ui-btn ui-btn--ghost ui-btn--sm',
    type: 'button',
    textContent: t('admin.dashboard.refresh'),
  });

  const header = el('div', { className: 'admin-page-header' }, [
    el('div', {}, [
      el('h2', {
        className: 'admin-page-header__title',
        textContent: t('admin.dashboard.title'),
      }),
      el('p', {
        className: 'admin-page-header__subtitle',
        textContent: t('admin.welcome'),
      }),
    ]),
    el('div', { className: 'admin-page-header__actions' }, [refreshBtn]),
  ]);

  // refresh button targets the closest dashboard
  refreshBtn.addEventListener('click', () => {
    const dash = header.closest('.admin-dashboard');
    const grid = dash?.querySelector('.stack-3');
    if (grid) loadInto(grid);
  });

  return header;
}

async function loadInto(grid) {
  clear(grid);

  const loadingCard = el('div', { className: 'admin-card' }, [
    el('div', { className: 'admin-state' }, [
      el('div', { className: 'spinner-sm', style: 'margin:0 auto 0.5rem;' }),
      el('p', { className: 'admin-state__msg', textContent: t('admin.common.loading') }),
    ]),
  ]);
  grid.appendChild(loadingCard);

  let snapshot;
  try {
    snapshot = await getDashboardSnapshot();
  } catch (error) {
    console.error('[admin/Dashboard]', error);
    clear(grid);
    grid.appendChild(
      el('div', { className: 'admin-card' }, [
        el('div', { className: 'admin-state' }, [
          el('p', { className: 'admin-state__title', textContent: t('admin.dashboard.loadError') }),
          el('p', { className: 'admin-state__msg', textContent: t('admin.errors.networkError') }),
        ]),
      ])
    );
    return;
  }

  clear(grid);
  grid.appendChild(renderUserStats(snapshot.userStats));
  grid.appendChild(renderLiabilities(snapshot.walletLiabilities));
  grid.appendChild(renderWithdrawalStats(snapshot.withdrawalStats));
  grid.appendChild(renderTaskAndSupport(snapshot.taskStats, snapshot.supportStats));
  grid.appendChild(renderAuditStats(snapshot.auditStats));
  grid.appendChild(renderRecentActivity(snapshot));
  grid.appendChild(renderPhase4Notice());
  grid.appendChild(renderFooterMeta(snapshot.generatedAt));
}

/* ---------- Sections ---------- */

function statCard(label, value, opts = {}) {
  const valueClass = ['admin-stat__value'];
  if (opts.muted) valueClass.push('admin-stat__value--muted');
  if (opts.tone === 'danger') valueClass.push('admin-stat__value--danger');
  if (opts.tone === 'success') valueClass.push('admin-stat__value--success');
  if (opts.tone === 'warning') valueClass.push('admin-stat__value--warning');

  return el('div', { className: 'admin-stat' }, [
    el('p', { className: 'admin-stat__label', textContent: label }),
    el('p', {
      className: valueClass.join(' '),
      textContent: value == null ? t('admin.stats.unavailable') : String(value),
    }),
  ]);
}

function section(titleKey, gridEl) {
  return el('div', { className: 'admin-card' }, [
    el('div', { className: 'admin-card__head' }, [
      el('h3', { className: 'admin-card__title', textContent: t(titleKey) }),
    ]),
    gridEl,
  ]);
}

function renderUserStats(stats) {
  const grid = el('div', { className: 'admin-stat-grid' }, [
    statCard(t('admin.stats.totalUsers'), stats.total),
    statCard(t('admin.stats.activeUsers'), stats.active, { tone: 'success' }),
    statCard(t('admin.stats.suspendedUsers'), stats.suspended, { tone: 'danger' }),
    statCard(t('admin.stats.newToday'), stats.newToday, { tone: 'warning' }),
    statCard(t('admin.stats.verifiedUsers'), stats.verified),
  ]);
  return section('admin.dashboard.userStats', grid);
}

function renderLiabilities(liabilities) {
  if (!liabilities) {
    return section(
      'admin.dashboard.financialSummary',
      el('div', { className: 'admin-state' }, [
        el('p', { className: 'admin-state__msg', textContent: t('admin.stats.unavailable') }),
      ])
    );
  }
  const grid = el('div', { className: 'admin-stat-grid' }, [
    statCard(t('admin.stats.liabilityBDT'), formatCurrency(liabilities.BDT, 'BDT')),
    statCard(t('admin.stats.liabilityUSD'), formatCurrency(liabilities.USD, 'USD')),
    statCard(t('admin.stats.liabilityUSDT'), formatCurrency(liabilities.USDT, 'USDT')),
  ]);
  return section('admin.dashboard.financialSummary', grid);
}

function renderWithdrawalStats(stats) {
  const grid = el('div', { className: 'admin-stat-grid' }, [
    statCard(t('admin.stats.pendingWithdrawals'),
      addNullable(stats.pending_review, stats.under_review), { tone: 'warning' }),
    statCard(t('admin.stats.approvedWithdrawals'), stats.approved),
    statCard(t('admin.stats.paidWithdrawals'), stats.paid, { tone: 'success' }),
    statCard(t('admin.stats.rejectedWithdrawals'), stats.rejected, { tone: 'danger' }),
  ]);
  return section('admin.dashboard.withdrawalStats', grid);
}

function renderTaskAndSupport(taskStats, supportStats) {
  const grid = el('div', { className: 'admin-stat-grid' }, [
    statCard(t('admin.stats.totalTasks'), taskStats.totalTasks),
    statCard(t('admin.stats.pendingTasks'), taskStats.pendingSubmissions, { tone: 'warning' }),
    statCard(t('admin.stats.openTickets'), supportStats.open, { tone: 'warning' }),
    statCard(t('admin.stats.resolvedTickets'), supportStats.resolved, { tone: 'success' }),
  ]);
  return section('admin.dashboard.supportStats', grid);
}

function renderAuditStats(stats) {
  const grid = el('div', { className: 'admin-stat-grid' }, [
    statCard(t('admin.stats.adminActionsToday'), stats.adminActionsToday),
    statCard(t('admin.stats.securityEventsToday'), stats.securityEventsToday, { tone: 'warning' }),
  ]);
  return section('admin.dashboard.auditStats', grid);
}

function renderRecentActivity(snapshot) {
  const wrap = el('div', { className: 'admin-card' }, [
    el('div', { className: 'admin-card__head' }, [
      el('h3', { className: 'admin-card__title', textContent: t('admin.dashboard.recentActivity') }),
    ]),
    renderActivityColumn(t('admin.dashboard.recentUsers'), snapshot.recentUsers, (r) =>
      r.displayName || r.username || r.id || t('admin.common.unknown')
    ),
    renderActivityColumn(t('admin.dashboard.recentWithdrawals'), snapshot.recentWithdrawals, (r) =>
      `${t('admin.common.id')}: ${r.id ?? '—'} · ${t(`admin.statuses.withdrawal.${r.status ?? 'requested'}`, r.status ?? '—')}`
    ),
    renderActivityColumn(t('admin.dashboard.recentActions'), snapshot.recentRecentAdminActions ?? snapshot.recentAdminActions, (r) =>
      `${r.action ?? '—'} · ${r.targetType ?? ''} ${r.targetId ?? ''}`.trim()
    ),
    renderActivityColumn(t('admin.dashboard.recentSecurityEvents'), snapshot.recentSecurityEvents, (r) =>
      r.type ?? r.eventType ?? '—'
    ),
  ]);
  return wrap;
}

function renderActivityColumn(title, items, formatter) {
  const list = el('div', { style: 'margin-top:0.75rem;' }, [
    el('p', {
      style: 'font-size:0.7rem; text-transform:uppercase; letter-spacing:0.6px; color:var(--brb-text-muted); margin:0 0 0.4rem; font-weight:700;',
      textContent: title,
    }),
  ]);

  if (!items || items.length === 0) {
    list.appendChild(
      el('p', {
        style: 'font-size:0.78rem; color:var(--brb-text-muted); margin:0;',
        textContent: t('admin.dashboard.noData'),
      })
    );
    return list;
  }

  items.forEach((item) => {
    list.appendChild(
      el(
        'div',
        {
          style: 'padding:0.4rem 0; border-bottom:1px solid var(--brb-border); font-size:0.78rem; color:var(--brb-text);',
        },
        [formatter(item)]
      )
    );
  });
  return list;
}

function renderPhase4Notice() {
  return el('div', { className: 'admin-notice admin-notice--info' }, [
    t('admin.common.phase4Notice'),
  ]);
}

function renderFooterMeta(generatedAt) {
  return el('p', {
    style: 'font-size:0.68rem; color:var(--brb-text-muted); text-align:center; margin:0;',
    textContent: `${t('admin.dashboard.lastUpdated')}: ${new Date(generatedAt).toLocaleString()}`,
  });
}

function addNullable(a, b) {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}