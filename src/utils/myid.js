// MyID WebSDK orqali shaxsni tasdiqlash (backend 19.11): tekshiruvni ochish, MyID javobini qabul
// qilish va «Tasdiqlashni yakunlash» tugmasi. Ekran: src/screens/VerifyIdentityScreen.js.
//
// Yo'l: `POST /auth/verify/myid/start` (`return_to:'app'`) → `open_url` (saytning /myid/boshlash
// sahifasi) brauzerda ochiladi, u MyID sahifasiga o'tkazadi. Qaytish: MyID saytning /myid/qaytish
// sahifasiga qaytadi, u javobni ilovaga `harna://cabinet/verify?session_id&status&auth_code` bilan
// beradi. Sahifa qanday ochilishini server aytadi (`app_open_mode`): tizimning auth oynasi,
// ilova ichidagi brauzer yoki umuman ochilmaydi (foydalanuvchi saytga yo'naltiriladi).
//
// Javob ilovaga uch yo'l bilan kelishi mumkin: auth oynasi natijasi, `Linking` 'url' hodisasi va
// router parametrlari (Android havolani routerga ham beradi) — ko'pincha bitta qaytishga ikkitasi.
// Hammasi `receiveMyIdReturn` ga tushadi, u har bir session_id uchun bir marta ishlaydi.
// Yaroqli kod → yakunlash tugmasi; kod yo'q → urinish yopiladi (`abandon`). Tugma hech qachon
// o'zi bosilmaydi: MyID shartlari foydalanuvchining o'z bosishini talab qiladi.
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
  abandonMyIdCheck,
  completeMyIdCheck,
  getIdentityStatus,
  startMyIdCheck,
} from '../api/account';
import { queryClient } from '../queries/client';
import { ApiError } from './request';

// Saytning qaytish sahifasi javobni shu havola bilan beradi (auth oynasi shu havolada yopiladi).
export const MYID_RETURN_LINK = 'harna://cabinet/verify';

const PENDING_KEY = 'myid_pending';
// Sahifa javobsiz yopilgandan keyin kech keladigan havolani kutish vaqti.
const LATE_LINK_MS = 2000;
// «Tekshirilmoqda…» shundan keyin uzoq kutish haqida xabar qo'shadi.
const SLOW_MS = 8000;
// 409 `verification_in_progress`: holat shuncha tez-tez, shuncha vaqt so'raladi.
const POLL_EVERY_MS = 3000;
const POLL_FOR_MS = 60000;

// MyID kamera sahifasi ishlashi ma'lum Android brauzerlari (yaxshisi birinchi).
const BROWSERS = ['com.android.chrome', 'com.sec.android.app.sbrowser'];

// Lotinga o'xshash kirill harflari: kirill klaviaturada yozilgan pasport seriyasi ham lotin.
const LOOKALIKES = {
  А: 'A',
  В: 'B',
  Е: 'E',
  К: 'K',
  М: 'M',
  Н: 'H',
  О: 'O',
  Р: 'P',
  С: 'C',
  Т: 'T',
  Х: 'X',
};

export const PINFL_PATTERN = /^\d{14}$/;
export const PASSPORT_PATTERN = /^[A-Z]{2}\d{7}$/;

/** Yuborilgan JSHSHIR: bo'sh joylarsiz raqamlar. */
export const normalisePinfl = (raw) => String(raw ?? '').replace(/\s+/g, '');

/** Yuborilgan pasport seriya-raqami: bo'sh joysiz, katta, lotin. */
export const normalisePassport = (raw) =>
  String(raw ?? '')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[АВЕКМНОРСТХ]/g, (ch) => LOOKALIKES[ch] ?? ch);

/** Hozir tasdiqlangan: `approved`, muddati o'tmagan va bekor qilinmagan. */
export const isVerifiedNow = (status) =>
  status?.submission_status === 'approved' && !status.expired && !status.revoked_reason;

