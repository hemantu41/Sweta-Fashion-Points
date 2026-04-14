// Server component — fetches category data, passes to client row components
import { getNavbarCategories } from '@/lib/navbar';
import NavRow1 from './NavRow1';
import NavRow2 from './NavRow2';

export default async function Navbar() {
  const categories = await getNavbarCategories();

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <NavRow1 />
      <NavRow2 categories={categories} />
    </header>
  );
}
