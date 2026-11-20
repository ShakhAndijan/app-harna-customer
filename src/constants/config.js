// Backend manzili va xarita kalitlari to'g'ridan-to'g'ri shu yerda turadi (loyiha ikki xil
// kompyuterda gitdan olinib ishlatiladi, .env gitga kirmaydi). .env dagi EXPO_PUBLIC_* qiymatlari
// berilsa, ular shu qiymatlardan ustun turadi. Backend tayyor bo'lgach geocoder serverga o'tadi.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev-back.harna.uz'
).replace(/\/+$/, '');

// Backendga so'rov mobil ilovadan kelayotganini bildiradi: masalan, kod SMS'i "mobil ilovasiga kirish"
// matni bilan yuboriladi (sarlavhasiz so'rovga "vebsayt" matni ketadi). Backend'ga yuboriladigan
// HAR BIR so'rovda bo'lishi kerak; tashqi xizmatlarga (Yandex, presigned yuklash) yuborilmaydi.
export const CLIENT_HEADERS = { 'X-Harna-Client': 'app' };

export const YANDEX_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_YANDEX_MAPS_API_KEY || 'e9e77baf-a133-46b1-9f59-055744b55c57';
export const YANDEX_GEOCODER_API_KEY =
  process.env.EXPO_PUBLIC_YANDEX_GEOCODER_API_KEY || 'ca902206-f8b0-42a0-8ba2-9ae813f026d8';

// Imkoniyat bayroqlari.
export const FEATURES = {
  // "Barcha xizmatlar" tepasidagi umumiy statistika: ma'lumotlar yetarli bo'lgach yoqiladi.
  overallStats: false,
  // Profildagi "Manzillarim" (saqlangan manzillar ro'yxati).
  savedAddresses: true,
};

// Qo'llab-quvvatlash aloqa ma'lumotlari — FAQAT ZAXIRA: ilova avval saytning dev.harna.uz/config.json'ini
// o'qiydi (`useSupportContact`), shu qiymatlar fayl yuklanmaguncha yoki unda yo'q bo'lsa ishlatiladi.
// Bo'sh qiymat ilovada ko'rsatilmaydi.
export const SUPPORT_CONTACT = {
  phone: '+998942599590',
  email: 'support@harna.uz',
  telegram: '',
};

// Sayt manzili: maqola havolalari va ulashish uchun (dev.harna.uz/maqolalar/{slug}).
export const SITE_URL = 'https://dev.harna.uz';

