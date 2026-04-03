import { EcommerceLayout } from '@/components/ecommerce';
import { CartClient } from './CartClient';

export default function CartPage() {
  return (
    <EcommerceLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <CartClient />
      </div>
    </EcommerceLayout>
  );
}