// Kirmasdan yordam so'rash (mehmon) matnlari. Xato kodlari backend `support/antiabuse.py` dan:
// `captcha_required`, `captcha_failed`, `support_anon_quota_exceeded`.
export const GUEST_SUPPORT_TEXTS = {
  uz: {
    guestSupport: {
      helpLink: 'Yordam kerakmi?',
      sent: 'Murojaatingiz qabul qilindi. Javob siz ko‘rsatgan aloqa vositasi orqali keladi.',
      note: 'Kirsangiz, javob shu ilovada va xabarnomalarda ko‘rinadi.',
      login: 'Kirish',
      nameRequired: 'Ismingizni yozing (kamida 2 ta belgi)',
      contactRequired: 'Aloqa uchun telefon, email yoki Telegram kiriting',
      captchaWait: 'Avval “Men robot emasman” tekshiruvidan o‘ting',
      captchaRequired: 'Robot emasligingizni tasdiqlang va qayta yuboring',
      captchaFailed: 'Tekshiruvdan o‘tilmadi. Qayta urinib ko‘ring',
      quota: 'Bir soat ichida juda ko‘p murojaat yubordingiz. Birozdan keyin urinib ko‘ring',
    },
  },
  ru: {
    guestSupport: {
      helpLink: 'Нужна помощь?',
      sent: 'Обращение принято. Ответ придёт по указанному вами контакту.',
      note: 'Если войдёте в аккаунт, ответ появится в приложении и в уведомлениях.',
      login: 'Войти',
      nameRequired: 'Укажите имя (не менее 2 символов)',
      contactRequired: 'Укажите телефон, email или Telegram для связи',
      captchaWait: 'Сначала пройдите проверку «Я не робот»',
      captchaRequired: 'Подтвердите, что вы не робот, и отправьте снова',
      captchaFailed: 'Проверка не пройдена. Попробуйте ещё раз',
      quota: 'Вы отправили слишком много обращений за час. Попробуйте чуть позже',
    },
  },
  en: {
    guestSupport: {
      helpLink: 'Need help?',
      sent: 'Your message was received. The reply comes through the contact you gave.',
      note: 'If you sign in, the reply shows up in the app and in notifications.',
      login: 'Sign in',
      nameRequired: 'Enter your name (at least 2 characters)',
      contactRequired: 'Enter a phone, email or Telegram to reach you',
      captchaWait: 'Please complete the “I am not a robot” check first',
      captchaRequired: 'Confirm you are not a robot and send again',
      captchaFailed: 'The check was not passed. Please try again',
      quota: 'You have sent too many messages this hour. Please try again a little later',
    },
  },
};
