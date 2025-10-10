import {getRequestConfig} from 'next-intl/server';

export const locales = ['th'];
export const defaultLocale = 'th';

export default getRequestConfig(async ({ locale }) => {
  const resolved = locales.includes(locale as string) ? (locale as string) : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default
  };
});
