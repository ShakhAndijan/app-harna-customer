// Tashqaridan ochilgan havola (`harna://...`, `mobile-app-afish://...`, sayt `https://dev.harna.uz/...`)
// ilovaning o'z ekraniga yo'naltiriladi. Sayt va backend ilovasidagi manzillar bizning fayl marshrutlarimizdan
// farq qiladi (`/mutaxassis/7` → `/usta/7`, `/about` → `/document?key=about`), shuning uchun shu yerda moslanadi.
// Hech qachon xato tashlamaydi: tushunilmagan havola o'z holicha qoladi (yo'q marshrut `+not-found`ga tushadi).
const DOCS = ['about', 'privacy', 'terms'];

// Expo Go `exp://host/--/yo'l`, sayt `https://host/yo'l`, scheme `harna://yo'l` — uchalasidan ham yo'l ajratiladi.
function pathOf(raw) {
  const dev = raw.indexOf('/--/');
  const bare =
    dev >= 0
      ? raw.slice(dev + 3)
      : /^https?:\/\//i.test(raw)
        ? raw.replace(/^https?:\/\/[^/]+/i, '')
        : raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const [pathname, search = ''] = (bare.startsWith('/') ? bare : `/${bare}`)
    .split('#')[0]
    .split('?');
  return { pathname: pathname.replace(/\/+$/, '') || '/', search };
}

export function redirectSystemPath({ path }) {
  try {
    if (typeof path !== 'string' || !path) return path;
    const { pathname, search } = pathOf(path);
    const params = new URLSearchParams(search);

    // Usta profili: sayt `/mutaxassis/7`, eski `/workers/7`.
    let m = /^\/(?:mutaxassis|usta|workers)\/(\d+)$/.exec(pathname);
    if (m) return `/usta/${m[1]}`;

    // E'lon: sayt `/listings/7`.
    m = /^\/(?:listings|listing)\/(\d+)$/.exec(pathname);
    if (m) return `/listing/${m[1]}`;

    // Hujjatlar: `/about`, `/privacy`, `/terms`.
    m = /^\/(about|privacy|terms)$/.exec(pathname);
    if (m && DOCS.includes(m[1])) return `/document?key=${m[1]}`;

    // Buyurtma formasi: sayt `/buyurtma?worker=7` / `?listing=7`. Bizning `worker` parametrimiz usta obyekti (JSON),
    // shuning uchun raqamli id bilan usta profiliga/e'longa olib boramiz — "Chaqirish" o'sha yerda.
    if (pathname === '/buyurtma' || pathname === '/new-order') {
      const worker = Number(params.get('worker'));
      const listing = Number(params.get('listing'));
      const again = Number(params.get('again'));
      if (listing > 0) return `/listing/${listing}`;
      if (worker > 0) return `/usta/${worker}`;
      return again > 0 ? `/new-order?again=${again}` : '/new-order';
    }

    // Murojaatlar / takliflar: `/support?kind=suggestion`.
    if (pathname === '/support') {
      return params.get('kind') === 'suggestion'
        ? '/support?kind=suggestion'
        : '/support?kind=question';
    }

    return path;
  } catch {
    return path;
  }
}
