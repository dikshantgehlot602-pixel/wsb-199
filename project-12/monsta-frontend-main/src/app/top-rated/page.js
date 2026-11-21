import { products } from '@/data/products';
import CollectionListing from '../components/CollectionListing';

export const metadata = {
  title: 'Top Rated - Online Furniture in India',
  description: 'Browse the top rated furniture collection — our full range of tables, sofas, mirrors and storage.',
};

// The reference /top-rated page lists the (near) full catalogue in default
// order, and neither the reference nor our data contains rating fields —
// so this page shows all existing products with no invented ratings.
export default function TopRatedPage() {
  return <CollectionListing title="Top Rated" products={products} />;
}
