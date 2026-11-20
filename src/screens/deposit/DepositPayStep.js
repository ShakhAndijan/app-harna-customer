import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getPaymentProviders, payOrderDeposit } from '../../api/orders';
import { ApiError } from '../../utils/request';
import { getErrorMessage } from '../../utils/errors';
import {
  depositDue,
  depositPayText,
  openCheckout,
  paymentPageLocale,
  providerLabel,
} from './utils';

// Buyurtma omonat to'lanishini kutayotgan paytdagi to'lov qadami (buyurtmada va ro'yxat kartasida):
// «Omonatni to'lang: … so'm — … gacha», so'ng omonat qabul qiladigan har bir to'lov tizimi uchun tugma.
// Tugma serverdan shu tizim sahifasini so'raydi va ochadi; qaytgach buyurtma qayta o'qiladi — to'langan
// bo'lsa u allaqachon e'lon qilingan. Server omonatni o'chirgan bo'lsa (`depositEnabled` false) hech narsa
// taklif qilinmaydi: to'lov rad etilardi, buyurtma esa bir necha daqiqada omonatsiz chiqadi.
export default function DepositPayStep({ order, compact = false, onChanged }) {
  const { theme: t } = useTheme();
  const { t: tr, language } = useLanguage();
  const [busy, setBusy] = useState(null);
  const [problem, setProblem] = useState(null);
  const awayRef = useRef(false);

  const providers = useQuery({
    queryKey: ['payments', 'providers'],
    queryFn: getPaymentProviders,
    staleTime: 60 * 1000,
    // Har bir kartada emas, faqat omonat haqiqatan to'lanadigan buyurtmada so'raladi.
    enabled: depositDue(order) && !!order.deposit,
  });

  // To'lov sahifasidan (Click ilovasi yoki brauzer) ilovaga qaytganda buyurtma qayta o'qiladi.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && awayRef.current) {
        awayRef.current = false;
        onChanged?.();
      }
    });
    return () => sub.remove();
  }, [onChanged]);

  if (!depositDue(order) || !order.deposit) return null;
  // Kutayotgan paytda o'chirilgan: to'lanadigan narsa yo'q — omonatsiz chiqadi.
  if (providers.data?.depositEnabled === false) return null;

  const list = providers.data?.depositProviders ?? [];

  const pay = async (provider) => {
    setBusy(provider);
    setProblem(null);
    try {
      const answer = await payOrderDeposit(
        order.id,
        provider,
        paymentPageLocale(provider, language)
      );
      awayRef.current = true;
      if (answer?.checkout_url) await openCheckout(answer.checkout_url, provider);
      onChanged?.();
    } catch (e) {
      setProblem(getErrorMessage(e, tr, 'deposit.payment.payFailed'));
      // Buyurtma shu orada o'zgargan (to'langan, e'lon qilingan, muddati o'tgan): qayta o'qiladi.
      if (e instanceof ApiError && MOVED_ON.includes(e.code)) onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={[
        s.box,
        compact && s.compact,
        { backgroundColor: t.gold + '1f', borderColor: t.gold + '66' },
      ]}
    >
      <Text style={[s.title, { color: t.text }]}>{depositPayText(tr, order.deposit)}</Text>
      {!!problem && <Text style={[s.error, { color: t.red }]}>{problem}</Text>}

      {list.map((code) => (
        <TouchableOpacity
          key={code}
          style={[s.btn, { backgroundColor: t.orange, opacity: busy != null ? 0.6 : 1 }]}
          activeOpacity={0.85}
          disabled={busy != null}
          onPress={() => pay(code)}
        >
          {busy === code ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnText}>{providerLabel(code, providers.data?.labels, tr)}</Text>
          )}
        </TouchableOpacity>
      ))}

      {providers.isSuccess && list.length === 0 && (
        <Text style={[s.hint, { color: t.muted }]}>{tr('deposit.payment.noProvider')}</Text>
      )}

      {providers.isError && (
        <>
          <Text style={[s.error, { color: t.red }]}>{tr('deposit.payment.providersFailed')}</Text>
          <TouchableOpacity
            style={[s.btn, { borderWidth: 1, borderColor: t.border }]}
            activeOpacity={0.85}
            onPress={() => providers.refetch()}
          >
            <Text style={[s.btnText, { color: t.text }]}>{tr('deposit.payment.retry')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// Buyurtma endi ko'rsatilgandek emas: to'langan, e'lon qilingan, o'chirilgan yoki muddati o'tgan.
const MOVED_ON = [
  'deposit_not_required',
  'deposit_already_paid',
  'deposit_off',
  'deposit_expired',
  'order_not_found',
];

const s = StyleSheet.create({
  box: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  compact: { padding: 12, borderRadius: 14, marginTop: 12 },
  title: { fontSize: 14.5, lineHeight: 20, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 13, fontWeight: '600' },
  btn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
