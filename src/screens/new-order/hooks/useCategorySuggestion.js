import { useEffect, useRef, useState } from 'react';
import { suggestCategories } from '../../../api/categories';

// «Taklif»: tavsif tinch turgach server qaysi yo'nalish mos kelishini aytadi, forma uni bitta chip qilib
// ko'rsatadi (saytdagi `useTaskSuggestion` bilan bir xil qoidalar). Har so'rov serverda model chaqiruvi —
// shuning uchun qachon so'rash qoidasi muhim:
//  - juda qisqa matn (server chegarasi 10 belgi) va juda uzun matn (2000) yuborilmaydi;
//  - matn har tugma bosilganda emas, 800 ms tinch turgandan keyin so'raladi;
//  - bir xil matn qayta so'ralmaydi (javob matn bo'yicha saqlanadi, matn qaytsa chip yana chiqadi);
//  - shu matn uchun so'rov yo'lda bo'lsa, ikkinchisi yuborilmaydi.
// Xato (soat limiti, tarmoq, endpoint yo'q) javob sifatida eslab qolinmaydi va xabar ko'rsatilmaydi: chip yo'q.
const MIN_CHARS = 10;
const MAX_CHARS = 2000;
const DELAY_MS = 800;
const KEPT_ANSWERS = 30;

// "Kran  oqyapti " va "Kran oqyapti" — bir xil savol.
const normalize = (description) => description.trim().replace(/\s+/g, ' ');

/** Shu matn uchun taklif qilingan yo'nalish id'lari (eng mosi birinchi) yoki null. */
export default function useCategorySuggestion(description, enabled) {
  const text = normalize(description);
  const [answer, setAnswer] = useState(null);
  // Faqat effekt va so'rov callback'larida o'qiladi/yoziladi, render paytida emas.
  const answers = useRef(new Map());
  const asking = useRef(new Set());
  const latest = useRef(text);

  useEffect(() => {
    latest.current = text;
    if (!enabled) return undefined;
    const timer = setTimeout(() => {
      const known = answers.current.get(text);
      if (known) {
        setAnswer({ text, ids: known });
        return;
      }
      if (text.length < MIN_CHARS || text.length > MAX_CHARS || asking.current.has(text)) return;
      asking.current.add(text);
      suggestCategories(text)
        .then((ids) => {
          answers.current.set(text, ids);
          if (answers.current.size > KEPT_ANSWERS) {
            answers.current.delete(answers.current.keys().next().value);
          }
          if (latest.current === text) setAnswer({ text, ids });
        })
        .catch(() => {})
        .finally(() => asking.current.delete(text));
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, enabled]);

  return enabled && answer?.text === text && answer.ids.length > 0 ? answer.ids : null;
}
