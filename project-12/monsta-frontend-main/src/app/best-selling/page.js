import { products } from '@/data/products';
import CollectionListing from '../components/CollectionListing';

export const metadata = {
  title: 'Best Selling - Online Furniture in India',
  description: 'Our best selling furniture — the most popular tables, sofas and storage pieces.',
};

// The site's established "best selling" set (same tag the homepage's
// Bestselling section uses). No invented products — strictly tag === 'featured'.
const bestSellingProducts = products.filter((p) => p.tag === 'featured');

export default function BestSellingPage() {
  return <CollectionListing title="Best Selling" products={bestSellingProducts} />;
}
