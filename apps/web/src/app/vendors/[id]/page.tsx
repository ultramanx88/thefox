
import { redirect } from 'next/navigation';

export default function VendorProfilePage({ params }: { params: { id: string } }) {
  redirect(`/en/vendors/${params.id}`);
}
