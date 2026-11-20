import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import useAuthGate from '../hooks/useAuthGate';
import { clearTokens } from '../utils/token';
import { setSessionExpiredHandler } from '../utils/apiClient';
import { revokeSession } from '../api/auth';
import { clearCachedUser } from './UserContext';
import { queryClient } from '../queries/client';
import { forgetPush, unregisterPush } from '../utils/push';
import { forgetMyIdAttempt } from '../utils/myid';

const AuthContext = createContext({
  signedIn: false,
  checked: false,
  locked: false,
  unlocking: false,
  signIn: () => {},
  signOut: async () => {},
  accountDeleted: async () => {},
  retryUnlock: () => {},
  abandonSession: () => {},
});

// Kirish holati: `signedIn` marshrutlarni himoyalaydi (src/app/_layout.js), `checked`/`locked` —
// ilova ochilganda saqlangan sessiyani (biometrik bilan) tekshirish bosqichi.
export function AuthProvider({ children }) {
  const [signedIn, setSignedIn] = useState(false);
  const gate = useAuthGate({ onUnlocked: () => setSignedIn(true) });

  const signIn = useCallback(() => setSignedIn(true), []);

  const endSession = useCallback(async () => {
    await clearTokens();
    await clearCachedUser();
    // Tugallanmagan MyID tekshiruvi keyingi hisobga o'tib ketmasin.
    await forgetMyIdAttempt();
    // Oldingi foydalanuvchining keshlangan ma'lumoti keyingisiga ko'rinmasin.
    queryClient.clear();
    setSignedIn(false);
  }, []);

  // Foydalanuvchi o'zi chiqadi: refresh token serverda ham bekor qilinadi.
  const signOut = useCallback(async () => {
    // Token hali yaroqli paytda: shu qurilmaga keyingi foydalanuvchi xabari kelmasin.
    await unregisterPush();
    await revokeSession();
    await endSession();
  }, [endSession]);

  // Hisob o'chirildi: server sessiyani o'zi yopgan, shuning uchun tarmoq so'rovisiz faqat mahalliy tozalash.
  const accountDeleted = useCallback(async () => {
    await forgetPush();
    await endSession();
  }, [endSession]);

  // Refresh token ham yaroqsiz bo'lsa (muddati tugagan yoki boshqa qurilmadan bekor qilingan),
  // sessiya jimgina tugatiladi va foydalanuvchi kirish ekraniga qaytadi.
  useEffect(() => {
    setSessionExpiredHandler(endSession);
    return () => setSessionExpiredHandler(null);
  }, [endSession]);

  const value = useMemo(
    () => ({
      signedIn,
      checked: gate.authChecked,
      locked: gate.locked,
      unlocking: gate.unlocking,
      retryUnlock: gate.retryUnlock,
      abandonSession: gate.abandonSession,
      signIn,
      signOut,
      accountDeleted,
    }),
    [
      signedIn,
      gate.authChecked,
      gate.locked,
      gate.unlocking,
      gate.retryUnlock,
      gate.abandonSession,
      signIn,
      signOut,
      accountDeleted,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
