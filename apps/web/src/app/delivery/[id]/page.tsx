
import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // Return empty array since these are redirect pages
  return [];
}

export default function DeliveryJobRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/th/delivery/${params.id}`);
}
