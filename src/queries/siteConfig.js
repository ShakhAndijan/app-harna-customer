import { useQuery } from '@tanstack/react-query';
import { getSiteConfig } from '../api/siteConfig';
import { SUPPORT_CONTACT } from '../constants/config';
import { listOf, socialHref } from '../utils/siteLinks';

/** Saytning ochiq sozlamalari (`config.json`); yuklanguncha `data` — `undefined`. */
export const useSiteConfig = () =>
  useQuery({ queryKey: ['site-config'], queryFn: getSiteConfig, staleTime: 30 * 60 * 1000 });

/**
 * Qo'llab-quvvatlash aloqasi: saytning `config.json` qiymati, u yo'q yoki yuklanmagan bo'lsa —
 * `SUPPORT_CONTACT` zaxirasi. `telegram` — ochiladigan manzil (yoki `null`), `telegramLabel` — ko'rsatiladigan matn.
 */
export function useSupportContact() {
  const config = useSiteConfig().data;
  const telegramRaw = config?.social?.telegram || SUPPORT_CONTACT.telegram;
  return {
    phone: config?.contact?.phone || SUPPORT_CONTACT.phone || '',
    email: listOf(config?.contact?.email)[0] || SUPPORT_CONTACT.email || '',
    telegram: socialHref('telegram', telegramRaw),
    telegramLabel: telegramRaw || '',
  };
}
