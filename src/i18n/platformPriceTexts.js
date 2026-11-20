// «O'zgarmas narx» (narxni platforma belgilaydi) matnlari — backend dasturchisining veb tarjimalaridan
// (`platformPrice`); {{var}} joy tutuvchilar bu ilovada {var}.
export const PLATFORM_PRICE_TEXTS = {
  uz: {
    platformPrice: {
      label: 'O‘zgarmas narx',
      note: 'Bu xizmatning narxini platforma belgilagan — narx kelishilmaydi, mutaxassis bilan faqat kun tanlanadi.',
      wholeJob: 'Narx butun ish uchun — odamlar soniga bog‘liq emas.',
      range: '{low} – {high}',
      byRegion: 'viloyatga qarab',
      pickRegion: 'Aniq narx manzil tanlangach ko‘rinadi',
      mixed:
        'O‘zgarmas narxli ishni boshqa ishlar bilan birga buyurtma qilib bo‘lmaydi — ularni alohida buyurtma qiling.',
      separate: 'Alohida buyurtma',
      offerNote:
        'Bu buyurtmaning narxini platforma belgilagan — narxni o‘zgartirib bo‘lmaydi, faqat kunni tanlaysiz.',
      dayOnly: 'Narx o‘zgarmas — faqat kunni taklif qiling.',
      proposeDay: 'Boshqa kun taklif qilish',
      changeDay: 'Kunni o‘zgartirish',
      doneBody:
        'Buyurtmangiz joylandi. Mutaxassislar o‘zgarmas narxda takliflarini yuboradi — siz mutaxassis va kunni tanlaysiz. Takliflar «Buyurtmalarim» bo‘limida paydo bo‘ladi.',
      cabinetTrade: 'Bu yo‘nalishda narxni platforma belgilaydi: {price}',
      listingNote:
        'Bu yo‘nalishda narxni platforma belgilaydi — e’londa o‘zgarmas narx ko‘rsatiladi.',
      offerDay: 'Taklif qilingan kun',
      repostHint:
        'Yangi buyurtma umumiy ro‘yxatga chiqadi — mos mutaxassislar taklif yuboradi. Tavsif, manzil va rasmlar o‘zgarmaydi; qachon kerakligini shu yerda o‘zgartirishingiz mumkin. Narx — xizmatning hozirgi o‘zgarmas narxi.',
      waitsDay: 'Mutaxassis kun taklif qilishi kutilmoqda — {when} gacha.',
      daySent: 'Kun taklifi yuborildi',
      customerDay: 'Mijoz taklif qilgan kun: {day}',
      customerDayWaits: 'Mijoz taklif qilgan kun: {day} · tanlov kutilmoqda',
      sameDay: 'Bu kun allaqachon taklif qilingan — boshqa kunni tanlang.',
      acceptFree:
        'Kelishuvni boshlash hozircha bepul — hamyoningizdan hech narsa yechilmaydi. Aniq manzil ochiladi; narx o‘zgarmas — chatda faqat kunni kelishasiz, kelishilgach telefon raqamlar ochiladi.',
      acceptConfirm:
        'Hamyoningizda {fee} muzlatiladi va aniq manzil ochiladi. Komissiya kun kelishilganda yechiladi; kelishuv bo‘lmasa, muzlatilgan summa qaytadi. Telefon raqamlar kelishilgach ochiladi.',
    },
  },
  ru: {
    platformPrice: {
      label: 'Цена платформы',
      note: 'Цену этой услуги устанавливает платформа — цену не обсуждают, со специалистом выбирают только день.',
      wholeJob: 'Цена за всю работу — не зависит от числа людей.',
      range: '{low} – {high}',
      byRegion: 'зависит от области',
      pickRegion: 'Точная цена появится после выбора адреса',
      mixed:
        'Работу с ценой платформы нельзя заказать вместе с другими — оформите их отдельными заказами.',
      separate: 'Отдельный заказ',
      offerNote:
        'Цену этого заказа установила платформа — её нельзя изменить, вы выбираете только день.',
      dayOnly: 'Цена неизменна — предложите только день.',
      proposeDay: 'Предложить другой день',
      changeDay: 'Изменить день',
      doneBody:
        'Заказ размещён. Специалисты пришлют предложения по цене платформы — вы выберете специалиста и день. Предложения появятся в разделе «Мои заказы».',
      cabinetTrade: 'В этом направлении цену устанавливает платформа: {price}',
      listingNote:
        'В этом направлении цену устанавливает платформа — в объявлении показывается цена платформы.',
      offerDay: 'Предложенный день',
      repostHint:
        'Новый заказ появится в общем списке — подходящие специалисты пришлют предложения. Описание, адрес и фото не меняются; срок можно изменить здесь. Цена — текущая цена платформы для этой услуги.',
      waitsDay: 'Ждём, когда специалист предложит день — до {when}.',
      daySent: 'Предложенный день отправлен',
      customerDay: 'День, предложенный заказчиком: {day}',
      customerDayWaits: 'День, предложенный заказчиком: {day} · ждём выбора',
      sameDay: 'Этот день уже предложен — выберите другой.',
      acceptFree:
        'Начать переговоры пока бесплатно — с кошелька ничего не спишется. Откроется точный адрес; цена платформы не меняется — в чате вы согласуете только день, после договорённости откроются телефоны.',
      acceptConfirm:
        'В кошельке зарезервируется {fee}, и откроется точный адрес. Комиссия спишется, когда вы договоритесь о дне; если договорённости не будет, сумма вернётся. Телефоны откроются после договорённости.',
    },
  },
  en: {
    platformPrice: {
      label: 'Platform price',
      note: "The platform sets the price of this service — it isn't negotiated; you only choose the day with the specialist.",
      wholeJob: "The price is for the whole job — it doesn't depend on the number of people.",
      range: '{low} – {high}',
      byRegion: 'depends on the region',
      pickRegion: 'The exact price shows once the address is chosen',
      mixed:
        "A job with a platform price can't be ordered with other jobs — place them as separate orders.",
      separate: 'Separate order',
      offerNote:
        "The platform set this order's price — it can't be changed; you only choose the day.",
      dayOnly: 'The price is fixed — propose only the day.',
      proposeDay: 'Propose another day',
      changeDay: 'Change the day',
      doneBody:
        'Your order is placed. Specialists will send offers at the platform price — you choose the specialist and the day. Offers will appear in «My orders».',
      cabinetTrade: 'The platform sets the price in this trade: {price}',
      listingNote:
        'The platform sets the price in this trade — the listing shows the platform price.',
      offerDay: 'Proposed day',
      repostHint:
        "A new order goes out to everyone — matching professionals will send offers. The description, address and photos stay; the timing can be changed here. The price is the service's current platform price.",
      waitsDay: 'Waiting for the professional to propose a day — until {when}.',
      daySent: 'Day proposal sent',
      customerDay: 'Day proposed by the customer: {day}',
      customerDayWaits: 'Day proposed by the customer: {day} · waiting for the choice',
      sameDay: 'This day is already proposed — pick another day.',
      acceptFree:
        'Starting the talk is free for now — nothing is taken from your wallet. The exact address opens; the platform price is fixed — you agree only the day in the chat, and the phone numbers open after that.',
      acceptConfirm:
        '{fee} is set aside in your wallet and the exact address opens. The fee is taken once you agree on the day; with no agreement, it comes back. The phone numbers open after the agreement.',
    },
  },
};
