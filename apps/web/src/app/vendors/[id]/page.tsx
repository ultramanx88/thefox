
import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  return [];
}

export default function VendorProfilePage({ params }: { params: { id: string } }) {
  redirect(`/en/vendors/${params.id}`);
}