const REASON_KEYS = {
  myid_failed: 'myid.reasonMyidFailed',
  myid_code_invalid: 'myid.reasonCodeInvalid',
  myid_identity_mismatch: 'myid.reasonMismatch',
  myid_identity_incomplete: 'myid.reasonIncomplete',
  identity_pinfl_mismatch: 'myid.reasonOtherPerson',
  identity_pinfl_revoked: 'myid.reasonPinflRevoked',
  pinfl_already_used: 'myid.reasonPinfl',
  verification_returned_elsewhere: 'myid.reasonElsewhere',
  verification_attempt_expired: 'myid.reasonExpired',
  // 19.11 dan oldingi eski oqimning vaqt tugashi.
  state_expired: 'myid.reasonExpired',
  verification_state_expired: 'myid.reasonExpired',
};

/** Rad etilgan tekshiruv kodi (`rejected_reason`) → matn kaliti. */
export const reasonKey = (code) => REASON_KEYS[code ?? ''] ?? 'myid.providerFailed';

/** MyID kodsiz qaytganda sababi (MyID statusi bo'yicha). */
export function failureKey(status) {
  if (status === '2') return 'myid.failedPassport';
  if (status === '34') return 'myid.failedDocExpired';
  return 'myid.failedGeneric';
}

// ─── Qaytish havolasini o'qish ───────────────────────────────────

const one = (value) => {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' && first !== '' ? first : null;
};

/** Router parametrlaridan MyID javobi yoki null. */
export function myIdReturnFromParams(params) {
  const session = one(params?.session_id);
  return session
    ? { session_id: session, status: one(params.status), auth_code: one(params.auth_code) }
    : null;
}

