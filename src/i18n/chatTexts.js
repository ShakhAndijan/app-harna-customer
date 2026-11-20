// Buyurtma chatidagi yuborish navbati, yetkazildi/o'qildi belgilari, tahrirlash, qayta yuborish va arxiv matnlari —
// backend dasturchisining ilova tarjimalaridan (veb `orderChat` va `common`).
export const CHAT_TEXTS = {
  uz: {
    orderChat: {
      archived: 'Arxiv',
      archivedOnly: 'Bu suhbat arxivda — yangi xabar yozib bo‘lmaydi',
      retry: 'Qayta yuborish',
      edit: 'Tahrirlash',
      remove: 'O‘chirish',
      unknownWorker: 'Mutaxassis',
      pending: 'Tekshirilmoqda',
      sent: 'Yetkazildi',
      read: 'O‘qildi',
      notSent: 'Yuborilmadi',
      hide: 'Yopish',
      show: 'Ko‘rish',
    },
  },
  ru: {
    orderChat: {
      archived: 'Архив',
      archivedOnly: 'Эта переписка в архиве — писать нельзя',
      retry: 'Отправить снова',
      edit: 'Изменить',
      remove: 'Удалить',
      unknownWorker: 'Специалист',
      pending: 'Проверяется',
      sent: 'Доставлено',
      read: 'Прочитано',
      notSent: 'Не отправлено',
      hide: 'Свернуть',
      show: 'Показать',
    },
  },
  en: {
    orderChat: {
      archived: 'Archive',
      archivedOnly: 'This conversation is archived — no new messages',
      retry: 'Send again',
      edit: 'Edit',
      remove: 'Remove',
      unknownWorker: 'Specialist',
      pending: 'Being checked',
      sent: 'Delivered',
      read: 'Read',
      notSent: 'Not sent',
      hide: 'Hide',
      show: 'Show',
    },
  },
};
