
import { redirect } from 'next/navigation';

export default function OrderTrackingPage({ params }: { params: { id: string } }) {
  redirect(`/en/orders/${params.id}`);
}
