// «Yetib keldim» va buyurtma pini (13.11): mijozning pin kartasi matnlari — backend dasturchisining ilova tarjimalaridan.
export const ARRIVAL_PIN_TEXTS = {
  uz: {
    arrivalPin: {
      locating: 'Joylashuv aniqlanmoqda…',
      locationOff: 'Joylashuvga ruxsat yo‘q — uni telefon sozlamalarida yoqing',
      doneCustomer: 'Usta {time} da yetib keldi',
      pinTitle: 'Usta sizni topishi uchun manzilni xaritada belgilang',
      pinSend: 'Joylashuvimni yuborish',
      pinPick: 'Xaritadan tanlash',
      pinSaved: 'Manzil nuqtasi yuborildi — usta uni xaritada ko‘radi',
      hereTitle: 'Hozir ish manzilidamisiz?',
      hereBody:
        'Hozirgi joylashuvingiz buyurtma manzili sifatida yuboriladi — usta shu nuqtaga keladi.',
      hereOk: 'Ha, yuborish',
      pinDone: 'Shu joy',
    },
  },
  ru: {
    arrivalPin: {
      locating: 'Определяем местоположение…',
      locationOff: 'Нет доступа к местоположению — включите его в настройках телефона',
      doneCustomer: 'Специалист прибыл в {time}',
      pinTitle: 'Отметьте адрес на карте, чтобы специалист вас нашёл',
      pinSend: 'Отправить моё местоположение',
      pinPick: 'Выбрать на карте',
      pinSaved: 'Точка отправлена — специалист увидит её на карте',
      hereTitle: 'Вы сейчас по адресу работы?',
      hereBody:
        'Ваше текущее местоположение будет отправлено как адрес заказа — специалист приедет в эту точку.',
      hereOk: 'Да, отправить',
      pinDone: 'Это место',
    },
  },
  en: {
    arrivalPin: {
      locating: 'Finding your location…',
      locationOff: 'No access to your location — turn it on in the phone’s settings',
      doneCustomer: 'The professional arrived at {time}',
      pinTitle: 'Mark the address on the map so the professional can find you',
      pinSend: 'Send my location',
      pinPick: 'Pick on the map',
      pinSaved: 'Location sent — the professional will see it on the map',
      hereTitle: 'Are you at the job address now?',
      hereBody:
        'Your current location is sent as the order’s address — the professional will come to this point.',
      hereOk: 'Yes, send it',
      pinDone: 'This spot',
    },
  },
};
