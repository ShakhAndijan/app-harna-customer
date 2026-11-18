import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// `harna://auth/google` — Google kirishidan qaytish manzili. Tokenni `WebBrowser.openAuthSessionAsync`
// o'zi oladi (src/api/auth.js); Android havolani router'ga ham uzatsa, bu marshrut bo'sh ekran
// ko'rsatmay, kirish ekraniga qaytaradi.
export default function GoogleReturnRoute() {
  const router = useRouter();
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);
  return null;
}
