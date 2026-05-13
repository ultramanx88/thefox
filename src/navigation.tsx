import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import React from 'react';

export const usePathname = () => {
  const location = useLocation();
  return location.pathname;
};

export const useRouter = () => {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
  };
};

export const Link = ({ href, children, ...props }: any) => {
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
};
