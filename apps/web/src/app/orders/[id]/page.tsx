
import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // Return empty array since these are redirect pages
  return [];
}

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  redirect(`/en/orders/${params.id}`);
}