/** Ilovaga kirgan havoladan MyID javobi; boshqa havola uchun null. */
export function myIdReturnFromUrl(url) {
  if (!url) return null;
  const at = url.indexOf('?');
  const head = at >= 0 ? url.slice(0, at) : url;
  if (!/(^|[/:])cabinet\/verify\/?$/.test(head)) return null;
  const query = {};
  for (const pair of (at >= 0 ? url.slice(at + 1) : '').split('#')[0].split('&')) {
    const eq = pair.indexOf('=');
    if (eq <= 0) continue;
    try {
      query[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(
        pair.slice(eq + 1).replace(/\+/g, ' ')
      );
    } catch {
      // Buzilgan escape: bu juftlik tashlab ketiladi.
    }
  }
  return myIdReturnFromParams(query);
}

/** MyID haqiqatan bergan kod: xato chiqishlarida kod yo'q yoki "undefined"/"null" so'zi keladi. */
export const usableCode = (code) => {
  const value = String(code ?? '').trim();
  return value !== '' && value !== 'undefined' && value !== 'null';
};

// ─── Holat ombori (komponentdan tashqarida) ──────────────────────
//
// Javob ekranning boshqa nusxasi ochiq turganda ham kelishi mumkin, shuning uchun holat
// ekranda emas, shu yerda turadi va hamma nusxa bir xil tekshiruvni ko'rsatadi.
//
// view: idle | opening | waiting | unfinished | final{sessionId,authCode,nonce,error?} |
//       finishing{sessionId,authCode,nonce,slow} | done{identity,status} | failed{status} |
//       refused{error?,reason?}

let view = { kind: 'idle' };
const listeners = new Set();

function showMyId(next) {
  view = next;
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getView = () => view;

/** Tekshiruvning hozirgi bosqichi (ekran shuni ko'rsatadi). */
export const useMyIdView = () => useSyncExternalStore(subscribe, getView, getView);

// Tugallanmagan tekshiruv: `nonce` — javob shu ilova boshlagan tekshiruvga tegishli ekanining
// isboti. Android ilovani MyID sahifasi ochiq paytda to'xtatishi mumkin, shuning uchun xavfsiz
// xotirada ham saqlanadi.
let held = null;

const validPending = (p) =>
  p &&
  typeof p === 'object' &&
  typeof p.session_id === 'string' &&
  p.session_id !== '' &&
  typeof p.nonce === 'string' &&
  p.nonce !== '' &&
  typeof p.expires_at === 'number';

async function readPending() {
  if (held) return held;
  try {
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    held = validPending(parsed) ? parsed : null;
  } catch {
    held = null;
  }
  return held;
}

async function savePending(pending) {
  held = pending;
  try {
    await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Xotirada qoladi: shu ishga tushishda tekshiruvni baribir yakunlash mumkin.
  }
}

async function clearPending() {
  held = null;
  try {
    await SecureStore.deleteItemAsync(PENDING_KEY);
  } catch {
    // Saqlanmagan yoki xotira yo'q: baribir yo'q.
  }
}

/** Hisobdan chiqishda: tekshiruv va uning holati sessiya bilan ketadi. */
export async function forgetMyIdAttempt() {
  stopWaiting();
  seen.clear();
  showMyId({ kind: 'idle' });
  await clearPending();
}

// ─── Oqim ────────────────────────────────────────────────────────

// Shu ishga tushishda ishlangan sessiyalar: bir javobning ikkinchi yo'li hech narsani o'zgartirmaydi.
const seen = new Set();
let lateLink = null;
let returnWatch = null;
// Ilova ichidagi brauzer havola kelganda ham ochiq qoladi (iOS): shunda yopiladi.
let inBrowser = false;

const pressing = (sessionId) => view.kind === 'finishing' && view.sessionId === sessionId;

function stopWaiting() {
  if (lateLink) clearTimeout(lateLink);
  lateLink = null;
  returnWatch?.remove();
  returnWatch = null;
}

// Qadam tugadi: ochiq ekranlar holatni qayta o'qiydi, muvaffaqiyatdan keyin profil ham.
function settled(next) {
  showMyId(next);
  noteVerificationChange();
}

function noteVerificationChange() {
  queryClient.invalidateQueries({ queryKey: ['identity', 'status'] });
  queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
}

// Sahifa javobsiz yopildi: kech keladigan havola uchun bir lahza, so'ng «Tasdiqlash yakunlanmadi».
function afterClose() {
  if (view.kind !== 'opening' && view.kind !== 'waiting') return;
  showMyId({ kind: 'waiting' });
  if (lateLink) clearTimeout(lateLink);
  lateLink = setTimeout(() => {
    lateLink = null;
    if (view.kind === 'waiting') settled({ kind: 'unfinished' });
  }, LATE_LINK_MS);
}

// Android'dagi ilova ichidagi brauzer alohida task: foydalanuvchi qaytishi ilovaning oldinga
// chiqishi sifatida ko'rinadi.
function watchReturn() {
  returnWatch?.remove();
  let away = AppState.currentState !== 'active';
  returnWatch = AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      away = true;
      return;
    }
    if (!away) return;
    returnWatch?.remove();
    returnWatch = null;
    afterClose();
  });
}

async function androidBrowser() {
  if (Platform.OS !== 'android') return undefined;
  try {
    const { browserPackages } = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    return BROWSERS.find((name) => browserPackages.includes(name));
  } catch {
    return undefined;
  }
}

async function openPage(url, requested) {
  // iPhone'da javob faqat auth sessiyasi orqali o'sha ilovaga qaytadi: u yerda doim auth oynasi.
  const mode = requested === 'browser' && Platform.OS === 'ios' ? 'auth_session' : requested;
  const browserPackage = await androidBrowser();
  inBrowser = mode === 'browser';
  if (mode === 'browser') {
    const result = await WebBrowser.openBrowserAsync(url, { browserPackage });
    // iOS oyna yopilganda javob beradi, Android darrov ("opened").
    if (result.type === 'opened') watchReturn();
    else afterClose();
    return;
  }
  const result = await WebBrowser.openAuthSessionAsync(url, MYID_RETURN_LINK, {
    preferEphemeralSession: true,
    browserPackage,
  });
  if (result.type === 'success') await receiveMyIdReturn(myIdReturnFromUrl(result.url));
  // Oyna ikki holatda ham yopilgan: bu tekshiruvning javobi bo'lmasa, kutish tugaydi.
  afterClose();
}

