
import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  return [];
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  redirect(`/en/products/${params.id}`);
}
