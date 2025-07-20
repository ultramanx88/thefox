
import { redirect } from 'next/navigation';

export default function DeliveryJobRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/th/delivery/${params.id}`);
}
