import { products } from '@/data/products';
import CollectionListing from '../components/CollectionListing';

export const metadata = {
  title: 'On Sale - Online Furniture in India',
  description: 'Furniture currently on sale — browse our discounted tables, sofas and more.',
};

// Products flagged on-sale in the existing data. No invented items,
// no price manipulation — strictly tag === 'onsale'.
const onSaleProducts = products.filter((p) => p.tag === 'onsale');

export default function OnSalePage() {
  return <CollectionListing title="On Sale" products={onSaleProducts} />;
}