function closeBrowser() {
  if (!inBrowser) return;
  inBrowser = false;
  try {
    Promise.resolve(WebBrowser.dismissBrowser()).catch(() => undefined);
  } catch {
    // Android yopa olmaydi: foydalanuvchi o'zi yopadi.
  }
}

// Ilovaning o'z id'si (Android package / iOS bundle id): server uni saytning boshlash sahifasiga
// bildiradi, shunda MyID javobi boshqa mijoz ilovasiga emas, shu ilovaga qaytadi.
function ownAppId() {
  const app = Constants.expoConfig;
  return (Platform.OS === 'ios' ? app?.ios?.bundleIdentifier : app?.android?.package) ?? undefined;
}

/**
 * Tekshiruvni ochadi: server sessiyasi, bir martalik qiymat saqlanadi, MyID sahifasi ko'rsatiladi.
 * Boshlashni rad etgan (yoki brauzer ochilmagan) xatoni tashlaydi — forma o'zi aytadi.
 * Sahifadan keyingi har bir natija — ekran holati.
 * @param {{ birth_date: string, pinfl?: string, pass_data?: string }} body
 * @param {'auth_session'|'browser'|'website'|null|undefined} mode
 */
export async function startMyId(body, mode) {
  stopWaiting();
  showMyId({ kind: 'opening' });
  try {
    const started = await startMyIdCheck({ ...body, return_to: 'app', app_id: ownAppId() });
    await savePending({
      session_id: started.session_id,
      nonce: started.nonce,
      expires_at: Date.now() + (Number(started.expires_in) || 600) * 1000,
    });
    await openPage(started.open_url, mode ?? 'auth_session');
  } catch (e) {
    // Rad etildi yoki brauzer ochilmadi: yana forma, sababi bilan. Server ochgan urinish o'zi tugaydi.
    if (view.kind === 'opening') showMyId({ kind: 'idle' });
    throw e;
  }
}

/**
 * MyID javobi qayta ishlanadigan yagona joy, qaysi yo'l bilan kelmasin — sessiyaga bir marta.
 * Faqat shu telefon boshlagan va vaqti o'tmagan tekshiruv davom etadi: eski yoki begona havola
 * hech narsani yakunlamaydi.
 * @param {{ session_id: string, status: string|null, auth_code: string|null } | null} back
 */
export async function receiveMyIdReturn(back) {
  if (!back || seen.has(back.session_id)) return;
  seen.add(back.session_id);
  const pending = await readPending();
  // Bu telefon boshlagan tekshiruv emas: hech narsani yakunlamaydi, davom etayotgani davom etadi.
  if (!pending || pending.session_id !== back.session_id) return;
  stopWaiting();
  closeBrowser();
  if (pending.expires_at < Date.now()) {
    // MyID sessiyasi tugagan: server kodni baribir rad etadi.
    await clearPending();
    settled({ kind: 'refused', reason: 'verification_attempt_expired' });
    return;
  }
  if (usableCode(back.auth_code) && back.status !== 'error') {
    showMyId({
      kind: 'final',
      sessionId: back.session_id,
      authCode: back.auth_code,
      nonce: pending.nonce,
    });
    return;
  }
  // Kodsiz qaytdi (yuz mos kelmadi, bekor qilindi, MyID xatosi): urinish yopiladi.
  showMyId({ kind: 'failed', status: back.status });
  try {
    await abandonMyIdCheck({ session_id: back.session_id, nonce: pending.nonce });
  } catch {
    // MyID sessiyasi tugagach serverning o'zi yopadi.
  }
  await clearPending();
  noteVerificationChange();
}

// Qayta bosish o'tishi mumkin: MyID jim (503), tarmoq yo'q yoki vaqt tugadi, limit, server xatosi.
// 404, 409 yoki rad etilgan body — oxirgi: urinish yo'q yoki rad etilgan.
function worthRetrying(error) {
  if (!(error instanceof ApiError)) return true;
  return error.status === 0 || error.status === 429 || error.status >= 500;
}

