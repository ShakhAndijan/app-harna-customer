import { useCallback, useEffect, useRef, useState } from 'react';
import { appAlert } from '../../../components/AppAlert';
import { useLanguage } from '../../../context/LanguageContext';
import { sendOrderChat } from '../../../api/orders';
import { ApiError } from '../../../utils/request';
import { getErrorMessage } from '../../../utils/errors';

// Chat xabarlarini yuborish navbati (saytdagi/backend ilovasidagi `ChatPanel` bilan bir xil qoida):
// yozilgan qator kutmasdan ro'yxatga tushadi (soat belgisi bilan) va birma-bir, yozilgan tartibda ketadi —
// kontaktni tekshirish yozuvchining oldingi qatorlarini ham o'qiydi, shuning uchun keyingisi oldinga o'tmasligi kerak.
//  - `pending`: ketyapti (yoki navbatda);
//  - `refused`: server rad etdi (kontakt kelishuvgacha, chat yopiq…): sababi aytiladi, tahrirlash/o'chirish mumkin;
//  - `failed`: javob kelmadi (tarmoq/server): qayta yuborish mumkin.
// `onSent(chat)` — server qaytargan yangi chat, `onClosed()` — chat yopilgan (qayta o'qish kerak).
export default function useChatOutbox({ orderId, workerId, onSent, onClosed }) {
  const { t: tr } = useLanguage();
  const [outbox, setOutboxState] = useState([]);
  const outboxRef = useRef([]);
  const pumping = useRef(false);
  const nextKey = useRef(1);
  const mounted = useRef(true);
  const latest = useRef({ onSent, onClosed, tr });

  useEffect(() => {
    latest.current = { onSent, onClosed, tr };
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setOutbox = useCallback((next) => {
    outboxRef.current = next(outboxRef.current);
    if (mounted.current) setOutboxState(outboxRef.current);
  }, []);

  // Navbatdagi qatorlarni birma-bir yuboradi; bittasi o'tmasa keyingisi kutadi emas, o'z holatiga tushadi.
  const pump = useCallback(async () => {
    if (pumping.current) return;
    pumping.current = true;
    try {
      for (;;) {
        const next = outboxRef.current.find((o) => o.state === 'pending');
        if (!next) break;
        try {
          const fresh = await sendOrderChat(orderId, next.body, next.workerId);
          setOutbox((prev) => prev.filter((o) => o.key !== next.key));
          latest.current.onSent?.(fresh);
        } catch (e) {
          // 4xx (429 dan tashqari) — server qatorni rad etdi; qolganlari (tarmoq, 5xx) qayta yuborilishi mumkin.
          const refused =
            e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 429;
          const reason = getErrorMessage(e, latest.current.tr, 'requests.actionFailed');
          setOutbox((prev) =>
            prev.map((o) =>
              o.key === next.key ? { ...o, state: refused ? 'refused' : 'failed', reason } : o
            )
          );
          if (e instanceof ApiError && e.code?.startsWith('chat_contains_')) {
            appAlert(latest.current.tr('common.errorTitle'), reason);
          }
          if (e instanceof ApiError && e.code === 'chat_closed') latest.current.onClosed?.();
        }
      }
    } finally {
      pumping.current = false;
    }
  }, [orderId, setOutbox]);

  const send = useCallback(
    (body) => {
      setOutbox((prev) => [
        ...prev,
        {
          key: nextKey.current++,
          body,
          workerId,
          createdAt: new Date().toISOString(),
          state: 'pending',
        },
      ]);
      pump();
    },
    [pump, setOutbox, workerId]
  );

  // Javob kelmagan qatorni qayta yuboradi (navbat oxiriga emas, o'z o'rnida).
  const retry = useCallback(
    (key) => {
      setOutbox((prev) =>
        prev.map((o) => (o.key === key ? { ...o, state: 'pending', reason: undefined } : o))
      );
      pump();
    },
    [pump, setOutbox]
  );

  // Rad etilgan qatorni navbatdan olib, matnini qaytaradi: u yozish maydoniga tahrirlash uchun qo'yiladi.
  const edit = useCallback(
    (key) => {
      const line = outboxRef.current.find((o) => o.key === key);
      if (!line) return null;
      setOutbox((prev) => prev.filter((o) => o.key !== key));
      return line.body;
    },
    [setOutbox]
  );

  const remove = useCallback(
    (key) => setOutbox((prev) => prev.filter((o) => o.key !== key)),
    [setOutbox]
  );

  return { outbox, send, retry, edit, remove };
}
