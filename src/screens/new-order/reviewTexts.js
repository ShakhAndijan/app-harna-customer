// Tasdiqlash oynasidagi qiymatlarning ko'rinadigan matnlari.

import { formatMoney, formatWhenDate } from './utils';
import { windowLabel } from '../requests/arrival';
import { amountText } from './platformPrice';

export default function getReviewTexts(
  {
    when,
    whenDate,
    whenWindow,
    minRating,
    minExperience,
    pricingType,
    hourlyRate,
    estimatedHours,
    fixedPrice,
    paymentMethod,
    street,
    mahalla,
    entrance,
    floor,
    addressTitle,
    addressSubtitle,
    quote,
  },
  tr
) {
  const notSet = tr('newOrder.review.notSet');

  const dayText =
    when === 'urgent'
      ? tr('newOrder.when.urgent')
      : when === 'today'
        ? tr('newOrder.when.today')
        : when === 'date'
          ? whenDate
            ? formatWhenDate(whenDate)
            : tr('newOrder.when.date')
          : when === 'flexible'
            ? tr('newOrder.when.flexible')
            : notSet;
  // Kelish oralig'i kun yoniga: "Bugun · 10:00–11:00".
  const range = whenWindow ? windowLabel(whenWindow, null, null) : null;
  const whenText = range ? `${dayText} · ${range}` : dayText;

  const ratingText = minRating === 0 ? tr('newOrder.requirements.allRatings') : `${minRating}+ ★`;

  const experienceText = minExperience
    ? tr('newOrder.requirements.experienceYears', { n: minExperience })
    : tr('newOrder.requirements.allRatings');

  const som = tr('common.currencySom');
  // Narxni platforma belgilagan buyurtma: "O'zgarmas narx: 150 000 so'm" (viloyatga qarab oraliq bo'lishi ham mumkin).
  const pricingText =
    quote?.kind === 'priced'
      ? `${tr('platformPrice.label')}: ${amountText(tr, quote)}`
      : pricingType === 'hourly'
        ? hourlyRate.trim() || estimatedHours.trim()
          ? `${formatMoney(hourlyRate.trim()) || '—'} ${som} × ${estimatedHours.trim() || '—'} ${tr('newOrder.pricing.hoursPlaceholder').toLowerCase()}`
          : notSet
        : fixedPrice.trim()
          ? `${formatMoney(fixedPrice.trim())} ${som}`
          : notSet;

  const paymentText =
    paymentMethod === 'cash' ? tr('newOrder.payment.cash') : tr('newOrder.payment.cashless');

  const addressDetails = [street, mahalla, entrance, floor].filter((v) => v && v.trim()).join(', ');
  const addressText =
    [addressTitle, addressSubtitle || addressDetails].filter(Boolean).join(' — ') || notSet;

  return {
    notSet,
    whenText,
    ratingText,
    experienceText,
    pricingText,
    paymentText,
    addressText,
  };
}
