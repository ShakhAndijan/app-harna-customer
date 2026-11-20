// UI guruhi (done / cancelled / active) bo'yicha rang va ikonka.
export const STATUS_META = {
  done: { color: '#2fa37a', bg: 'rgba(47,163,122,0.15)', icon: 'check-circle-outline' },
  cancelled: { color: '#e0473a', bg: 'rgba(224,71,58,0.13)', icon: 'close-circle-outline' },
  active: { color: '#e87a45', bg: 'rgba(232,122,69,0.15)', icon: 'clock-outline' },
};

// Backend holati (pending/accepted/active/completed/cancelled) bo'yicha matn kalitlari.
const STATUS_LABEL_KEY = {
  awaiting_deposit: 'deposit.statusLabel',
  pending: 'orders.statusPending',
  accepted: 'orders.statusAccepted',
  active: 'orders.statusActive',
  completed: 'orders.statusDone',
  cancelled: 'orders.statusCancelled',
};

const STATUS_SUBTEXT_KEY = {
  awaiting_deposit: 'deposit.statusSubtext',
  pending: 'orderDetail.statusSubtext.pending',
  accepted: 'orderDetail.statusSubtext.accepted',
  active: 'orderDetail.statusSubtext.active',
  completed: 'orderDetail.statusSubtext.done',
  cancelled: 'orderDetail.statusSubtext.cancelled',
};

export const statusLabel = (tr, order) =>
  tr(STATUS_LABEL_KEY[order.rawStatus] || STATUS_LABEL_KEY.active);

export const statusSubtext = (tr, order) => {
  if (order.rawStatus === 'pending' && order.master) {
    return tr('orderDetail.statusSubtext.pendingWorker', { name: order.master });
  }
  return tr(STATUS_SUBTEXT_KEY[order.rawStatus] || STATUS_SUBTEXT_KEY.active);
};

export const PAYMENT_STATUS_COLOR = {
  paid: '#2fa37a',
  refunded: '#3f7fd4',
  not_charged: '#8da0ba',
};
