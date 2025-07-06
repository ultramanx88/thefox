import {notFound} from 'next/navigation';
import {getLocale, getRequestConfig} from 'next-intl/server';
 
export const locales = ['en', 'th', 'zh'];

export default getRequestConfig(async () => {
  const locale = await getLocale();
 
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    notFound();
  }
 
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
