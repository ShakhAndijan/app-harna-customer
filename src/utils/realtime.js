import { useSyncExternalStore } from 'react';

// Real vaqt (Socket.IO) holati va hodisalar shinasi. Ulanish `src/realtime/RealtimeSync.js` da,
// ekranlar esa shu yerdan hodisalarga obuna bo'ladi va "ulangan" bo'lsa so'rashni siyraklashtiradi.

let connected = false;
const statusListeners = new Set();
const eventListeners = new Set();

export const isRealtimeConnected = () => connected;

export function setRealtimeConnected(value) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((fn) => fn());
}

/** Serverdan hodisa kelganda `fn(eventName, payload)` chaqiriladi. Qaytgan funksiya obunani bekor qiladi. */
export function subscribeRealtime(fn) {
  eventListeners.add(fn);
  return () => eventListeners.delete(fn);
}

// Usta manzil nuqtasini so'ragan buyurtmalar: buyurtma qachon ochilmasin, pin kartasi yorqin turadi.
const pinAsked = new Set();
const pinListeners = new Set();

const subscribePin = (fn) => {
  pinListeners.add(fn);
  return () => pinListeners.delete(fn);
};

export function emitRealtime(event, payload) {
  if (event === 'order.location_request') {
    const id = Number(payload?.order_id);
    if (Number.isFinite(id) && !pinAsked.has(id)) {
      pinAsked.add(id);
      pinListeners.forEach((fn) => fn());
    }
  }
  eventListeners.forEach((fn) => fn(event, payload));
}

/** Usta shu buyurtma uchun pin so'ragan (ilova ishlayotganda `order.location_request` kelgan). */
export const usePinAsked = (orderId) =>
  useSyncExternalStore(subscribePin, () => pinAsked.has(Number(orderId)));

const subscribeStatus = (fn) => {
  statusListeners.add(fn);
  return () => statusListeners.delete(fn);
};

export const useRealtimeConnected = () =>
  useSyncExternalStore(subscribeStatus, isRealtimeConnected);

/**
 * So'rab turish oralig'i: real vaqt ulangan bo'lsa siyrak (zaxira), aks holda tez.
 * React Query `refetchInterval` va `usePolling` ga funksiya sifatida beriladi.
 */
export const pollEvery = (fastMs, slowMs) => () => (connected ? slowMs : fastMs);
