import { useSyncExternalStore } from 'react';

// "E'lonlar" tabida rasmga bir marta bosilganda pastki menyu va e'lon yozuvlari pastga yashirinadi.
// Holat ReelPage (yozuvlar) va AppTabBar (menyu) orasida umumiy bo'lgani uchun bu yerda turadi.
let hidden = false;
const listeners = new Set();

export function setReelsChromeHidden(value) {
  if (hidden === value) return;
  hidden = value;
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getSnapshot = () => hidden;

export const useReelsChromeHidden = () => useSyncExternalStore(subscribe, getSnapshot);