export const ENDPOINTS = {
  AUTH_GOOGLE_LOGIN: `${API_BASE_URL}/api/v1/auth/google/login`,
  CUSTOMER_LOGIN: `${API_BASE_URL}/api/v1/auth/customer/login`,
  AUTH_CUSTOMER_START: `${API_BASE_URL}/api/v1/auth/customer/start`,
  AUTH_CUSTOMER_VERIFY: `${API_BASE_URL}/api/v1/auth/customer/verify`,
  AUTH_CUSTOMER_COMPLETE: `${API_BASE_URL}/api/v1/auth/customer/complete`,
  AUTH_ME: `${API_BASE_URL}/api/v1/auth/me`,
  AUTH_REFRESH: `${API_BASE_URL}/api/v1/auth/refresh`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
  AUTH_SET_PASSWORD: `${API_BASE_URL}/api/v1/auth/set-password`,
  NOTIFICATIONS: (page = 1, size = 15) =>
    `${API_BASE_URL}/api/v1/notifications?page=${page}&size=${size}`,
  NOTIFICATIONS_UNREAD: `${API_BASE_URL}/api/v1/notifications/unread-count`,
  NOTIFICATIONS_READ_ALL: `${API_BASE_URL}/api/v1/notifications/read-all`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}/api/v1/notifications/${id}/read`,
  // Mobil push (FCM) qurilma tokenlari (src/api/push.js).
  PUSH_DEVICES: `${API_BASE_URL}/api/v1/push/devices`,
  PUSH_DEVICES_REMOVE: `${API_BASE_URL}/api/v1/push/devices/remove`,
  // Huquqiy hujjatlar, shaxsiy ma'lumotlarga rozilik va hisobni o'chirish (src/api/legal.js).
  LEGAL: `${API_BASE_URL}/api/v1/legal`,
  LEGAL_DOC: (key) => `${API_BASE_URL}/api/v1/legal/${key}`,
  AUTH_PREFERENCES: `${API_BASE_URL}/api/v1/auth/preferences`,
  AUTH_CONSENT: `${API_BASE_URL}/api/v1/auth/consent`,
  ACCOUNT_DELETION: `${API_BASE_URL}/api/v1/auth/account/deletion`,
  ACCOUNT_DELETE: `${API_BASE_URL}/api/v1/auth/account/delete`,
  FAQ: `${API_BASE_URL}/api/v1/faq`,
  SUPPORT_MESSAGES: `${API_BASE_URL}/api/v1/support/messages`,
  SUPPORT_CONVERSATION: `${API_BASE_URL}/api/v1/support/conversation`,
  SUPPORT_CONVERSATION_READ: `${API_BASE_URL}/api/v1/support/conversation/read`,
  SUPPORT_ITEMS: (kind) => `${API_BASE_URL}/api/v1/support/items?kind=${kind}`,
  BADGE_LEVELS: `${API_BASE_URL}/api/v1/badges/levels`,
  CUSTOMER_REVIEWS: (customerId, limit = 20) =>
    `${API_BASE_URL}/api/v1/reviews/customers/${customerId}?limit=${limit}`,
  VERIFY_EMAIL_REQUEST_OTP: `${API_BASE_URL}/api/v1/auth/verify-email/request-otp`,
  VERIFY_EMAIL_VERIFY_OTP: `${API_BASE_URL}/api/v1/auth/verify-email/verify-otp`,
  VERIFY_STATUS: `${API_BASE_URL}/api/v1/auth/verify/status`,
  VERIFY_MYID_START: `${API_BASE_URL}/api/v1/auth/verify/myid/start`,
  VERIFY_MYID_COMPLETE: `${API_BASE_URL}/api/v1/auth/verify/myid/complete`,
  VERIFY_MYID_ABANDON: `${API_BASE_URL}/api/v1/auth/verify/myid/abandon`,
  TELEGRAM_LOGIN_CONFIG: `${API_BASE_URL}/api/v1/auth/telegram/config`,
  TELEGRAM_LOGIN_VERIFY: `${API_BASE_URL}/api/v1/auth/telegram/verify`,
  TELEGRAM_LINK_STATUS: `${API_BASE_URL}/api/v1/auth/telegram/status`,
  TELEGRAM_LINK: `${API_BASE_URL}/api/v1/auth/telegram/link`,
  AUTH_CHANGE_PHONE_REQUEST_OTP: `${API_BASE_URL}/api/v1/auth/change-phone/request-otp`,
  AUTH_CHANGE_PHONE_VERIFY_OTP: `${API_BASE_URL}/api/v1/auth/change-phone/verify-otp`,
  RESET_PASSWORD_REQUEST_OTP: `${API_BASE_URL}/api/v1/auth/reset-password/request-otp`,
  RESET_PASSWORD_VERIFY_OTP: `${API_BASE_URL}/api/v1/auth/reset-password/verify-otp`,
  CATEGORIES: `${API_BASE_URL}/api/v1/categories`,
  CATEGORIES_SUGGEST: `${API_BASE_URL}/api/v1/categories/suggest`,

  GENDERS: `${API_BASE_URL}/api/v1/genders`,
  REGIONS: `${API_BASE_URL}/api/v1/regions`,
  DISTRICTS: (regionId) => `${API_BASE_URL}/api/v1/regions/${regionId}/districts`,
  WORKERS: `${API_BASE_URL}/api/v1/workers`,
  WORKER_DETAIL: (workerId) => `${API_BASE_URL}/api/v1/workers/${workerId}`,
  WORKER_PRESENCE: (ids) => `${API_BASE_URL}/api/v1/workers/presence?ids=${ids.join(',')}`,
  WORKER_AVAILABILITY: (workerId, days = 35) =>
    `${API_BASE_URL}/api/v1/workers/${workerId}/availability?days=${days}`,
  WORKER_MAP_CLUSTERS: `${API_BASE_URL}/api/v1/workers/map-clusters`,
  CONTEST_WINNERS: (limit = 12) => `${API_BASE_URL}/api/v1/contest/winners?limit=${limit}`,
  CUSTOMER_TOP_CATEGORIES: (days = 90, limit = 10) =>
    `${API_BASE_URL}/api/v1/customers/me/top-categories?days=${days}&limit=${limit}`,
  CUSTOMER_LIKED_LISTINGS: (page = 1, size = 20) =>
    `${API_BASE_URL}/api/v1/customers/me/liked-listings?page=${page}&size=${size}`,
  LISTING_AUTHORS: (q, limit = 10) =>
    `${API_BASE_URL}/api/v1/listings/authors?q=${encodeURIComponent(q)}&limit=${limit}`,
  WORKER_COMPLAINTS: (workerId, page = 1, size = 10) =>
    `${API_BASE_URL}/api/v1/workers/${workerId}/complaints?page=${page}&size=${size}`,
  WORKER_COMPLAINT_OPTIONS: (workerId) =>
    `${API_BASE_URL}/api/v1/workers/${workerId}/complaints/options`,
  WORKER_COMPLAINT_CREATE: (workerId) => `${API_BASE_URL}/api/v1/workers/${workerId}/complaints`,
  MY_COMPLAINTS: (page = 1, size = 20) =>
    `${API_BASE_URL}/api/v1/customers/me/complaints?page=${page}&size=${size}`,
  MY_COMPLAINT_WITHDRAW: (id) => `${API_BASE_URL}/api/v1/customers/me/complaints/${id}/withdraw`,
  ARTICLES: (page = 1, size = 50) => `${API_BASE_URL}/api/v1/articles?page=${page}&size=${size}`,
  ARTICLE: (slug) => `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}`,
  BUSINESS_ME: `${API_BASE_URL}/api/v1/business/me`,
  BUSINESS_APPLY: `${API_BASE_URL}/api/v1/business/apply`,
  BUSINESS_SITES: `${API_BASE_URL}/api/v1/business/sites`,
  BUSINESS_SITE: (id) => `${API_BASE_URL}/api/v1/business/sites/${id}`,
  BUSINESS_PLANS: `${API_BASE_URL}/api/v1/business/plans`,
  BUSINESS_PLAN: (id) => `${API_BASE_URL}/api/v1/business/plans/${id}`,
  BUSINESS_STATEMENT: (period) => `${API_BASE_URL}/api/v1/business/statements/${period}`,
  BUSINESS_STATEMENT_ACT: (period) => `${API_BASE_URL}/api/v1/business/statements/${period}/act`,
  BUSINESS_STATEMENT_CSV: (period) => `${API_BASE_URL}/api/v1/business/statements/${period}/csv`,
  BUSINESS_MEMBERS: `${API_BASE_URL}/api/v1/business/members`,
  BUSINESS_MEMBER: (id) => `${API_BASE_URL}/api/v1/business/members/${id}`,
  BUSINESS_LEAVE: `${API_BASE_URL}/api/v1/business/leave`,
  WORKER_CERTIFICATES: (workerId, categoryId) =>
    categoryId
      ? `${API_BASE_URL}/api/v1/workers/${workerId}/certificates?category_id=${categoryId}`
      : `${API_BASE_URL}/api/v1/workers/${workerId}/certificates`,
  WORKER_REVIEWS: (workerId, page = 1, size = 10) =>
    `${API_BASE_URL}/api/v1/workers/${workerId}/reviews?page=${page}&size=${size}`,
  WORKER_COMPLETED_JOBS: (workerId, page = 1, size = 10) =>
    `${API_BASE_URL}/api/v1/workers/${workerId}/completed-jobs?page=${page}&size=${size}`,
  SYSTEM_STATS: `${API_BASE_URL}/api/v1/system/stats`,
  SYSTEM_INFO: `${API_BASE_URL}/api/v1/system/info`,
  SYSTEM_ORDER_TIMING: `${API_BASE_URL}/api/v1/system/order-timing`,
  REGION_NEAREST: (lat, lon) => `${API_BASE_URL}/api/v1/regions/nearest?lat=${lat}&lon=${lon}`,
  ANALYTICS_EVENTS: `${API_BASE_URL}/api/v1/analytics/events`,
  TOP_COMMENTS: (limit = 10) => `${API_BASE_URL}/api/v1/reviews/top-comments?limit=${limit}`,
  TOP_ORDERS: (limit = 10) => `${API_BASE_URL}/api/v1/reviews/top-orders?limit=${limit}`,
  CUSTOMER_ME: `${API_BASE_URL}/api/v1/customers/me`,
  CUSTOMER_FAVORITES: (page = 1, size = 10) =>
    `${API_BASE_URL}/api/v1/customers/me/favorites?page=${page}&size=${size}`,
  CUSTOMER_FAVORITE: (workerId) => `${API_BASE_URL}/api/v1/customers/me/favorites/${workerId}`,
  // Ustaning ochiq "yoqtirish"i (sevimlilardan boshqa): POST / DELETE → `{ likes_count, liked }`.
  WORKER_LIKE: (workerId) => `${API_BASE_URL}/api/v1/workers/${workerId}/like`,
  CUSTOMER_AVATAR_UPLOAD_URL: `${API_BASE_URL}/api/v1/customers/me/avatar/upload-url`,
  CUSTOMER_AVATAR_CONFIRM: `${API_BASE_URL}/api/v1/customers/me/avatar/confirm`,
  CUSTOMER_AVATAR: `${API_BASE_URL}/api/v1/customers/me/avatar`,
  ORDERS: `${API_BASE_URL}/api/v1/orders`,
  ORDER_UPLOAD_URL: `${API_BASE_URL}/api/v1/orders/upload-url`,
  MY_ORDERS: (limit = 100, offset = 0) =>
    `${API_BASE_URL}/api/v1/orders/me/customer?limit=${limit}&offset=${offset}`,
  PUBLIC_ORDER: (token) => `${API_BASE_URL}/api/v1/orders/public/${encodeURIComponent(token)}`,
  ORDER_DETAIL: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}`,
  ORDER_AGAIN: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/again`,
  ORDER_PAYMENT: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/payment`,
  // Tanlab olinadigan omonat: yangi buyurtma omonat talab qiladimi va uni to'lash.
  ORDER_DEPOSIT_REQUIREMENT: `${API_BASE_URL}/api/v1/orders/deposit-requirement`,
  ORDER_DEPOSIT_PAY: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/deposit/pay`,
  ORDER_CHAT: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/chat`,
  ORDER_CHAT_READ: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/chat/read`,
  ORDER_OFFER: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/offer`,
  ORDER_AGREE: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/agree`,
  ORDER_DECLINE: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/decline`,
  ORDER_SEND_TO: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/send-to`,
  ORDER_PUBLISH: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/publish`,
  ORDER_CANCEL: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/cancel-by-customer`,
  ORDER_RECALL: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/recall`,
  ORDER_LOCATION: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/location`,
  ORDER_REPOST: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/repost`,
  ORDER_REVIEW: (orderId) => `${API_BASE_URL}/api/v1/reviews/orders/${orderId}`,
  REVIEW_PHOTO_UPLOAD_URL: `${API_BASE_URL}/api/v1/reviews/photos/upload-url`,
  ORDER_COMPLETE: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/complete`,
  ORDER_FINAL_COMMENT: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/final-comment`,
  ORDER_STAGES: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/stages`,
  ORDER_STAGE_CONFIRM: (orderId, stageId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/stages/${stageId}/confirm`,
  ORDER_EXTRA_DECISION: (orderId, extraId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/extras/${extraId}/decision`,
  ORDER_ARRIVAL_CHECK: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/arrival-check`,
  ORDER_GUARANTEE_CLAIM: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/guarantee-claim`,
  ORDER_GUARANTEE_CHECK: (orderId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/guarantee-claim/check`,
  PAYMENT_PROVIDERS: `${API_BASE_URL}/api/v1/payments/providers`,
  ORDER_COMPLAINT_ANSWER: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/complaint/answer`,
  ORDER_WORK_NOT_DONE: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/work-not-done`,
  ORDER_OFFERS: (orderId) => `${API_BASE_URL}/api/v1/orders/${orderId}/offers`,
  ORDER_OFFER_CHOOSE: (orderId, offerId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/offers/${offerId}/choose`,
  ORDER_OFFER_PRICE: (orderId, offerId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/offers/${offerId}/price`,
  ORDER_OFFER_REJECT: (orderId, offerId) =>
    `${API_BASE_URL}/api/v1/orders/${orderId}/offers/${offerId}/reject`,

  // Usta xizmat e'lonlari. `browse` sahifalangan ({ items, pagination }) va barcha filtrlarni biladi.
  LISTINGS_BROWSE: `${API_BASE_URL}/api/v1/listings/browse`,
  LISTING_DETAIL: (listingId) => `${API_BASE_URL}/api/v1/listings/${listingId}`,
  LISTING_COMMENTS: (listingId) => `${API_BASE_URL}/api/v1/listings/${listingId}/comments`,
  LISTING_COMMENT: (listingId, commentId) =>
    `${API_BASE_URL}/api/v1/listings/${listingId}/comments/${commentId}`,
  LISTING_FAVORITES: (page = 1, size = 12) =>
    `${API_BASE_URL}/api/v1/customers/me/listing-favorites?page=${page}&size=${size}`,
  LISTING_FAVORITE: (listingId) =>
    `${API_BASE_URL}/api/v1/customers/me/listing-favorites/${listingId}`,
  LISTING_LIKE: (listingId) => `${API_BASE_URL}/api/v1/listings/${listingId}/like`,
};
// https://engraver-garnet-scalded.ngrok-free.dev
// http://10.240.8.109:9494

// Push-bildirishnomalar (expo-notifications). Expo Go da ishlamaydi: development/production build kerak.
export const PUSH_ENABLED = true;
