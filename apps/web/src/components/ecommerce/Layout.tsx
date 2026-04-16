import { EcommerceHeader } from './Header';
import { EcommerceFooter } from './Footer';
import LiveChat from '../LiveChat';

interface LayoutProps {
  children: React.ReactNode;
}

export function EcommerceLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <EcommerceHeader />
      <main className="flex-1">
        {children}
      </main>
      <EcommerceFooter />
      <LiveChat />
    </div>
  );
}