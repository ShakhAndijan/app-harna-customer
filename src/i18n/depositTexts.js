// «Omonat» (tanlab olinadigan, 14.11) matnlari — backend dasturchisining ilova tarjimalaridan (`deposit.*`) va
// bildirishnoma matnlaridan. Joy tutuvchilar: {amount}, {due_at}, {payment_minutes}, {window_days}, {marks}.
export const DEPOSIT_TEXTS = {
  uz: {
    deposit: {
      formNeed:
        'Bu buyurtma uchun {amount} so‘m omonat kerak. Buyurtma omonat to‘langach e’lon qilinadi — buning uchun {payment_minutes} daqiqa vaqtingiz bo‘ladi.',
      formRules:
        'Ish yakunlansa yoki usta aybi bilan bekor bo‘lsa, omonat qaytariladi. Kelishuvdan keyin siz bekor qilsangiz yoki usta shikoyati tasdiqlansa, omonat ustaga o‘tadi.',
      reasonMarks:
        'Sababi: oxirgi {window_days} kunda buyurtmalaringizda {marks} ta muammo qayd etilgan.',
      reasonAdmin: 'Sababi: administrator qarori.',
      pay: 'Omonatni to‘lang: {amount} so‘m — {due_at} gacha. To‘lanmasa, buyurtma bekor qilinadi.',
      held: 'Omonat to‘landi: {amount} so‘m',
      refundDue: 'Omonat qaytariladi: {amount} so‘m — xodimlarimiz to‘lab beradi',
      refundDueLate: 'Omonat buyurtma yopilgandan keyin keldi — {amount} so‘m qaytariladi',
      refunded: 'Omonat qaytarildi: {amount} so‘m',
      forfeitedNoContact: 'Omonat ustaga o‘tkazildi: usta siz bilan bog‘lana olmagani tasdiqlandi',
      forfeitedNoWork: 'Omonat ustaga o‘tkazildi: usta kelganda ish qildirilmagani tasdiqlandi',
      forfeitedCustomerFault:
        'Omonat ustaga o‘tkazildi: bekor qilish sizning aybingiz bilan deb topildi',
      forfeited: 'Omonat ustaga o‘tkazildi',
      voidUnpaid: 'Omonat to‘lanmadi — buyurtma bekor qilindi',
      voidWaived: 'Omonat talab qilinmaydigan bo‘ldi — buyurtma e’lon qilindi',
      unpaidReason: 'Omonat to‘lanmadi',
      heldBadge: 'Mijoz omonat qo‘ygan',
      statusLabel: 'Omonat kutilmoqda',
      statusSubtext: 'Omonat to‘langach buyurtmangiz e’lon qilinadi.',
      payTitle: 'Omonatni to‘lash',
      payment: {
        noProvider: 'Hozircha to‘lov tizimi mavjud emas.',
        providersFailed: 'To‘lov tizimlarini yuklab bo‘lmadi.',
        retry: 'Qayta urinish',
        payFailed: 'To‘lovni boshlab bo‘lmadi, qayta urinib ko‘ring',
        labelUzum: 'Uzum (karta)',
      },
      notifications: {
        order: {
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
        wallet: {
          deposit_forfeit: 'Mijoz omonati hamyoningizga o‘tkazildi: {amount} so‘m',
          deposit_forfeit_plain: 'Mijoz omonati hamyoningizga o‘tkazildi',
        },
      },
    },
  },
  ru: {
    deposit: {
      formNeed:
        'Для этого заказа нужен залог {amount} сум. Заказ будет опубликован после оплаты залога — на это у вас будет {payment_minutes} мин.',
      formRules:
        'Если работа будет выполнена или заказ отменят по вине специалиста, залог вернётся. Если после договорённости заказ отмените вы или жалоба специалиста подтвердится, залог перейдёт специалисту.',
      reasonMarks:
        'Причина: за последние {window_days} дн. в ваших заказах отмечено проблем: {marks}.',
      reasonAdmin: 'Причина: решение администратора.',
      pay: 'Оплатите залог: {amount} сум — до {due_at}. Если его не оплатить, заказ будет отменён.',
      held: 'Залог оплачен: {amount} сум',
      refundDue: 'Залог будет возвращён: {amount} сум — его выплатят наши сотрудники',
      refundDueLate: 'Залог поступил после закрытия заказа — {amount} сум будут возвращены',
      refunded: 'Залог возвращён: {amount} сум',
      forfeitedNoContact:
        'Залог передан специалисту: подтверждено, что специалист не смог с вами связаться',
      forfeitedNoWork:
        'Залог передан специалисту: подтверждено, что, когда специалист пришёл, работать ему не дали',
      forfeitedCustomerFault:
        'Залог передан специалисту: отмена признана произошедшей по вашей вине',
      forfeited: 'Залог передан специалисту',
      voidUnpaid: 'Залог не оплачен — заказ отменён',
      voidWaived: 'Залог больше не требуется — заказ опубликован',
      unpaidReason: 'Залог не оплачен',
      heldBadge: 'Заказчик внёс залог',
      statusLabel: 'Ожидается залог',
      statusSubtext: 'После оплаты залога ваш заказ будет опубликован.',
      payTitle: 'Оплата залога',
      payment: {
        noProvider: 'Платёжные системы пока недоступны.',
        providersFailed: 'Не удалось загрузить платёжные системы.',
        retry: 'Повторить',
        payFailed: 'Не удалось начать оплату, попробуйте снова',
        labelUzum: 'Uzum (карта)',
      },
      notifications: {
        order: {
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
          deposit_forfeited_customer_fault:
            'Залог передан специалисту: отмена признана вашей виной',
          deposit_waived: 'Залог больше не требуется — заказ опубликован',
          deposit_unpaid: 'Залог не оплачен — заказ отменён',
        },
        wallet: {
          deposit_forfeit: 'Залог заказчика переведён в ваш кошелёк: {amount} сум',
          deposit_forfeit_plain: 'Залог заказчика переведён в ваш кошелёк',
        },
      },
    },
  },
  en: {
    deposit: {
      formNeed:
        "This order needs a deposit of {amount} so'm. It is published once the deposit is paid — you will have {payment_minutes} minutes for that.",
      formRules:
        'If the job is completed or cancelled through the professional’s fault, the deposit is returned. If you cancel after the deal, or a professional’s complaint is upheld, the deposit goes to the professional.',
      reasonMarks:
        'Reason: {marks} problems were recorded on your orders in the last {window_days} days.',
      reasonAdmin: 'Reason: an administrator’s decision.',
      pay: "Pay the deposit: {amount} so'm — by {due_at}. If it is not paid, the order will be cancelled.",
      held: "Deposit paid: {amount} so'm",
      refundDue: "The deposit will be returned: {amount} so'm — our staff will pay it out",
      refundDueLate: "The deposit arrived after the order closed — {amount} so'm will be returned",
      refunded: "Deposit returned: {amount} so'm",
      forfeitedNoContact:
        'The deposit went to the professional: it was confirmed they could not reach you',
      forfeitedNoWork:
        'The deposit went to the professional: it was confirmed they were not let work when they came',
      forfeitedCustomerFault:
        'The deposit went to the professional: the cancellation was found to be your fault',
      forfeited: 'The deposit went to the professional',
      voidUnpaid: 'The deposit was not paid — the order is cancelled',
      voidWaived: 'A deposit is no longer required — the order is published',
      unpaidReason: 'Deposit not paid',
      heldBadge: 'Customer paid a deposit',
      statusLabel: 'Deposit pending',
      statusSubtext: 'Your order is published once the deposit is paid.',
      payTitle: 'Pay the deposit',
      payment: {
        noProvider: 'No payment system is available right now.',
        providersFailed: 'Could not load the payment systems.',
        retry: 'Try again',
        payFailed: 'Could not start the payment, try again',
        labelUzum: 'Uzum (card)',
      },
      notifications: {
        order: {
          deposit_pending:
            'Your order goes out once the deposit is paid — {amount} UZS, by {due_at}',
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
        wallet: {
          deposit_forfeit: 'The customer’s deposit was transferred to your wallet: {amount} UZS',
          deposit_forfeit_plain: 'The customer’s deposit was transferred to your wallet',
        },
      },
    },
  },
};
