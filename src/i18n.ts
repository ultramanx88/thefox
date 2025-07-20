import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
export const locales = ['en', 'th', 'zh', 'ja', 'ko'];
 
export default getRequestConfig(async ({locale}) => {
  if (!locale || !locales.includes(locale)) notFound();

  return {
    locale: locale as string, // ให้แน่ใจว่า locale เป็น string เสมอ
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
