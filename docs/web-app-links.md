# Veb-sayt uchun topshiriq: ilova havolalari (App Links / Universal Links)

## Maqsad

Foydalanuvchi Telegram, SMS yoki boshqa joyda `https://harna.uz/mutaxassis/2` kabi havolani bosganda:

- telefonda **harna.uz ilovasi o'rnatilgan bo'lsa** — havola to'g'ridan-to'g'ri ilovada ochiladi;
- **ilova yo'q bo'lsa** — odatdagidek sayt ochiladi (hech narsa buzilmaydi).

Havola o'zgarmaydi, shuning uchun Telegramdagi chiroyli oldindan ko'rinish (rasm, sarlavha) ham saqlanadi.

Ilova tomoni tayyor. Saytdan faqat **2 ta kichik fayl** joylashtirish kerak (3-bo'limda — ixtiyoriy yaxshilanish).

## Qaysi havolalar ilovada ochiladi

| Sayt yo'li | Ilovada ochiladigan ekran |
| --- | --- |
| `/mutaxassis/{id}` | mutaxassis profili |
| `/listings/{id}` | e'lon sahifasi |
| `/maqolalar/{slug}` | maqola |

Domenlar: `harna.uz` va `dev.harna.uz` (test).

## 1. Android: `assetlinks.json`

Manzil (aynan shu yo'l, `https`, yo'naltirishsiz, `Content-Type: application/json`):

```
https://harna.uz/.well-known/assetlinks.json
https://dev.harna.uz/.well-known/assetlinks.json
```

Mazmuni tayyor: shu papkadagi [`assetlinks.json`](assetlinks.json) faylini aynan shunday joylashtiring
(ichida hozirgi EAS imzo kaliti turibdi).

> **Eslatma:** ilova Google Play'ga joylanganda (Play App Signing yoqilsa) foydalanuvchilarga tushadigan
> ilova Google kaliti bilan imzolanadi. O'sha payt Play Console → App integrity → App signing dagi
> SHA-256 ni `sha256_cert_fingerprints` massiviga **qo'shimcha** qator qilib yozing (eskisini o'chirmang).

## 2. iOS: `apple-app-site-association`

Manzil (**kengaytmasiz** fayl nomi, `https`, yo'naltirishsiz, `Content-Type: application/json`):

```
https://harna.uz/.well-known/apple-app-site-association
https://dev.harna.uz/.well-known/apple-app-site-association
```

Mazmuni:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["APPLE_TEAM_ID.uz.harna.customer"],
        "components": [
          { "/": "/mutaxassis/*" },
          { "/": "/listings/*" },
          { "/": "/maqolalar/*" }
        ]
      }
    ]
  }
}
```

`APPLE_TEAM_ID` — Apple Developer hisobidagi 10 belgili Team ID (ilova egasi beradi).

## 3. (Ixtiyoriy) Sahifada "Ilovada ochish" tugmasi

Ba'zi chatlar (masalan Telegram) havolani o'zining ichki brauzerida ochadi va u ilovaga o'tmasligi mumkin.
Shuning uchun usta/e'lon sahifasida tugma qo'ying: `mobile-app-afish://usta/{id}` (usta),
`mobile-app-afish://listing/{id}` (e'lon). Ilova yo'q bo'lsa — Play Market / App Store havolasiga olib boring.

## Tekshirish

- Fayl ochiladimi: brauzerda yuqoridagi manzillarni oching (JSON ko'rinishi kerak, 200 kod, yo'naltirish yo'q).
- Android: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://harna.uz&relation=delegate_permission/common.handle_all_urls` — javobda `uz.harna.customer` bo'lishi kerak.
- Telefonda (yangi build o'rnatilgach): havolani Notes/SMS'ga yozib bosing.

## Muhim

- Fayllar o'zgargach ilovani qayta o'rnatish shart emas, lekin Android tekshiruvi bir necha daqiqadan bir necha soatgacha kechikishi mumkin.
- Fayllar **autentifikatsiyasiz**, hammaga ochiq bo'lishi kerak (login/redirect/Cloudflare challenge bo'lmasin).
- Yangi yo'l qo'shilsa (masalan `/orders/...`), ilovaga ham qo'shish kerak.
