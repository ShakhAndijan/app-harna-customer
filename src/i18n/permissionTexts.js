// Tizim ruxsat so'rovidan oldin sababni aytuvchi oyna matnlari. Bildirishnoma va joylashuv matnlari —
// backend dasturchisining ilova tarjimasidan (`permissions.*`, mijoz varianti); kamera matnlari o'zimizniki.
export const PERMISSION_TEXTS = {
  uz: {
    permissions: {
      continue: 'Davom etish',
      later: 'Keyinroq',
      notificationsTitle: 'Bildirishnomalar',
      notifications:
        'Takliflar, mutaxassisning xabarlari va buyurtmangiz holati haqida darhol bilib turishingiz uchun bildirishnomalarga ruxsat bering.',
      locationTitle: 'Joylashuv',
      locationNearby:
        'Sizga yaqin mutaxassislarni ko‘rsatish uchun joylashuvingiz kerak. U faqat shu qidiruvda ishlatiladi.',
      locationPin: 'Manzilni xaritada aniq belgilash uchun joylashuvingiz kerak.',
      locationAddress:
        'Xaritada qo‘yilgan nuqtadan ko‘cha va mahallani o‘zi to‘ldirish uchun telefon joylashuvga ruxsat so‘raydi.',
      cameraTitle: 'Kamera',
      cameraAvatar:
        'Profil rasmini suratga olish uchun kamera kerak. Rasm faqat siz tasdiqlaganingizdan keyin yuklanadi.',
      cameraCertificate:
        'Sertifikat hujjatini suratga olish uchun kamera kerak. Rasm faqat siz yuborganingizdan keyin yuklanadi.',
    },
  },
  ru: {
    permissions: {
      continue: 'Продолжить',
      later: 'Позже',
      notificationsTitle: 'Уведомления',
      notifications:
        'Разрешите уведомления, чтобы сразу узнавать о предложениях, сообщениях специалиста и статусе заказа.',
      locationTitle: 'Местоположение',
      locationNearby:
        'Ваше местоположение нужно, чтобы показать специалистов рядом. Оно используется только для этого поиска.',
      locationPin: 'Ваше местоположение нужно, чтобы точно отметить адрес на карте.',
      locationAddress:
        'Чтобы улица и махалля заполнились по точке на карте, телефон спросит доступ к местоположению.',
      cameraTitle: 'Камера',
      cameraAvatar:
        'Камера нужна, чтобы сфотографировать фото профиля. Снимок загрузится только после вашего подтверждения.',
      cameraCertificate:
        'Камера нужна, чтобы сфотографировать документ сертификата. Снимок загрузится только после того, как вы его отправите.',
    },
  },
  en: {
    permissions: {
      continue: 'Continue',
      later: 'Later',
      notificationsTitle: 'Notifications',
      notifications:
        'Allow notifications to hear at once about offers, messages from the professional and your order’s progress.',
      locationTitle: 'Location',
      locationNearby:
        'Your location is needed to show the professionals near you. It is used only for this search.',
      locationPin: 'Your location is needed to mark the address precisely on the map.',
      locationAddress:
        'To fill in the street and mahalla from the point on the map, the phone will ask for location access.',
      cameraTitle: 'Camera',
      cameraAvatar:
        'The camera is needed to take your profile photo. It is uploaded only after you confirm it.',
      cameraCertificate:
        'The camera is needed to photograph your certificate document. It is uploaded only after you send it.',
    },
  },
};