async function succeeded(sessionId, identity, status) {
  await clearPending();
  if (pressing(sessionId)) settled({ kind: 'done', identity, status });
  else noteVerificationChange();
}

async function refused(sessionId, why) {
  await clearPending();
  if (pressing(sessionId)) settled({ kind: 'refused', ...why });
  else noteVerificationChange();
}

// 409 `verification_in_progress`: boshqa bosish shu tekshiruvni yakunlayapti. Holat har 3 soniyada
// bir daqiqagacha so'raladi. Birinchi tasdiq approved/rejected bo'ladi; yangilangani — yangi
// `verified_at` bilan. Tayyor bo'lgach xuddi shu bosish MyID ismlari bilan javob beradi.
async function waitForVerdict(press, before) {
  const until = Date.now() + POLL_FOR_MS;
  while (Date.now() < until) {
    await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
    if (!pressing(press.sessionId)) return;
    let now;
    try {
      now = await getIdentityStatus();
    } catch {
      continue;
    }
    if (!pressing(press.sessionId)) return;
    if (now.submission_status === 'pending') continue;
    if (now.submission_status === 'rejected') {
      return refused(press.sessionId, { reason: now.rejected_reason ?? null });
    }
    const wasApproved = before?.submission_status === 'approved';
    if (
      now.submission_status === 'approved' &&
      (!wasApproved || now.verified_at !== before?.verified_at)
    ) {
      try {
        const out = await completeMyIdCheck({
          session_id: press.sessionId,
          auth_code: press.authCode,
          nonce: press.nonce,
        });
        return succeeded(press.sessionId, out.identity, out.status);
      } catch {
        return succeeded(press.sessionId, null, now);
      }
    }
    // Hukmsiz tugadi (vaqti o'tdi): yakunlanadigan narsa qolmadi.
    if (now.submission_status === 'not_submitted' && !wasApproved) {
      return refused(press.sessionId, { reason: null });
    }
  }
  // Bir daqiqada hukm yo'q: yana tugma — ikki marta bosilsa ham bir xil javob beriladi.
  if (pressing(press.sessionId)) {
    showMyId({
      kind: 'final',
      ...press,
      error: new ApiError({ status: 409, code: 'verification_in_progress' }),
    });
  }
}

/**
 * «Tasdiqlashni yakunlash» — faqat foydalanuvchining o'z bosishi.
 * `before`: ekran ko'rsatgan holat (yangilangan tasdiqni eskisidan ajratish uchun).
 */
export async function finishMyId(before) {
  if (view.kind !== 'final') return;
  const press = { sessionId: view.sessionId, authCode: view.authCode, nonce: view.nonce };
  showMyId({ kind: 'finishing', ...press, slow: false });
  const slow = setTimeout(() => {
    if (view.kind === 'finishing' && view.sessionId === press.sessionId) {
      showMyId({ ...view, slow: true });
    }
  }, SLOW_MS);
  try {
    const out = await completeMyIdCheck({
      session_id: press.sessionId,
      auth_code: press.authCode,
      nonce: press.nonce,
    });
    await succeeded(press.sessionId, out.identity, out.status);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409 && e.code === 'verification_in_progress') {
      await waitForVerdict(press, before);
    } else if (worthRetrying(e)) {
      if (pressing(press.sessionId)) showMyId({ kind: 'final', ...press, error: e });
    } else {
      await refused(press.sessionId, { error: e });
    }
  } finally {
    clearTimeout(slow);
  }
}

/** «Qaytadan boshlash»: yana forma. Serverda ochiq urinish keyingisi boshlanganda o'rnini beradi. */
export function restartMyId() {
  stopWaiting();
  showMyId({ kind: 'idle' });
}

/** Ekrandan chiqish: ko'rsatilgan natija keyingi safar qayta ko'rsatilmaydi; davom etayotgani saqlanadi. */
export function leaveMyId() {
  const { kind } = view;
  if (kind === 'done' || kind === 'failed' || kind === 'refused' || kind === 'unfinished') {
    showMyId({ kind: 'idle' });
  }
}
