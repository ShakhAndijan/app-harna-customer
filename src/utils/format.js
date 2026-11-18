// "{n} yil" — tilga mos qo'shimcha: `common.years` satr (uz) yoki ko'plik shakllari
// massivi (en: [bir, ko'p], ru: [1 год, 2 года, 5 лет]) bo'lishi mumkin.
export function formatYears(tr, n) {
  const forms = tr('common.years');
  let form = forms;
  if (Array.isArray(forms)) {
    if (forms.length === 2) {
      form = forms[n === 1 ? 0 : 1];
    } else {
      const m10 = n % 10;
      const m100 = n % 100;
      const i =
        m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2;
      form = forms[i];
    }
  }
  return String(form).replace('{n}', n);
}

// 1234567 → "1 234 567"
export const formatNumber = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ISO sana-vaqt → "30.10.2026, 14:05" (qurilma vaqt mintaqasida); noto'g'ri qiymatda bo'sh matn.
export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ISO sana → "30.10.2026" (qurilma vaqt mintaqasida); noto'g'ri qiymatda bo'sh matn.
export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
