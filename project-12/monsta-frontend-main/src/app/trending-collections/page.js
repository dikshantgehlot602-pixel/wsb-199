import { products } from '@/data/products';
import CollectionListing from '../components/CollectionListing';

export const metadata = {
  title: 'Trending Collections - Online Furniture in India',
  description: 'Trending furniture collections — our newest arrivals across tables, sofas and storage.',
};

// The site's "new arrivals" set (same tag the homepage New Arrivals tab uses).
// No invented products — strictly tag === 'arrivals'.
const trendingProducts = products.filter((p) => p.tag === 'arrivals');

export default function TrendingCollectionsPage() {
  return <CollectionListing title="Trending Collections" products={trendingProducts} />;
}
