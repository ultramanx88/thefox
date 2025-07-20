import {createNavigation} from 'next-intl/navigation';
import {locales} from './i18n';

export const {Link, getPathname, redirect, usePathname, useRouter} =
  createNavigation({
    locales,
    pathnames: {
      '/': '/',
      '/register/vendor': '/register/vendor',
      '/register/shopper': '/register/shopper',
      '/account/orders': '/account/orders',
      '/vendor': '/vendor',
      '/driver/jobs': '/driver/jobs',
      '/driver/academy': '/driver/academy',
      '/driver/settings': '/driver/settings',
      '/admin': '/admin',
    },
  });
