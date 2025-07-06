
import { redirect } from 'next/navigation';

// This page just redirects to the default locale.
export default function Home() {
  redirect('/en');
}
