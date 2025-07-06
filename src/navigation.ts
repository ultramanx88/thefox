import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';
import {locales} from './i18n';

export const {Link, getPathname, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({
    locales,
    // No path-specific names are needed at this time
    pathnames: {},
  });
