import { depositDue } from './utils';
import DepositPayStep from './DepositPayStep';
import DepositState from './DepositState';

// Buyurtmadagi mijozning omonati: to'lanishi kerak bo'lsa to'lov qadami, so'ng omonat qayerda turgani.
export default function DepositNotice({ order, onChanged }) {
  if (!order?.deposit) return null;
  if (depositDue(order)) return <DepositPayStep order={order} onChanged={onChanged} />;
  return <DepositState deposit={order.deposit} />;
}
