import { useEffect, useState } from 'react';
import { AppState, View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import * as Linking from 'expo-linking';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { appAlert } from '../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatNumber } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import { ApiError } from '../utils/request';
import {
  addFinalComment,
  confirmOrderStage,
  createOrderPayment,
  getOrderStages,
  getPaymentProviders,
} from '../api/orders';
import useOrderDetail from './orders/hooks/useOrderDetail';
import { STATUS_META, statusLabel, statusSubtext } from './orders/constants';
import OrderDetailHeader from './orders/components/OrderDetailHeader';
import StatusBanner from './orders/components/StatusBanner';
import OrderSummary from './orders/components/OrderSummary';
import SectionLabel from './orders/components/SectionLabel';
import MasterCard from './orders/components/MasterCard';
import CancelReasonCard from './orders/components/CancelReasonCard';
import PriceCard from './orders/components/PriceCard';
import PhotoGallery from './orders/components/PhotoGallery';
import { MasterNoteCard, CustomerReviewCard } from './orders/components/NoteCard';
import OrderActions from './orders/components/OrderActions';
import ContactsCard from './orders/components/ContactsCard';
import StagesCard from './orders/components/StagesCard';
import ExtrasList from './orders/components/ExtrasList';
import EstimateCard from './orders/components/EstimateCard';
import PayCard from './orders/components/PayCard';
import PaymentResult from './orders/components/PaymentResult';
import OrderHistory, { historyRows } from './orders/components/OrderHistory';
import GuaranteeCard from './orders/components/GuaranteeCard';
import DescriptionCard from './orders/components/DescriptionCard';
import PromptModal from './requests/components/PromptModal';
import RepostModal from './requests/components/RepostModal';
import RateOrderModal from './orders/components/RateOrderModal';
import useOrderActions from './requests/hooks/useOrderActions';
import { isOpenOrder } from './requests/utils';
import useBottomInset from '../hooks/useBottomInset';

const PROVIDER_LABEL = { payme: 'Payme', click: 'Click' };

// Buyurtma tafsiloti: usta reytingi va yakuniy izohlar backend javobidan (`worker`,
// `worker_final_comment`, `customer_final_comment`) olinadi.
export default function OrderDetailScreen({ order: listOrder, onBack, onSelectUsta, onReorder }) {
  const bottomInset = useBottomInset();
  const { theme: t } = useTheme();
  const { t: tr, language } = useLanguage();
  const { order, refresh } = useOrderDetail(listOrder);
  const actions = useOrderActions(listOrder.id, refresh);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  // Hozirgina berilgan yulduzlar: tafsilot javobida `worker_rating` yo'q, shuning uchun lokal saqlanadi.
  const [ratedStars, setRatedStars] = useState(null);
  const queryClient = useQueryClient();
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  // 409 order_payments_off: server onlayn ish to'lovini o'chirgan — karta yashiriladi (naqd qoladi).
  const [paymentsOff, setPaymentsOff] = useState(false);

  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(0);

  const meta = STATUS_META[order.status] || STATUS_META.active;
  const label = statusLabel(tr, order);
  const isCancelled = order.status === 'cancelled';
  const isDone = order.status === 'done';
  const canRate = isDone && !!order.workerId && !order.workerRated && ratedStars == null;
  const shownRating = order.givenRating ?? ratedStars;
  const canComment = isDone && !order.customerFinalComment;

  // Ish bosqichlari (usta tayinlangach); xato bo'lsa bo'lim ko'rsatilmaydi.
  const stagesQuery = useQuery({
    queryKey: ['orders', 'stages', order.id],
    queryFn: () => getOrderStages(order.id),
    enabled: order.workerId != null && !isCancelled,
  });
  const stages = stagesQuery.data ?? [];

  // Onlayn to'lov: server yoqqan tizimlar bo'sh bo'lsa tugma ko'rsatilmaydi.
  const providersQuery = useQuery({
    queryKey: ['payments', 'providers'],
    queryFn: getPaymentProviders,
    staleTime: 10 * 60 * 1000,
    enabled: isDone,
  });
  const providers = providersQuery.data?.providers ?? [];
  const minAmount = providersQuery.data?.minAmount;
  const maxAmount = providersQuery.data?.maxAmount;
  // To'lov summasi qo'shimcha ishlarni ham o'z ichiga oladi (jami narx).
  const payAmount = order.totalPrice ?? order.agreedPrice ?? order.price;
  // Tizimlar ro'yxati yuklangach karta ko'rinadi; bo'sh bo'lsa "ulanmagan" izohi, summa chegaradan
  // tashqarida bo'lsa chegara raqami bilan izoh chiqadi (tugma ishlamaydi).
  const showPay =
    isDone &&
    order.paymentStatus === 'not_charged' &&
    payAmount > 0 &&
    providersQuery.isSuccess &&
    !paymentsOff;
  const payBlockedNote = providers.length === 0 ? tr('orderDetail.payNotConnected') : null;

  // To'lov sahifasidan (Click/Payme) ilova oldingi planga qaytganda holat qayta o'qiladi: Payme
  // to'lovchini ilovaga qaytarmaydi, Click esa harna://order/{id} orqali qaytaradi.
  const awaitingPayment = isDone && order.paymentStatus === 'not_charged';
  useEffect(() => {
    if (!awaitingPayment) return undefined;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        refresh().catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    });
    return () => sub.remove();
  }, [awaitingPayment, refresh, queryClient]);

  const confirmStage = async (stage) => {
    if (confirmingId != null) return;
    setConfirmingId(stage.id);
    try {
      await confirmOrderStage(order.id, stage.id);
    } catch (e) {
      appAlert(tr('common.errorTitle'), getErrorMessage(e, tr, 'common.error'));
    } finally {
      setConfirmingId(null);
      stagesQuery.refetch();
    }
  };

  const payErrorMessage = (e) => {
    if (e instanceof ApiError) {
      if (e.code === 'order_payments_off') return getErrorMessage(e, tr, 'orderDetail.payOff');
      // Tizim tranzaksiyani yaqinda ochgan: boshqa summa/tizim qabul qilinmaydi. Qayta urinish
      // tsikli yo'q; karta ham yopilmaydi (12 soat qachon tugashini ilova bilmaydi).
      if (e.code === 'payment_in_progress') {
        return getErrorMessage(e, tr, 'orderDetail.payInProgress');
      }
    }
    return getErrorMessage(e, tr, 'orderDetail.payFailed');
  };

  const startPayment = async (provider, amountUzs) => {
    setPayBusy(true);
    try {
      const payment = await createOrderPayment(order.id, {
        amountUzs,
        provider,
        locale: language,
      });
      const url = payment.checkoutUrl;
      if (url) {
        // Click havolasi (oxirida "/") Click ilovasi o'rnatilgan bo'lsa shu ilovada, aks holda
        // brauzerda ochiladi; tugagach server harna://order/{id} ga qaytaradi. Payme havolasida
        // qaytish manzili yo'q: ilova ichidagi brauzerda ochiladi, to'lovchi o'zi qaytadi.
        if (provider === 'click' || /(^|\.)click\.uz\//.test(url.replace(/^https?:\/\//, ''))) {
          await Linking.openURL(url);
        } else {
          await WebBrowser.openBrowserAsync(url);
        }
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === 'order_payments_off') setPaymentsOff(true);
      appAlert(tr('common.errorTitle'), payErrorMessage(e));
    } finally {
      setPayBusy(false);
      // To'lov sahifasidan qaytgach (yoki xatoda) holatni serverdan qayta o'qiymiz.
      refresh().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  };

  const pay = (amountUzs) => {
    if (providers.length <= 1) {
      startPayment(providers[0], amountUzs);
      return;
    }
    appAlert(tr('orderDetail.payChoose'), undefined, [
      ...providers.map((p) => ({
        text: PROVIDER_LABEL[p] ?? p,
        onPress: () => startPayment(p, amountUzs),
      })),
      { style: 'cancel' },
    ]);
  };

  const title = order.taskNames || order.service || tr('orderDetail.orderNumber', { id: order.id });

  const beforePhotos = order.beforePhotos;
  // Bekor qilingan buyurtmada ish bajarilmagani uchun "keyin" rasmlari bo'lmaydi.
  const afterPhotos = isCancelled ? [] : order.afterPhotos;

  const share = () => {
    const vars = { id: order.id, task: title, status: label };
    const message =
      order.price != null
        ? tr('orderDetail.shareMessage', { ...vars, price: formatNumber(Math.round(order.price)) })
        : tr('orderDetail.shareMessageNoPrice', vars);
    // Buyurtma shaxsiy: faqat matn ulashiladi (ilova ichidagi havola boshqalarda ochilmaydi va SMS'da bosilmaydi).
    Share.share({ message }).catch(() => {});
  };

  const openUstaProfile = () => {
    if (!order.workerId) return;
    onSelectUsta?.({
      id: order.workerId,
      initial: order.letter,
      name: order.master,
      trade: order.service,
      bgColor: order.color,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <OrderDetailHeader onBack={onBack} onShare={share} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32 + bottomInset,
        }}
      >
        <StatusBanner meta={meta} label={label} subtext={statusSubtext(tr, order)} order={order} />
        <OrderSummary order={order} title={title} />
        <DescriptionCard text={order.description} style={{ marginTop: 12 }} />

        {/* Usta hali tayinlanmagan (kutilayotgan) buyurtmada bo'lim ko'rsatilmaydi */}
        {!!order.master && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.selectedMaster')}</SectionLabel>
            <MasterCard order={order} rating={order.workerRating} onPress={openUstaProfile} t={t} />
            <View style={{ marginTop: 12 }}>
              <ContactsCard order={order} />
            </View>
          </>
        )}

        {isCancelled && (!!order.cancelReason || !!order.cancelledBy) && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.cancelReasonTitle')}</SectionLabel>
            <CancelReasonCard
              meta={meta}
              reason={order.cancelReason}
              by={order.cancelledBy ? tr(`orderDetail.cancelledBy.${order.cancelledBy}`) : null}
            />
          </>
        )}

        {stages.length > 0 && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.stagesTitle')}</SectionLabel>
            <StagesCard
              stages={stages}
              confirmingId={confirmingId}
              onConfirm={confirmStage}
              t={t}
            />
          </>
        )}

        {order.extras.length > 0 && (
          <>
            <SectionLabel t={t}>{tr('extraWork.listTitle')}</SectionLabel>
            <ExtrasList extras={order.extras} t={t} />
          </>
        )}

        {order.estimate.length > 0 && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.estimateTitle')}</SectionLabel>
            <EstimateCard rows={order.estimate} t={t} />
          </>
        )}

        {!isCancelled && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.priceTitle')}</SectionLabel>
            <PriceCard order={order} t={t} />
          </>
        )}

        {isDone && (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') && (
          <View style={{ marginTop: 12 }}>
            <PaymentResult order={order} />
          </View>
        )}

        {showPay && (
          <View style={{ marginTop: 12 }}>
            <PayCard
              amount={payAmount}
              busy={payBusy}
              min={minAmount}
              max={maxAmount}
              blockedNote={payBlockedNote}
              processing={order.paymentState === 'created'}
              onPay={pay}
              t={t}
            />
          </View>
        )}

        {isDone && !!order.guarantee && (
          <View style={{ marginTop: 12 }}>
            <GuaranteeCard
              order={order}
              busy={actions.busy}
              onFile={actions.fileGuarantee}
              onCheck={actions.checkGuarantee}
            />
          </View>
        )}

        {historyRows(order).length > 0 && (
          <>
            <SectionLabel t={t}>{tr('orderHistory.title')}</SectionLabel>
            <OrderHistory order={order} />
          </>
        )}

        {beforePhotos.length > 0 && (
          <>
            <SectionLabel t={t}>
              {tr('orderDetail.beforePhotos', { n: beforePhotos.length })}
            </SectionLabel>
            <PhotoGallery
              photos={beforePhotos}
              index={beforeIndex}
              onIndexChange={setBeforeIndex}
              t={t}
            />
          </>
        )}

        {/* "Keyin" suratlari faqat bajarilgan buyurtmalarda bo'ladi */}
        {afterPhotos.length > 0 && (
          <>
            <SectionLabel t={t}>
              {tr('orderDetail.afterPhotos', { n: afterPhotos.length })}
            </SectionLabel>
            <PhotoGallery
              photos={afterPhotos}
              index={afterIndex}
              onIndexChange={setAfterIndex}
              t={t}
            />
          </>
        )}

        {isDone && !!order.workerFinalComment && !!order.master && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.masterNoteTitle')}</SectionLabel>
            <MasterNoteCard
              order={order}
              text={order.workerFinalComment}
              onPressMaster={openUstaProfile}
              t={t}
            />
          </>
        )}

        {isDone && (!!order.customerFinalComment || shownRating != null || canComment) && (
          <>
            <SectionLabel t={t}>{tr('orderDetail.yourReviewTitle')}</SectionLabel>
            {(!!order.customerFinalComment || shownRating != null) && (
              <CustomerReviewCard rating={shownRating} text={order.customerFinalComment} t={t} />
            )}
            {canComment && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  height: 46,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: t.orange + '88',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
                onPress={() => setCommentOpen(true)}
                accessibilityRole="button"
              >
                <Text style={{ color: t.orange, fontSize: 14, fontWeight: '800' }}>
                  {tr('orderDetail.finalCommentAdd')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <OrderActions
          isOpen={isOpenOrder(order)}
          onCancel={() => setCancelOpen(true)}
          onReorder={() => onReorder?.(order)}
          onRepost={isCancelled && !order.reposted ? () => setRepostOpen(true) : undefined}
          onRate={canRate ? () => setRateOpen(true) : undefined}
        />
      </ScrollView>

      <RateOrderModal
        visible={rateOpen}
        order={order}
        onClose={() => setRateOpen(false)}
        onRated={(stars) => {
          setRateOpen(false);
          setRatedStars(stars);
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          refresh().catch(() => {});
          appAlert(tr('orderDetail.rateThanks'));
        }}
      />

      <PromptModal
        visible={commentOpen}
        title={tr('orderDetail.finalCommentTitle')}
        hint={tr('orderDetail.finalCommentHint')}
        placeholder={tr('orderDetail.finalCommentPlaceholder')}
        confirmLabel={tr('orderDetail.finalCommentSend')}
        multiline
        maxLength={1000}
        busy={commentBusy}
        onClose={() => setCommentOpen(false)}
        onSubmit={async (comment) => {
          setCommentBusy(true);
          try {
            await addFinalComment(order.id, comment.trim());
            setCommentOpen(false);
            appAlert(tr('orderDetail.finalCommentThanks'));
          } catch (e) {
            appAlert(tr('common.errorTitle'), getErrorMessage(e, tr, 'common.error'));
          } finally {
            setCommentBusy(false);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            refresh().catch(() => {});
          }
        }}
      />

      <RepostModal
        visible={repostOpen}
        order={order}
        busy={actions.busy}
        onClose={() => setRepostOpen(false)}
        onSubmit={async (payload) => {
          if (await actions.repost(payload)) {
            setRepostOpen(false);
            appAlert(tr('orderFlow.stage.reposted'));
          }
        }}
      />
      <PromptModal
        visible={cancelOpen}
        title={tr('requests.cancelTitle')}
        placeholder={tr('requests.cancelReasonPlaceholder')}
        confirmLabel={tr('requests.cancelConfirm')}
        multiline
        destructive
        busy={actions.busy}
        onClose={() => setCancelOpen(false)}
        onSubmit={async (reason) => {
          if (await actions.cancel(reason)) setCancelOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
