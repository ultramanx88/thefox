
import { redirect } from 'next/navigation';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  redirect(`/en/products/${params.id}`);
}
