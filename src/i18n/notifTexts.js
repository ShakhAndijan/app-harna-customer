// Sayt/backend dasturchisining tarjimalaridan: bildirishnoma turlari (notifications.type), telefon so'rovi
// (phoneGate) va bloklangan hisob banneri (block). {var} joy tutuvchilar.
export const NOTIF_TEXTS = {
  uz: {
    notifTypesWeb: {
      customer: {
        order: {
          accepted: 'Buyurtmangizni mutaxassis qabul qildi',
          cancelled: 'Buyurtmangiz bekor qilindi',
          completed: 'Buyurtmangiz yakunlandi — mutaxassisni baholang',
          returned:
            'Mutaxassis buyurtmangizni rad etdi — boshqasiga yuboring yoki umumiy ro‘yxatga chiqaring',
          returned_lapsed_by_worker:
            'Mutaxassis belgilangan vaqtda javob bermadi — buyurtma sizga qaytdi',
          returned_lapsed_by_customer:
            'Mutaxassis taklifiga belgilangan vaqtda javob bermadingiz — buyurtma sizga qaytdi',
          completed_auto:
            'Belgilangan vaqtda tasdiqlamadingiz — buyurtma o‘z-o‘zidan yakunlandi, mutaxassisni baholang',
          reminder_answer: 'Mutaxassis taklifiga javob berish vaqti tugayapti',
          reminder_work_check:
            'Kelishilgan ish kuni o‘tdi — ish bajarilgan bo‘lsa, buyurtmani yakunlang',
          complaint_no_contact:
            'Usta siz bilan bog‘lana olmagani uchun buyurtma bekor qilindi — kerak bo‘lsa, uni qayta e’lon qiling',
          complaint_no_work:
            'Usta kelganida ish qildirilmagani uchun buyurtma bekor qilindi — kerak bo‘lsa, uni qayta e’lon qiling',
          extra_decided_lapsed: 'Qo‘shimcha ish taklifiga javob bermadingiz — taklif bekor bo‘ldi',
          worker_no_show: 'Usta kelmagani tasdiqlandi — buyurtma bekor qilindi',
        },
        complaint: {
          removed: 'Shikoyatingiz profildan olib tashlandi — sababini «Shikoyatlarim»da ko‘ring',
        },
        match: {
          complaint_rejected: 'Operator ustaning shikoyatini rad etdi — buyurtma davom etadi',
          no_show_rejected: 'Operator usta kelgan deb topdi — buyurtma davom etadi',
        },
      },
      fallback: 'Yangi xabar',
      listing: {
        commented: 'E‘loningizga yangi izoh yozildi',
        replied: 'E‘lon egasi izohingizga javob berdi',
      },
      order: {
        accepted: 'Buyurtmangiz qabul qilindi',
        agreed: 'Shartlar kelishildi — ish boshlanadi',
        cancelled: 'Buyurtma bekor qilindi',
        completed: 'Buyurtma yakunlandi',
        message: 'Buyurtma bo‘yicha yangi xabar',
        negotiation_ended: 'Kelishuv bo‘lmadi — buyurtma qayta ochildi',
        new: 'Sizga mos yangi buyurtma',
        newSuggested: 'Yangi buyurtma — sizga mos kelishi mumkin',
        offer: 'Buyurtma bo‘yicha yangi taklif keldi',
        new_offer: 'Buyurtmangizga yangi taklif keldi',
        work_done: 'Mutaxassis ish bajarilganini bildirdi — tasdiqlang',
        returned: 'Buyurtma qaytarildi',
        returned_fee: 'Buyurtma qaytarildi — muzlatilgan summa qaytarildi',
        returned_recalled: 'Mijoz buyurtmani qaytarib oldi',
        returned_lapsed_by_worker: 'Belgilangan vaqtda javob berilmadi — buyurtma qaytarildi',
        returned_lapsed_by_worker_fee:
          'Belgilangan vaqtda javob berilmadi — buyurtma qaytarildi, muzlatilgan summa qaytarildi',
        returned_lapsed_by_customer: 'Belgilangan vaqtda javob berilmadi — buyurtma qaytarildi',
        returned_lapsed_by_customer_fee:
          'Belgilangan vaqtda javob berilmadi — buyurtma qaytarildi, muzlatilgan summa qaytarildi',
        completed_auto: 'Buyurtma o‘z-o‘zidan yakunlandi',
        auto_closed_no_choice: 'Belgilangan vaqtda taklif tanlanmadi — buyurtma yopildi',
        auto_closed_date_passed:
          'Buyurtma sanasi o‘tib ketdi — buyurtma yopildi, uni qayta e’lon qilishingiz mumkin',
        auto_closed_stale:
          'Buyurtmangizga uzoq vaqt taklif kelmadi — buyurtma yopildi, uni qayta e’lon qilishingiz mumkin',
        reminder_new_order: 'Sizga yuborilgan buyurtmaga javob berish vaqti tugayapti',
        reminder_answer: 'Javob berish vaqti tugayapti',
        reminder_choose:
          'Takliflardan birini tanlash vaqti tugayapti — aks holda buyurtma yopiladi',
        reminder_complete:
          'Mutaxassis ish bajarilganini bildirgan — tasdiqlang yoki «Ish hali bajarilmadi» deng, vaqt tugayapti',
        negotiation_ended_fee: 'Kelishuv bo‘lmadi — muzlatilgan summa qaytarildi',
        work_not_done:
          'Mijoz ish hali bajarilmaganini bildirdi — ishni tugatib, «Ish bajarildi»ni qayta bosing',
        reminder_work_check: 'Kelishilgan ish kuni o‘tdi — ish bajarildimi?',
        auto_closed_returned:
          'Sizga qaytgan buyurtma uzoq vaqt hech kimga yuborilmadi — buyurtma yopildi, uni qayta e’lon qilishingiz mumkin',
        cancelled_fee: 'Buyurtma bekor qilindi — muzlatilgan summa qaytarildi',
        repeat_reminder: '{category} xizmatiga yana vaqt keldi — o‘sha ustani qayta chaqiring',
        stage_done: 'Usta «{stage}» bosqichini bajardi — tasdiqlang',
        stage_confirmed: 'Mijoz «{stage}» bosqichini tasdiqladi',
        message_many: 'Buyurtma bo‘yicha {count} ta yangi xabar',
        digest: 'Siz yo‘qligingizda {count} ta yangi buyurtma keldi — hali ochiq',
        digest_one: 'Siz yo‘qligingizda yangi buyurtma keldi — hali ochiq',
        complaint_no_contact: 'Usta mijoz bilan bog‘lana olmadi — buyurtma bekor qilindi',
        complaint_no_contact_fee:
          'Usta mijoz bilan bog‘lana olmadi — buyurtma bekor qilindi, haq qaytarildi',
        arrived: 'Usta {time} da yetib keldi',
        arrived_plain: 'Usta manzilga yetib keldi',
        location: 'Mijoz manzil nuqtasini belgiladi',
        location_request: 'Usta sizni topishi uchun manzilni belgilashingizni so‘radi',
        complaint_no_work: 'Usta kelganida ish qildirilmadi — buyurtma bekor qilindi',
        complaint_no_work_fee:
          'Usta kelganida ish qildirilmadi — buyurtma bekor qilindi, haq qaytarildi',
        extra: 'Usta qo‘shimcha ish taklif qildi: {description} — {price} so‘m',
        extra_decided: 'Qo‘shimcha ish taklifi bo‘yicha javob',
        extra_decided_approved: 'Mijoz qo‘shimcha ishga rozi bo‘ldi: {description} — {price} so‘m',
        extra_decided_declined: 'Mijoz qo‘shimcha ishni rad etdi',
        extra_decided_lapsed: 'Qo‘shimcha ish taklifiga javob bo‘lmadi',
        reminder_job_day: 'Bugun — kelishilgan ish kuni',
        reminder_job_day_window: 'Bugun {window} da — kelishilgan ish vaqti',
        new_realert: 'Sizga mos buyurtma shoshilinch bo‘lib qoldi',
        reminder_arrival_check: 'Usta keldimi? Kelishilgan vaqt {window} edi — javob bering',
        reminder_arrival_check_plain: 'Usta keldimi? Kelishilgan vaqt o‘tdi — javob bering',
        worker_no_show: 'Usta kelmagani tasdiqlandi — buyurtma bekor qilindi',
        worker_no_show_fee: 'Usta kelmagani tasdiqlandi — buyurtma bekor qilindi',
        deposit_pending:
          'Buyurtmangiz omonat to‘langach e’lon qilinadi — {amount} so‘m, {due_at} gacha',
        deposit_pending_plain: 'Buyurtmangiz omonat to‘langach e’lon qilinadi',
        deposit_held: 'Omonat qabul qilindi — buyurtmangiz e’lon qilindi',
        deposit_refund_due: 'Omonat qaytariladi: {amount} so‘m',
        deposit_refund_due_plain: 'Omonat qaytariladi',
        deposit_refunded: 'Omonat qaytarildi: {amount} so‘m',
        deposit_refunded_plain: 'Omonat qaytarildi',
        deposit_forfeited: 'Omonat ustaga o‘tkazildi',
        deposit_forfeited_no_contact:
          'Omonat ustaga o‘tkazildi: usta siz bilan bog‘lana olmagani tasdiqlandi',
        deposit_forfeited_no_work:
          'Omonat ustaga o‘tkazildi: usta kelganda ish qildirilmagani tasdiqlandi',
        deposit_forfeited_customer_fault:
          'Omonat ustaga o‘tkazildi: bekor qilish sizning aybingiz bilan deb topildi',
        deposit_waived: 'Omonat talab qilinmaydigan bo‘ldi — buyurtmangiz e’lon qilindi',
        deposit_unpaid: 'Omonat to‘lanmadi — buyurtma bekor qilindi',
      },
      review: {
        received: 'Sizga yangi sharh qoldirildi',
      },
      sitemap: {
        group: {
          account: 'Hisob',
          cabinet: 'Shaxsiy kabinet',
          help: "Yordam va ma'lumot",
          legal: 'Hujjatlar',
          main: 'Asosiy',
        },
        page: {
          about: 'Biz haqimizda',
          becomeWorker: "Mutaxassis bo'lish",
          categories: 'Kategoriyalar',
          faq: "Ko'p so'raladigan savollar",
          favorites: 'Sevimlilar',
          home: 'Bosh sahifa',
          login: 'Kirish',
          orders: 'Buyurtmalar',
          privacy: 'Maxfiylik siyosati',
          profile: 'Profil',
          register: "Ro'yxatdan o'tish",
          suggestion: 'Taklif yuborish',
          support: "Mutaxassis bilan bog'lanish",
          terms: 'Foydalanish shartlari',
          wallet: 'Hamyon',
          workers: 'Mutaxassislar',
        },
        subtitle: "Saytning barcha bo'limlari bir ro'yxatda.",
        title: 'Sayt xaritasi',
      },
      support: {
        answered: 'Murojaatingizga javob berildi',
      },
      worker: {
        order: {
          accepted: 'Siz buyurtmani qabul qildingiz',
          cancelled: 'Buyurtma bekor qilindi',
          completed: 'Buyurtma yakunlandi — mijozni baholang',
          returned: 'Mijoz kelishuvni to‘xtatdi — buyurtma «Rad etilganlar»ga o‘tdi',
          returned_fee:
            'Mijoz kelishuvni to‘xtatdi — buyurtma «Rad etilganlar»ga o‘tdi, muzlatilgan summa qaytarildi',
          returned_lapsed_by_worker:
            'Buyurtmaga belgilangan vaqtda javob bermadingiz — u mijozga qaytdi',
          returned_lapsed_by_worker_fee:
            'Buyurtmaga belgilangan vaqtda javob bermadingiz — u mijozga qaytdi, muzlatilgan summa qaytarildi',
          returned_lapsed_by_customer:
            'Mijoz taklifingizga belgilangan vaqtda javob bermadi — buyurtma endi sizda emas',
          returned_lapsed_by_customer_fee:
            'Mijoz taklifingizga belgilangan vaqtda javob bermadi — buyurtma endi sizda emas, muzlatilgan summa qaytarildi',
          completed_auto: 'Mijoz belgilangan vaqtda tasdiqlamadi — buyurtma o‘z-o‘zidan yakunlandi',
          reminder_answer: 'Mijoz javobingizni kutmoqda — vaqt oz qoldi',
          negotiation_ended: 'Mijoz kelishuvni to‘xtatdi — buyurtma endi sizda emas',
          negotiation_ended_fee:
            'Mijoz kelishuvni to‘xtatdi — buyurtma endi sizda emas, muzlatilgan summa qaytarildi',
          reminder_work_check:
            'Kelishilgan ish kuni o‘tdi — ish bajarilgan bo‘lsa, «Ish bajarildi»ni bosing',
          cancelled_fee: 'Mijoz buyurtmani bekor qildi — muzlatilgan summa qaytarildi',
          complaint_no_contact:
            '«Bog‘lana olmadim» shikoyatingiz tasdiqlandi — buyurtma bekor qilindi, sizga jarima yo‘q',
          complaint_no_contact_fee:
            '«Bog‘lana olmadim» shikoyatingiz tasdiqlandi — buyurtma bekor qilindi, sizga jarima yo‘q, haq hamyoningizga qaytarildi',
          complaint_no_work:
            '«Mijoz ish qildirmadi» shikoyatingiz tasdiqlandi — buyurtma bekor qilindi, sizga jarima yo‘q',
          complaint_no_work_fee:
            '«Mijoz ish qildirmadi» shikoyatingiz tasdiqlandi — buyurtma bekor qilindi, sizga jarima yo‘q, haq hamyoningizga qaytarildi',
          worker_no_show: 'Kelmaganingiz tasdiqlandi — buyurtma bekor qilindi',
          worker_no_show_fee:
            'Kelmaganingiz tasdiqlandi — buyurtma bekor qilindi. Olingan haq qaytarilmaydi',
        },
        complaint: {
          removed: 'Ustingizdan yozilgan shikoyat profilingizdan olib tashlandi',
        },
        match: {
          complaint_disputed:
            'Mijoz shikoyatingizni rad etdi — operator ko‘rib chiqib qaror qiladi, buyurtma hozircha davom etadi',
          complaint_rejected: 'Operator shikoyatingizni rad etdi — buyurtma davom etadi',
          complaint_rejected_fee:
            'Operator shikoyatingizni rad etdi — buyurtma davom etadi, haq qaytarilmaydi',
          no_show_rejected: 'Operator siz kelgan deb topdi — ish davom etadi',
        },
        guarantee: {
          checked_silence: 'Mijoz javob bermadi — tuzatildi deb hisoblandi',
          disputed_worker_silent: 'Javob bermadingiz — murojaat operatorga o‘tdi',
          disputed_fix_overdue: 'Muddatida tuzatmadingiz — murojaat operatorga o‘tdi',
          decided_customer:
            'Operator mijoz foydasiga hal qildi — {refund_amount} so‘m hamyoningizdan qaytarildi',
          decided_customer_plain:
            'Operator mijoz foydasiga hal qildi — pul hamyoningizdan qaytarildi',
          decided_worker: 'Operator siz tomonda hal qildi',
        },
      },
      offer: {
        chosen: 'Mijoz sizni tanladi — kelishuvni tasdiqlang yoki rad eting',
        not_chosen: 'Mijoz boshqa mutaxassisni tanladi — muzlatilgan summa qaytarildi',
        expired: 'Taklifingiz yopildi — muzlatilgan summa qaytarildi',
        not_chosen_free: 'Mijoz boshqa mutaxassisni tanladi',
        declined: 'Siz tanlagan mutaxassis rad etdi — boshqa taklifni tanlashingiz mumkin',
        declined_none:
          'Siz tanlagan mutaxassis rad etdi — buyurtma yana ochiq, yangi takliflarni kuting',
        unanswered:
          'Tanlovga belgilangan vaqtda javob bermadingiz — tanlov bekor bo‘ldi, muzlatilgan summa qaytarildi',
        unanswered_free: 'Tanlovga belgilangan vaqtda javob bermadingiz — tanlov bekor bo‘ldi',
        declined_unanswered:
          'Siz tanlagan mutaxassis belgilangan vaqtda javob bermadi — boshqa taklifni tanlashingiz mumkin',
        declined_unanswered_none:
          'Siz tanlagan mutaxassis belgilangan vaqtda javob bermadi — buyurtma yana ochiq, yangi takliflarni kuting',
        customer_unanswered:
          'Mijoz taklifingizga belgilangan vaqtda javob bermadi — tanlov bekor bo‘ldi, muzlatilgan summa qaytarildi',
        customer_unanswered_free:
          'Mijoz taklifingizga belgilangan vaqtda javob bermadi — tanlov bekor bo‘ldi',
        lapsed:
          'Mutaxassis taklifiga belgilangan vaqtda javob bermadingiz — tanlov bekor bo‘ldi, boshqa taklifni tanlashingiz mumkin',
        lapsed_none:
          'Mutaxassis taklifiga belgilangan vaqtda javob bermadingiz — tanlov bekor bo‘ldi, buyurtma yana ochiq, yangi takliflarni kuting',
        rejected: 'Mijoz taklifingizni rad etdi — muzlatilgan summa qaytarildi',
        rejected_free: 'Mijoz taklifingizni rad etdi',
        expired_too_old:
          'Taklifingizga uzoq vaqt javob bo‘lmadi — taklif yopildi, muzlatilgan summa qaytarildi',
        expired_date_passed:
          'Buyurtma sanasi o‘tib ketdi — taklifingiz yopildi, muzlatilgan summa qaytarildi',
        expired_customer_blocked:
          'Mijoz hozircha buyurtmalar bilan ishlay olmaydi — taklifingiz yopildi, muzlatilgan summa qaytarildi',
        expired_worker_blocked:
          'Hisobingiz cheklangani uchun taklifingiz yopildi — muzlatilgan summa qaytarildi',
        expired_worker_phone_unverified:
          'Telefon raqamingiz tasdiqlanmagani uchun taklifingiz yopildi — muzlatilgan summa qaytarildi',
      },
      match: {
        complaint:
          'Usta siz bilan bog‘lana olmaganini bildirdi — javob bering, aks holda buyurtma bekor qilinadi',
        complaint_resolved: 'Shikoyatingiz ko‘rib chiqildi',
        complaint_disputed:
          'Mijoz shikoyatingizni rad etdi — operator ko‘rib chiqib qaror qiladi, buyurtma hozircha davom etadi',
        complaint_rejected: 'Operator shikoyatni rad etdi — buyurtma davom etadi',
        complaint_rejected_fee:
          'Operator shikoyatni rad etdi — buyurtma davom etadi, haq qaytarilmaydi',
        complaint_no_work:
          'Usta yetib kelganini va ish qildirilmaganini bildirdi — javob bering, aks holda buyurtma bekor qilinadi',
        no_show: 'Mijoz siz kelmadingiz deb bildirdi — {hours} soat ichida javob bering',
        no_show_plain: 'Mijoz siz kelmadingiz deb bildirdi — belgilangan vaqtda javob bering',
        no_show_disputed: 'Usta kelganini aytdi — operator ko‘rib chiqadi',
        no_show_disputed_arrival: 'Usta «Yetib keldim» deb belgiladi — operator ko‘rib chiqadi',
        no_show_rejected: 'Operator usta kelgan deb topdi — buyurtma davom etadi',
      },
      complaint: {
        approved: 'Shikoyatingiz tasdiqlandi — u mutaxassis profilida ismingizsiz chiqdi',
        rejected: 'Shikoyatingiz rad etildi — sababini «Shikoyatlarim»da ko‘ring',
        replied: 'Mutaxassis shikoyatingizga javob yozdi',
        published:
          'Ustingizdan yozilgan shikoyat tasdiqlandi — unga bitta javob yozishingiz mumkin',
        withdrawn: 'Mijoz ustingizdan yozgan shikoyatini qaytarib oldi',
        removed: 'Shikoyat profildan olib tashlandi',
      },
      bonus: {
        welcome: 'Sizga {amount} xush kelibsiz bonusi berildi',
        referral_joined: 'Taklif orqali qo‘shilganingiz uchun {amount} bonus',
        referral_reward: '{friend} birinchi ishini bajardi — sizga {amount} bonus',
      },
      contest: {
        won: 'Tabriklaymiz! Siz {month} oyida {district}ning eng yaxshi ustasi bo‘ldingiz',
        revoked:
          '{month} oyidagi «{district}ning eng yaxshi ustasi» unvoni olib qo‘yildi: {reason}',
      },
      business: {
        approved: '«{name}» korporativ hisobi tasdiqlandi',
        rejected: '«{name}» arizasi bo‘yicha javob: {note}',
        plan_order: 'Rejali xizmat: {site} — {category}, {date} uchun buyurtma joylandi',
        plan_failed: 'Rejali xizmat uchun buyurtma joylab bo‘lmadi: {site} — {category}',
        statement_ready: '{month} oyi hisoboti tayyor: {jobs} ta ish, jami {total}',
        member_added: 'Sizni «{name}» kompaniyasiga xodim sifatida qo‘shishdi',
      },
      promotion: {
        ended_listing: '«{title}» e’loningizning TOP muddati tugadi',
        ended_profile: 'Profilingizning TOP muddati tugadi',
      },
      pro: {
        renewed: 'Pro obunangiz {date} gacha uzaytirildi',
        renew_failed: 'Pro obunasini uzaytirib bo‘lmadi — hamyonda {price} yo‘q',
        expired: 'Pro obunangiz muddati tugadi',
      },
      brigade: {
        invited: 'Sizni «{brigade}» brigadasiga taklif qilishdi',
        joined: '{worker} «{brigade}» brigadangizga qo‘shildi',
      },
      verification: {
        manual_closed:
          'Shaxsni hujjat rasmi orqali tasdiqlash to‘xtatildi: arizangiz yopildi. Endi shaxs faqat MyID orqali tasdiqlanadi.',
        expiring:
          'Shaxsingiz tasdig‘i {date} kuni tugaydi — saytda yoki ilovaning yangi versiyasida MyID orqali qayta tasdiqlang',
        expired:
          'Shaxsingiz tasdig‘ining muddati tugadi — saytda yoki ilovaning yangi versiyasida MyID orqali qayta tasdiqlang',
        myid_required:
          'Operator bergan tasdiq bekor qilindi — saytda yoki ilovaning yangi versiyasida MyID orqali qayta tasdiqlang',
        revoked:
          'Shaxsingiz tasdig‘i bekor qilindi. Savolingiz bo‘lsa, qo‘llab-quvvatlash xizmatiga yozing',
      },
      wallet: {
        topup: 'Hamyon to‘ldirildi: {amount}',
        order_paid: 'Mijoz to‘ladi: hamyoningizga {amount} tushdi',
        topup_reversed: 'Hamyonni to‘ldirish bekor qilindi: {amount} yechildi',
        order_refunded: 'To‘lov mijozga qaytarildi: hamyoningizdan {amount} yechildi',
        withdrawal_approved: 'Pul yechish bajarildi: {amount}',
        withdrawal_rejected: 'Pul yechish rad etildi, {amount} hamyonga qaytdi',
        deposit_forfeit: 'Mijoz omonati hamyoningizga o‘tkazildi: {amount} so‘m',
        deposit_forfeit_plain: 'Mijoz omonati hamyoningizga o‘tkazildi',
      },
      guarantee: {
        claim: 'Mijoz kafolat bo‘yicha murojaat qildi — {hours} soat ichida javob bering',
        claim_plain: 'Mijoz kafolat bo‘yicha murojaat qildi — belgilangan vaqtda javob bering',
        filed: 'Murojaatingiz qabul qilindi — usta {hours} soat ichida javob beradi',
        filed_plain: 'Murojaatingiz qabul qilindi — usta belgilangan vaqtda javob beradi',
        fixing: 'Usta tuzatib berishga rozi bo‘ldi — {days} kun ichida',
        fixing_plain: 'Usta tuzatib berishga rozi bo‘ldi',
        fix_reported: 'Usta tuzatganini aytdi — {hours} soat ichida tekshirib, javob bering',
        fix_reported_plain: 'Usta tuzatganini aytdi — belgilangan vaqtda tekshirib, javob bering',
        checked: 'Mijoz tuzatilgan ishni tekshirdi',
        checked_fixed: 'Mijoz tuzatilganini tasdiqladi',
        checked_not_fixed: 'Mijoz tuzatilmaganini aytdi — operator hal qiladi',
        checked_silence: 'Javob bermaganingiz uchun tuzatildi deb hisoblandi',
        disputed: 'Kafolat murojaati operatorga o‘tdi — u hal qiladi',
        disputed_worker_refused: 'Usta tuzatishni rad etdi — operator hal qiladi',
        disputed_worker_silent: 'Usta javob bermadi — operator hal qiladi',
        disputed_fix_overdue: 'Usta muddatida tuzatmadi — operator hal qiladi',
        decided: 'Operator kafolat murojaati bo‘yicha qaror qildi',
        decided_customer:
          'Operator sizning foydangizga hal qildi — {refund_amount} so‘m qaytariladi',
        decided_customer_plain: 'Operator sizning foydangizga hal qildi — pul qaytariladi',
        decided_worker: 'Operator murojaatni rad etdi',
      },
      adminTitle: '{brand} jamoasidan xabar',
    },
    phoneGate: {
      body: 'Telefon raqamingiz tasdiqlanmagan. Mijozlar sizni topa olmaydi va buyurtma bera olmaydi — raqamni tasdiqlashingiz bilan profil ro‘yxatga qaytadi.',
      later: 'Keyinroq',
      promptCustomer:
        'Raqam mutaxassislar siz bilan bog‘lanishi uchun kerak. Bundan tashqari, u hisobingizga qaytishning yagona ishonchli yo‘li.',
      promptTitle: 'Telefon raqamingizni tasdiqlang',
      promptWorker:
        'Raqamsiz profilingiz qidiruvda ko‘rinmaydi va mijozlar sizga buyurtma bera olmaydi. Tasdiqlash bir daqiqa oladi.',
      title: 'Profilingiz qidiruvda ko‘rinmayapti',
      viaSms: 'SMS orqali',
      viaTelegram: 'Telegram orqali tasdiqlash',
    },
    block: {
      body: 'Bu muddat davomida yangi buyurtma yaratish va qabul qilish mumkin emas. Qaror noto‘g‘ri deb hisoblasangiz, qo‘llab-quvvatlash xizmatiga murojaat qiling.',
      title: 'Hisobingiz vaqtincha cheklangan — {until} gacha',
    },
  },
  ru: {
    notifTypesWeb: {
      customer: {
        order: {
          accepted: 'Специалист принял ваш заказ',
          cancelled: 'Ваш заказ отменён',
          completed: 'Ваш заказ завершён — оцените специалиста',
          returned:
            'Специалист отклонил ваш заказ — отправьте его другому или опубликуйте для всех',
          returned_lapsed_by_worker: 'Специалист не ответил вовремя — заказ вернулся к вам',
          returned_lapsed_by_customer:
            'Вы не ответили вовремя на предложение специалиста — заказ вернулся к вам',
          completed_auto:
            'Вы не подтвердили вовремя — заказ завершён автоматически, оцените специалиста',
          reminder_answer: 'Время ответить на предложение специалиста истекает',
          reminder_work_check:
            'Согласованный день работы прошёл — если работа выполнена, завершите заказ',
          complaint_no_contact:
            'Заказ отменён: специалист не смог с вами связаться. При необходимости разместите его снова',
          complaint_no_work:
            'Заказ отменён: специалисту не дали выполнить работу. При необходимости разместите его снова',
          extra_decided_lapsed:
            'Вы не ответили на предложение дополнительной работы — оно отменено',
          worker_no_show: 'Неявка специалиста подтверждена — заказ отменён',
        },
        complaint: {
          removed: 'Ваша жалоба убрана из профиля — причина в разделе «Мои жалобы»',
        },
        match: {
          complaint_rejected: 'Оператор отклонил жалобу специалиста — заказ продолжается',
          no_show_rejected: 'Оператор решил, что специалист приходил, — заказ продолжается',
        },
      },
      fallback: 'Новое уведомление',
      listing: {
        commented: 'Новый комментарий к вашему объявлению',
        replied: 'Автор объявления ответил на ваш комментарий',
      },
      order: {
        accepted: 'Ваш заказ принят',
        agreed: 'Условия согласованы — работа начинается',
        cancelled: 'Заказ отменён',
        completed: 'Заказ завершён',
        message: 'Новое сообщение по заказу',
        negotiation_ended: 'Не договорились — заказ снова открыт',
        new: 'Новый подходящий заказ',
        newSuggested: 'Новый заказ — возможно, для вас',
        offer: 'По заказу новое предложение',
        new_offer: 'На ваш заказ пришло новое предложение',
        work_done: 'Специалист сообщил, что работа выполнена — подтвердите',
        returned: 'Заказ возвращён',
        returned_fee: 'Заказ возвращён — резерв возвращён',
        returned_recalled: 'Заказчик забрал заказ',
        returned_lapsed_by_worker: 'Ответа не было вовремя — заказ возвращён',
        returned_lapsed_by_worker_fee: 'Ответа не было вовремя — заказ возвращён, резерв возвращён',
        returned_lapsed_by_customer: 'Ответа не было вовремя — заказ возвращён',
        returned_lapsed_by_customer_fee:
          'Ответа не было вовремя — заказ возвращён, резерв возвращён',
        completed_auto: 'Заказ завершён автоматически',
        auto_closed_no_choice: 'Предложение не выбрано вовремя — заказ закрыт',
        auto_closed_date_passed: 'Дата заказа прошла — заказ закрыт, его можно опубликовать снова',
        auto_closed_stale:
          'На заказ долго не было предложений — он закрыт, его можно опубликовать снова',
        reminder_new_order: 'Время ответить на отправленный вам заказ истекает',
        reminder_answer: 'Время на ответ истекает',
        reminder_choose: 'Время выбрать одно из предложений истекает — иначе заказ закроется',
        reminder_complete:
          'Специалист отметил работу выполненной — подтвердите или нажмите «Работа ещё не выполнена», время истекает',
        negotiation_ended_fee: 'Не договорились — резерв возвращён',
        work_not_done:
          'Заказчик сообщил, что работа ещё не выполнена — закончите её и снова нажмите «Работа выполнена»',
        reminder_work_check: 'Согласованный день работы прошёл — работа выполнена?',
        auto_closed_returned:
          'Вернувшийся к вам заказ долго никому не отправлялся — он закрыт, его можно опубликовать снова',
        cancelled_fee: 'Заказ отменён — замороженная сумма возвращена',
        repeat_reminder: 'Пора снова: {category} — вызовите того же мастера',
        stage_done: 'Мастер выполнил этап «{stage}» — подтвердите',
        stage_confirmed: 'Клиент подтвердил этап «{stage}»',
        message_many: 'Новых сообщений по заказу: {count}',
        digest: 'Пока вас не было, пришло новых заказов: {count} — они ещё открыты',
        digest_one: 'Пока вас не было, пришёл новый заказ — он ещё открыт',
        complaint_no_contact: 'Специалист не смог связаться с заказчиком — заказ отменён',
        complaint_no_contact_fee:
          'Специалист не смог связаться с заказчиком — заказ отменён, комиссия возвращена',
        arrived: 'Специалист прибыл в {time}',
        arrived_plain: 'Специалист прибыл на место',
        location: 'Заказчик отметил адрес на карте',
        location_request: 'Специалист просит отметить адрес на карте, чтобы найти вас',
        complaint_no_work: 'Специалисту не дали работать — заказ отменён',
        complaint_no_work_fee: 'Специалисту не дали работать — заказ отменён, комиссия возвращена',
        extra: 'Мастер предложил дополнительную работу: {description} — {price} сум',
        extra_decided: 'Ответ по дополнительной работе',
        extra_decided_approved:
          'Клиент согласился на дополнительную работу: {description} — {price} сум',
        extra_decided_declined: 'Клиент отказался от дополнительной работы',
        extra_decided_lapsed: 'На предложение дополнительной работы не ответили',
        reminder_job_day: 'Сегодня — согласованный день работы',
        reminder_job_day_window: 'Сегодня, {window} — согласованное время работы',
        new_realert: 'Подходящий вам заказ стал срочным',
        reminder_arrival_check: 'Специалист пришёл? Согласованное время было {window} — ответьте',
        reminder_arrival_check_plain: 'Специалист пришёл? Согласованное время прошло — ответьте',
        worker_no_show: 'Неявка специалиста подтверждена — заказ отменён',
        worker_no_show_fee: 'Неявка специалиста подтверждена — заказ отменён',
        deposit_pending: 'Заказ опубликуют после оплаты залога — {amount} сум, до {due_at}',
        deposit_pending_plain: 'Заказ опубликуют после оплаты залога',
        deposit_held: 'Залог получен — заказ опубликован',
        deposit_refund_due: 'Залог вернут: {amount} сум',
        deposit_refund_due_plain: 'Залог вернут',
        deposit_refunded: 'Залог возвращён: {amount} сум',
        deposit_refunded_plain: 'Залог возвращён',
        deposit_forfeited: 'Залог передан специалисту',
        deposit_forfeited_no_contact:
          'Залог передан специалисту: подтверждено, что он не смог с вами связаться',
        deposit_forfeited_no_work:
          'Залог передан специалисту: подтверждено, что ему не дали выполнить работу, когда он пришёл',
        deposit_forfeited_customer_fault: 'Залог передан специалисту: отмена признана вашей виной',
        deposit_waived: 'Залог больше не требуется — заказ опубликован',
        deposit_unpaid: 'Залог не оплачен — заказ отменён',
      },
      review: {
        received: 'Вам оставили новый отзыв',
      },
      sitemap: {
        group: {
          account: 'Аккаунт',
          cabinet: 'Личный кабинет',
          help: 'Помощь и информация',
          legal: 'Документы',
          main: 'Основное',
        },
        page: {
          about: 'О нас',
          becomeWorker: 'Стать специалистом',
          categories: 'Категории',
          faq: 'Часто задаваемые вопросы',
          favorites: 'Избранное',
          home: 'Главная',
          login: 'Вход',
          orders: 'Заказы',
          privacy: 'Политика конфиденциальности',
          profile: 'Профиль',
          register: 'Регистрация',
          suggestion: 'Отправить предложение',
          support: 'Связаться со специалистом',
          terms: 'Условия использования',
          wallet: 'Кошелёк',
          workers: 'Специалисты',
        },
        subtitle: 'Все разделы сайта в одном списке.',
        title: 'Карта сайта',
      },
      support: {
        answered: 'На ваше обращение ответили',
      },
      worker: {
        order: {
          accepted: 'Вы приняли заказ',
          cancelled: 'Заказ отменён',
          completed: 'Заказ завершён — оцените заказчика',
          returned: 'Заказчик прекратил переговоры — заказ перемещён в «Отклонённые»',
          returned_fee:
            'Заказчик прекратил переговоры — заказ перемещён в «Отклонённые», резерв возвращён',
          returned_lapsed_by_worker: 'Вы не ответили на заказ вовремя — он вернулся к заказчику',
          returned_lapsed_by_worker_fee:
            'Вы не ответили на заказ вовремя — он вернулся к заказчику, резерв возвращён',
          returned_lapsed_by_customer:
            'Заказчик не ответил на ваше предложение вовремя — заказ больше не ваш',
          returned_lapsed_by_customer_fee:
            'Заказчик не ответил на ваше предложение вовремя — заказ больше не ваш, резерв возвращён',
          completed_auto: 'Заказчик не подтвердил вовремя — заказ завершён автоматически',
          reminder_answer: 'Заказчик ждёт вашего ответа — времени мало',
          negotiation_ended: 'Заказчик прекратил переговоры — заказ больше не ваш',
          negotiation_ended_fee:
            'Заказчик прекратил переговоры — заказ больше не ваш, резерв возвращён',
          reminder_work_check:
            'Согласованный день работы прошёл — если работа выполнена, нажмите «Работа выполнена»',
          cancelled_fee: 'Заказчик отменил заказ — замороженная сумма возвращена',
          complaint_no_contact:
            'Ваша жалоба «Не смог связаться» подтверждена — заказ отменён, штрафа вам нет',
          complaint_no_contact_fee:
            'Ваша жалоба «Не смог связаться» подтверждена — заказ отменён, штрафа вам нет, комиссия возвращена в кошелёк',
          complaint_no_work:
            'Ваша жалоба «Заказчик не дал работать» подтверждена — заказ отменён, штрафа вам нет',
          complaint_no_work_fee:
            'Ваша жалоба «Заказчик не дал работать» подтверждена — заказ отменён, штрафа вам нет, комиссия возвращена в кошелёк',
          worker_no_show: 'Ваша неявка подтверждена — заказ отменён',
          worker_no_show_fee:
            'Ваша неявка подтверждена — заказ отменён. Удержанная комиссия не возвращается',
        },
        complaint: {
          removed: 'Жалоба на вас убрана из вашего профиля',
        },
        match: {
          complaint_disputed:
            'Заказчик оспорил вашу жалобу — оператор рассмотрит и решит, пока заказ продолжается',
          complaint_rejected: 'Оператор отклонил вашу жалобу — заказ продолжается',
          complaint_rejected_fee:
            'Оператор отклонил вашу жалобу — заказ продолжается, комиссия не возвращается',
          no_show_rejected: 'Оператор решил, что вы приходили, — работа продолжается',
        },
        guarantee: {
          checked_silence: 'Заказчик не ответил — работа считается исправленной',
          disputed_worker_silent: 'Вы не ответили — обращение передано оператору',
          disputed_fix_overdue: 'Вы не исправили в срок — обращение передано оператору',
          decided_customer:
            'Оператор решил в пользу заказчика — {refund_amount} сум возвращены из вашего кошелька',
          decided_customer_plain:
            'Оператор решил в пользу заказчика — деньги возвращены из вашего кошелька',
          decided_worker: 'Оператор решил в вашу пользу',
        },
      },
      offer: {
        chosen: 'Заказчик выбрал вас — подтвердите договорённость или откажитесь',
        not_chosen: 'Заказчик выбрал другого специалиста — резерв возвращён',
        expired: 'Ваше предложение закрыто — резерв возвращён',
        not_chosen_free: 'Заказчик выбрал другого специалиста',
        declined: 'Выбранный вами специалист отказался — можете выбрать другое предложение',
        declined_none:
          'Выбранный вами специалист отказался — заказ снова открыт, ждите новых предложений',
        unanswered: 'Вы не ответили на выбор вовремя — выбор отменён, резерв возвращён',
        unanswered_free: 'Вы не ответили на выбор вовремя — выбор отменён',
        declined_unanswered:
          'Выбранный вами специалист не ответил вовремя — можете выбрать другое предложение',
        declined_unanswered_none:
          'Выбранный вами специалист не ответил вовремя — заказ снова открыт, ждите новых предложений',
        customer_unanswered:
          'Заказчик не ответил на ваше предложение вовремя — выбор отменён, резерв возвращён',
        customer_unanswered_free: 'Заказчик не ответил на ваше предложение вовремя — выбор отменён',
        lapsed:
          'Вы не ответили вовремя на предложение специалиста — выбор отменён, можете выбрать другое предложение',
        lapsed_none:
          'Вы не ответили вовремя на предложение специалиста — выбор отменён, заказ снова открыт, ждите новых предложений',
        rejected: 'Заказчик отклонил ваше предложение — резерв возвращён',
        rejected_free: 'Заказчик отклонил ваше предложение',
        expired_too_old: 'На ваше предложение долго не отвечали — оно закрыто, резерв возвращён',
        expired_date_passed: 'Дата заказа прошла — ваше предложение закрыто, резерв возвращён',
        expired_customer_blocked:
          'Заказчик сейчас не может работать с заказами — ваше предложение закрыто, замороженная сумма возвращена',
        expired_worker_blocked:
          'Ваш аккаунт ограничен, поэтому предложение закрыто — замороженная сумма возвращена',
        expired_worker_phone_unverified:
          'Номер телефона не подтверждён, поэтому предложение закрыто — замороженная сумма возвращена',
      },
      match: {
        complaint:
          'Специалист сообщил, что не смог с вами связаться, — ответьте, иначе заказ будет отменён',
        complaint_resolved: 'Ваша жалоба рассмотрена',
        complaint_disputed:
          'Заказчик оспорил вашу жалобу — оператор рассмотрит и решит, пока заказ продолжается',
        complaint_rejected: 'Оператор отклонил жалобу — заказ продолжается',
        complaint_rejected_fee:
          'Оператор отклонил жалобу — заказ продолжается, комиссия не возвращается',
        complaint_no_work:
          'Специалист сообщил, что прибыл, но ему не дали работать, — ответьте, иначе заказ будет отменён',
        no_show: 'Заказчик сообщил, что вы не пришли, — ответьте в течение {hours} ч',
        no_show_plain: 'Заказчик сообщил, что вы не пришли, — ответьте в отведённое время',
        no_show_disputed: 'Специалист говорит, что приходил, — оператор рассмотрит',
        no_show_disputed_arrival: 'Специалист отметил «Я на месте» — оператор рассмотрит',
        no_show_rejected: 'Оператор решил, что специалист приходил, — заказ продолжается',
      },
      complaint: {
        approved: 'Ваша жалоба одобрена — она появилась в профиле специалиста без вашего имени',
        rejected: 'Ваша жалоба отклонена — причина в разделе «Мои жалобы»',
        replied: 'Специалист ответил на вашу жалобу',
        published: 'Жалоба на вас одобрена — вы можете ответить на неё один раз',
        withdrawn: 'Клиент отозвал жалобу на вас',
        removed: 'Жалоба убрана из профиля',
      },
      bonus: {
        welcome: 'Вам начислен приветственный бонус {amount}',
        referral_joined: 'Бонус {amount} за регистрацию по приглашению',
        referral_reward: '{friend} выполнил первый заказ — вам бонус {amount}',
      },
      contest: {
        won: 'Поздравляем! Вы — лучший мастер: {district}, {month}',
        revoked: 'Звание «Лучший мастер: {district}» за {month} отозвано: {reason}',
      },
      business: {
        approved: 'Корпоративный аккаунт «{name}» подтверждён',
        rejected: 'Ответ по заявке «{name}»: {note}',
        plan_order: 'Регулярная услуга: {site} — {category}, создан заказ на {date}',
        plan_failed: 'Не удалось создать заказ по регулярной услуге: {site} — {category}',
        statement_ready: 'Отчёт за {month} готов: работ — {jobs}, итого {total}',
        member_added: 'Вас добавили сотрудником компании «{name}»',
      },
      promotion: {
        ended_listing: 'Срок TOP у объявления «{title}» закончился',
        ended_profile: 'Срок TOP у вашего профиля закончился',
      },
      pro: {
        renewed: 'Подписка Pro продлена до {date}',
        renew_failed: 'Не удалось продлить Pro — на кошельке нет {price}',
        expired: 'Срок подписки Pro закончился',
      },
      brigade: {
        invited: 'Вас пригласили в бригаду «{brigade}»',
        joined: '{worker} вступил(а) в вашу бригаду «{brigade}»',
      },
      verification: {
        manual_closed:
          'Подтверждение личности по фото документа прекращено: ваша заявка закрыта. Теперь личность подтверждается только через MyID.',
        expiring:
          'Подтверждение вашей личности истекает {date} — пройдите проверку MyID заново на сайте или в новой версии приложения',
        expired:
          'Срок подтверждения вашей личности истёк — пройдите проверку MyID заново на сайте или в новой версии приложения',
        myid_required:
          'Подтверждение оператора отменено — пройдите проверку MyID на сайте или в новой версии приложения',
        revoked: 'Подтверждение вашей личности отменено. Если есть вопросы, напишите в поддержку',
      },
      wallet: {
        topup: 'Кошелёк пополнен: {amount}',
        order_paid: 'Клиент оплатил: на кошелёк поступило {amount}',
        topup_reversed: 'Пополнение кошелька отменено: списано {amount}',
        order_refunded: 'Оплата возвращена клиенту: с кошелька списано {amount}',
        withdrawal_approved: 'Вывод выполнен: {amount}',
        withdrawal_rejected: 'Вывод отклонён, {amount} вернулись на кошелёк',
        deposit_forfeit: 'Залог заказчика переведён в ваш кошелёк: {amount} сум',
        deposit_forfeit_plain: 'Залог заказчика переведён в ваш кошелёк',
      },
      guarantee: {
        claim: 'Заказчик подал обращение по гарантии — ответьте в течение {hours} ч',
        claim_plain: 'Заказчик подал обращение по гарантии — ответьте в отведённое время',
        filed: 'Ваше обращение принято — специалист ответит в течение {hours} ч',
        filed_plain: 'Ваше обращение принято — специалист ответит в отведённое время',
        fixing: 'Специалист согласился исправить — в течение {days} дн.',
        fixing_plain: 'Специалист согласился исправить',
        fix_reported:
          'Специалист сообщил, что исправил, — проверьте и ответьте в течение {hours} ч',
        fix_reported_plain:
          'Специалист сообщил, что исправил, — проверьте и ответьте в отведённое время',
        checked: 'Заказчик проверил исправленную работу',
        checked_fixed: 'Заказчик подтвердил, что исправлено',
        checked_not_fixed: 'Заказчик сообщил, что не исправлено, — решит оператор',
        checked_silence: 'Вы не ответили, поэтому работа считается исправленной',
        disputed: 'Обращение по гарантии передано оператору — он решит',
        disputed_worker_refused: 'Специалист отказался исправлять — решит оператор',
        disputed_worker_silent: 'Специалист не ответил — решит оператор',
        disputed_fix_overdue: 'Специалист не исправил в срок — решит оператор',
        decided: 'Оператор принял решение по обращению',
        decided_customer: 'Оператор решил в вашу пользу — вам вернут {refund_amount} сум',
        decided_customer_plain: 'Оператор решил в вашу пользу — деньги вернут',
        decided_worker: 'Оператор отклонил обращение',
      },
      adminTitle: 'Сообщение от команды {brand}',
    },
    phoneGate: {
      body: 'Номер телефона не подтверждён. Клиенты не могут вас найти и оставить заказ — как только подтвердите номер, профиль вернётся в список.',
      later: 'Позже',
      promptCustomer:
        'Номер нужен, чтобы специалисты могли с вами связаться. И это единственный надёжный способ вернуть доступ к аккаунту.',
      promptTitle: 'Подтвердите номер телефона',
      promptWorker:
        'Без номера ваш профиль не виден в поиске, и клиенты не смогут оставить вам заказ. Подтверждение занимает минуту.',
      title: 'Ваш профиль не виден в поиске',
      viaSms: 'Через SMS',
      viaTelegram: 'Подтвердить через Telegram',
    },
    block: {
      body: 'В этот период нельзя создавать и принимать заказы. Если считаете решение ошибочным, обратитесь в поддержку.',
      title: 'Доступ временно ограничен — до {until}',
    },
  },
  en: {
    notifTypesWeb: {
      customer: {
        order: {
          accepted: 'A specialist accepted your order',
          cancelled: 'Your order was cancelled',
          completed: 'Your order is complete — rate the specialist',
          returned:
            'The specialist declined your order — send it to someone else or post it for everyone',
          returned_lapsed_by_worker:
            'The professional did not answer in time — the order is back with you',
          returned_lapsed_by_customer:
            "You did not answer the professional's offer in time — the order is back with you",
          completed_auto:
            'You did not confirm in time — the order completed on its own; rate the professional',
          reminder_answer: "Time to answer the professional's offer is running out",
          reminder_work_check:
            'The agreed day has passed — if the work is done, complete the order',
          complaint_no_contact:
            'The order was cancelled because the professional could not reach you — post it again if you still need it',
          complaint_no_work:
            'The order was cancelled because the professional was not let work — post it again if you still need it',
          extra_decided_lapsed: 'You did not answer the extra work offer — it was cancelled',
          worker_no_show: 'The professional’s no-show is confirmed — the order is cancelled',
        },
        complaint: {
          removed: 'Your complaint was removed from the profile — see why in “My complaints”',
        },
        match: {
          complaint_rejected:
            "An operator turned down the professional's report — the order goes on",
          no_show_rejected: 'An operator found the professional came — the order goes on',
        },
      },
      fallback: 'New notification',
      listing: {
        commented: 'New comment on your listing',
        replied: 'The listing owner replied to your comment',
      },
      order: {
        accepted: 'Your order was accepted',
        agreed: 'Terms agreed — the job is on',
        cancelled: 'Order cancelled',
        completed: 'Order completed',
        message: 'New message about an order',
        negotiation_ended: 'No deal — the order is open again',
        new: 'A new job that matches you',
        newSuggested: 'A new job — it may match you',
        offer: 'A new offer on the order',
        new_offer: 'A new offer on your order',
        work_done: 'The professional says the job is done — please confirm',
        returned: 'Order returned',
        returned_fee: 'The order was returned — the amount set aside is back',
        returned_recalled: 'The customer took the order back',
        returned_lapsed_by_worker: 'No answer in time — the order was returned',
        returned_lapsed_by_worker_fee:
          'No answer in time — the order was returned and the amount set aside is back',
        returned_lapsed_by_customer: 'No answer in time — the order was returned',
        returned_lapsed_by_customer_fee:
          'No answer in time — the order was returned and the amount set aside is back',
        completed_auto: 'The order completed on its own',
        auto_closed_no_choice: 'No offer was chosen in time — the order closed',
        auto_closed_date_passed: "The order's date passed — it closed; you can post it again",
        auto_closed_stale:
          'No offers came for a long time — the order closed; you can post it again',
        reminder_new_order: 'Time to answer the order sent to you is running out',
        reminder_answer: 'Time to answer is running out',
        reminder_choose: 'Time to choose an offer is running out — otherwise the order closes',
        reminder_complete:
          'The professional marked the job as done — confirm it or say “Not done yet”; time is running out',
        negotiation_ended_fee: 'No deal — the amount set aside is back',
        work_not_done:
          'The customer says the work is not done yet — finish it and press “Work done” again',
        reminder_work_check: 'The agreed day has passed — is the work done?',
        auto_closed_returned:
          'The order that came back to you was not sent on for a long time — it is closed; you can post it again',
        cancelled_fee: 'Order cancelled — the held amount was returned',
        repeat_reminder: 'Time for {category} again — book the same pro',
        stage_done: 'The professional finished «{stage}» — please confirm',
        stage_confirmed: 'The customer confirmed «{stage}»',
        message_many: '{count} new messages about an order',
        digest: '{count} new orders came in while you were away — still open',
        digest_one: 'A new order came in while you were away — still open',
        complaint_no_contact:
          'The professional could not reach the customer — the order is cancelled',
        complaint_no_contact_fee:
          'The professional could not reach the customer — the order is cancelled, the fee returned',
        arrived: 'The professional arrived at {time}',
        arrived_plain: 'The professional has arrived',
        location: 'The customer marked the address on the map',
        location_request:
          'The professional asks you to mark the address on the map so they can find you',
        complaint_no_work: 'The professional was not let work — the order is cancelled',
        complaint_no_work_fee:
          'The professional was not let work — the order is cancelled, the fee returned',
        extra: 'The specialist proposed extra work: {description} — {price} UZS',
        extra_decided: 'An answer about the extra work',
        extra_decided_approved:
          'The customer agreed to the extra work: {description} — {price} UZS',
        extra_decided_declined: 'The customer declined the extra work',
        extra_decided_lapsed: 'The extra work offer got no answer',
        reminder_job_day: 'Today is the agreed day of the job',
        reminder_job_day_window: 'Today, {window} — the agreed time of the job',
        new_realert: 'An order that suits you has become urgent',
        reminder_arrival_check:
          'Did the professional come? The agreed time was {window} — please answer',
        reminder_arrival_check_plain:
          'Did the professional come? The agreed time has passed — please answer',
        worker_no_show: 'The professional’s no-show is confirmed — the order is cancelled',
        worker_no_show_fee: 'The professional’s no-show is confirmed — the order is cancelled',
        deposit_pending: 'Your order goes out once the deposit is paid — {amount} UZS, by {due_at}',
        deposit_pending_plain: 'Your order goes out once the deposit is paid',
        deposit_held: 'Deposit received — your order is out',
        deposit_refund_due: 'The deposit will be returned: {amount} UZS',
        deposit_refund_due_plain: 'The deposit will be returned',
        deposit_refunded: 'Deposit returned: {amount} UZS',
        deposit_refunded_plain: 'Deposit returned',
        deposit_forfeited: 'The deposit went to the professional',
        deposit_forfeited_no_contact:
          'The deposit went to the professional: it was confirmed they could not reach you',
        deposit_forfeited_no_work:
          'The deposit went to the professional: it was confirmed they were not let work when they came',
        deposit_forfeited_customer_fault:
          'The deposit went to the professional: the cancellation was found to be your fault',
        deposit_waived: 'The deposit is no longer required — your order is out',
        deposit_unpaid: 'The deposit was not paid — the order was cancelled',
      },
      review: {
        received: 'You received a new review',
      },
      sitemap: {
        group: {
          account: 'Account',
          cabinet: 'Dashboard',
          help: 'Help and information',
          legal: 'Documents',
          main: 'Main',
        },
        page: {
          about: 'About us',
          becomeWorker: 'Become a professional',
          categories: 'Categories',
          faq: 'Frequently asked questions',
          favorites: 'Favourites',
          home: 'Home',
          login: 'Sign in',
          orders: 'Orders',
          privacy: 'Privacy policy',
          profile: 'Profile',
          register: 'Sign up',
          suggestion: 'Send a suggestion',
          support: 'Contact a specialist',
          terms: 'Terms of use',
          wallet: 'Wallet',
          workers: 'Professionals',
        },
        subtitle: 'Every section of the site in one list.',
        title: 'Site map',
      },
      support: {
        answered: 'Your message has been answered',
      },
      worker: {
        order: {
          accepted: 'You accepted the order',
          cancelled: 'The order was cancelled',
          completed: 'Order completed — rate the customer',
          returned: 'The customer ended the negotiation — the order moved to “Declined”',
          returned_fee:
            'The customer ended the talk — the order moved to “Declined” and the amount set aside is back',
          returned_lapsed_by_worker:
            'You did not answer the order in time — it went back to the customer',
          returned_lapsed_by_worker_fee:
            'You did not answer the order in time — it went back to the customer and the amount set aside is back',
          returned_lapsed_by_customer:
            'The customer did not answer your offer in time — the order is no longer yours',
          returned_lapsed_by_customer_fee:
            'The customer did not answer your offer in time — the order is no longer yours and the amount set aside is back',
          completed_auto: 'The customer did not confirm in time — the order completed on its own',
          reminder_answer: 'The customer is waiting for your answer — little time left',
          negotiation_ended: 'The customer ended the talk — the order is no longer yours',
          negotiation_ended_fee:
            'The customer ended the talk — the order is no longer yours and the amount set aside is back',
          reminder_work_check: 'The agreed day has passed — if the work is done, press “Work done”',
          cancelled_fee: 'The customer cancelled the order — the held amount was returned',
          complaint_no_contact:
            'Your “Could not reach” report was upheld — the order is cancelled, no penalty for you',
          complaint_no_contact_fee:
            'Your “Could not reach” report was upheld — the order is cancelled, no penalty for you, the fee is back in your wallet',
          complaint_no_work:
            'Your “Customer did not let me work” report was upheld — the order is cancelled, no penalty for you',
          complaint_no_work_fee:
            'Your “Customer did not let me work” report was upheld — the order is cancelled, no penalty for you, the fee is back in your wallet',
          worker_no_show: 'Your no-show is confirmed — the order is cancelled',
          worker_no_show_fee:
            'Your no-show is confirmed — the order is cancelled. The fee taken is not returned',
        },
        complaint: {
          removed: 'A complaint about you was removed from your profile',
        },
        match: {
          complaint_disputed:
            'The customer disputed your report — an operator will look into it and decide; the order goes on meanwhile',
          complaint_rejected: 'An operator turned down your report — the order goes on',
          complaint_rejected_fee:
            'An operator turned down your report — the order goes on, the fee is not returned',
          no_show_rejected: 'An operator found you came — the job goes on',
        },
        guarantee: {
          checked_silence: 'The customer did not answer — it counts as fixed',
          disputed_worker_silent: 'You did not answer — the claim has gone to an operator',
          disputed_fix_overdue: 'You did not fix it in time — the claim has gone to an operator',
          decided_customer:
            'An operator decided for the customer — {refund_amount} UZS was returned from your wallet',
          decided_customer_plain:
            'An operator decided for the customer — the money was returned from your wallet',
          decided_worker: 'An operator decided in your favour',
        },
      },
      offer: {
        chosen: 'The customer chose you — confirm the deal or turn it down',
        not_chosen: 'The customer chose someone else — the amount set aside is back',
        expired: 'Your offer was closed — the amount set aside is back',
        not_chosen_free: 'The customer chose someone else',
        declined: 'The professional you chose turned it down — you can choose another offer',
        declined_none:
          'The professional you chose turned it down — the order is open again, wait for new offers',
        unanswered:
          'You did not answer the choice in time — it lapsed and the amount set aside is back',
        unanswered_free: 'You did not answer the choice in time — it lapsed',
        declined_unanswered:
          'The professional you chose did not answer in time — you can choose another offer',
        declined_unanswered_none:
          'The professional you chose did not answer in time — the order is open again, wait for new offers',
        customer_unanswered:
          'The customer did not answer your offer in time — the choice lapsed and the amount set aside is back',
        customer_unanswered_free:
          'The customer did not answer your offer in time — the choice lapsed',
        lapsed:
          "You did not answer the professional's offer in time — the choice lapsed, you can choose another offer",
        lapsed_none:
          "You did not answer the professional's offer in time — the choice lapsed, the order is open again, wait for new offers",
        rejected: 'The customer turned down your offer — the amount set aside is back',
        rejected_free: 'The customer turned down your offer',
        expired_too_old:
          'Your offer waited too long — it was closed and the amount set aside is back',
        expired_date_passed:
          "The order's date passed — your offer was closed and the amount set aside is back",
        expired_customer_blocked:
          'The customer cannot deal with orders right now — your offer was closed and the held amount returned',
        expired_worker_blocked:
          'Your account is restricted, so your offer was closed — the held amount was returned',
        expired_worker_phone_unverified:
          'Your phone number is not confirmed, so your offer was closed — the held amount was returned',
      },
      match: {
        complaint:
          'The professional says they could not reach you — answer, or the order will be cancelled',
        complaint_resolved: 'Your report has been resolved',
        complaint_disputed:
          'The customer disputed your report — an operator will look into it and decide; the order goes on meanwhile',
        complaint_rejected: 'An operator turned down the report — the order goes on',
        complaint_rejected_fee:
          'An operator turned down the report — the order goes on, the fee is not returned',
        complaint_no_work:
          'The professional says they arrived and were not let work — answer, or the order will be cancelled',
        no_show: 'The customer says you did not come — answer within {hours} h',
        no_show_plain: 'The customer says you did not come — answer in time',
        no_show_disputed: 'The professional says they came — an operator will look into it',
        no_show_disputed_arrival:
          'The professional marked “I’ve arrived” — an operator will look into it',
        no_show_rejected: 'An operator found the professional came — the order goes on',
      },
      complaint: {
        approved:
          'Your complaint was approved — it now shows on the professional’s profile without your name',
        rejected: 'Your complaint was turned down — see why in “My complaints”',
        replied: 'The professional replied to your complaint',
        published: 'A complaint about you was approved — you may reply to it once',
        withdrawn: 'A customer withdrew their complaint about you',
        removed: 'A complaint was removed from the profile',
      },
      bonus: {
        welcome: 'You received a {amount} welcome bonus',
        referral_joined: 'A {amount} bonus for joining through an invitation',
        referral_reward: '{friend} completed their first job — a {amount} bonus for you',
      },
      contest: {
        won: 'Congratulations! You are the best pro in {district} for {month}',
        revoked: 'The “Best pro in {district}” title for {month} was taken back: {reason}',
      },
      business: {
        approved: 'The “{name}” company account was approved',
        rejected: 'About the “{name}” application: {note}',
        plan_order: 'Regular service: {site} — {category}, an order was placed for {date}',
        plan_failed: 'Could not place the regular service order: {site} — {category}',
        statement_ready: '{month} statement is ready: {jobs} jobs, {total} in total',
        member_added: 'You were added as an employee of «{name}»',
      },
      promotion: {
        ended_listing: 'The TOP for «{title}» has ended',
        ended_profile: 'Your profile’s TOP has ended',
      },
      pro: {
        renewed: 'Your Pro was renewed until {date}',
        renew_failed: 'Pro could not be renewed — the wallet lacks {price}',
        expired: 'Your Pro has ended',
      },
      brigade: {
        invited: 'You were invited to the «{brigade}» brigade',
        joined: '{worker} joined your «{brigade}» brigade',
      },
      verification: {
        manual_closed:
          'Identity verification by document photo has ended: your request was closed. Identity is now verified only with MyID.',
        expiring:
          'Your identity verification ends on {date} — verify again with MyID on the website or in the new version of the app',
        expired:
          'Your identity verification has expired — verify again with MyID on the website or in the new version of the app',
        myid_required:
          "The operator's approval was withdrawn — verify with MyID on the website or in the new version of the app",
        revoked: 'Your identity verification was withdrawn. If you have questions, contact support',
      },
      wallet: {
        topup: 'Wallet topped up: {amount}',
        order_paid: 'A customer paid: {amount} landed in your wallet',
        topup_reversed: 'Wallet top-up reversed: {amount} was taken back',
        order_refunded: 'A payment went back to the customer: {amount} was taken from your wallet',
        withdrawal_approved: 'Withdrawal sent: {amount}',
        withdrawal_rejected: 'Withdrawal turned down; {amount} is back in your wallet',
        deposit_forfeit: 'The customer’s deposit was transferred to your wallet: {amount} UZS',
        deposit_forfeit_plain: 'The customer’s deposit was transferred to your wallet',
      },
      guarantee: {
        claim: 'The customer filed a guarantee claim — answer within {hours} h',
        claim_plain: 'The customer filed a guarantee claim — answer in the time given',
        filed: 'Your claim is in — the professional answers within {hours} h',
        filed_plain: 'Your claim is in — the professional answers in the time given',
        fixing: 'The professional agreed to fix it — within {days} days',
        fixing_plain: 'The professional agreed to fix it',
        fix_reported: 'The professional says it is fixed — check and answer within {hours} h',
        fix_reported_plain:
          'The professional says it is fixed — check and answer in the time given',
        checked: 'The customer checked the fix',
        checked_fixed: 'The customer confirmed it is fixed',
        checked_not_fixed: 'The customer says it is not fixed — an operator decides',
        checked_silence: 'You did not answer, so it counts as fixed',
        disputed: 'The guarantee claim has gone to an operator, who will decide',
        disputed_worker_refused: 'The professional refused to fix it — an operator decides',
        disputed_worker_silent: 'The professional did not answer — an operator decides',
        disputed_fix_overdue: 'The professional did not fix it in time — an operator decides',
        decided: 'An operator decided on the guarantee claim',
        decided_customer:
          'An operator decided in your favour — {refund_amount} UZS will be refunded',
        decided_customer_plain: 'An operator decided in your favour — the money will be refunded',
        decided_worker: 'An operator rejected the claim',
      },
      adminTitle: 'A message from the {brand} team',
    },
    phoneGate: {
      body: 'Your phone number is not verified. Customers cannot find you or place an order — the profile returns to the list as soon as you confirm it.',
      later: 'Later',
      promptCustomer:
        'Professionals need a number to reach you. It is also the only reliable way back into your account.',
      promptTitle: 'Confirm your phone number',
      promptWorker:
        'Without a number your profile is hidden from search and customers cannot book you. Confirming takes a minute.',
      title: 'Your profile is hidden from search',
      viaSms: 'Via SMS',
      viaTelegram: 'Confirm via Telegram',
    },
    block: {
      body: 'You cannot create or accept orders during this period. If you believe the decision was wrong, contact support.',
      title: 'Your account is restricted until {until}',
    },
  },
};
