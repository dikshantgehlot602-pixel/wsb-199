import Link from 'next/link';
import { products } from '@/data/products';
import ProductCard from '../components/Common/ProductCard';
import './page.css';

export const metadata = {
  title: 'Product Search - Online Furniture in India',
  description: 'Search our furniture catalogue for tables, sofas, mirrors and more.',
};

// Case-insensitive search over the real product fields (name, category, slug).
function searchProducts(term) {
  const q = term.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
  );
}

export default async function ProductSearchPage({ searchParams }) {
  const params = await searchParams;
  const raw = typeof params.search === 'string' ? params.search : '';
  const term = raw.trim();
  const sort = typeof params.sort === 'string' ? params.sort : 'default';

  let result = term ? searchProducts(term) : [...products];

  switch (sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'default':
    default:
      break;
  }

  const total = products.length;
  const shown = result.length;

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A-Z' },
  ];

  // Preserve the search term when switching sort options.
  const withSort = (value) =>
    `/product-search?${[
      term ? `search=${encodeURIComponent(term)}` : '',
      `sort=${value}`,
    ].filter(Boolean).join('&')}`;

  return (
    <main>
      {/* Breadcrumb */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li>Product Search</li>
                </ul>
                <h3>Product Search</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop_area">
        <div className="container">
          <div className="row">
            {/* Main listing (search results are a full-width listing) */}
            <div className="col-12">
              {/* Toolbar */}
              <div className="shop_toolbar">
                <div className="page_amount">
                  <p>
                    {!term
                      ? `Showing all ${total} products`
                      : shown === 0
                      ? 'No products found'
                      : `Showing ${shown} of ${total} results`}
                  </p>
                </div>
                <div className="orderby_wrapper">
                  <h3>Sort by</h3>
                  <ul className="shop_sort_list">
                    {sortOptions.map((opt) => (
                      <li key={opt.value} className={sort === opt.value ? 'active' : ''}>
                        <Link href={withSort(opt.value)}>{opt.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Grid / no-results state */}
              {term && shown === 0 ? (
                <div className="shop_empty">
                  <p>No products found for &ldquo;{term}&rdquo;</p>
                  <Link href="/shop" className="shop_empty_btn">Back to Shop</Link>
                </div>
              ) : (
                <div className="row">
                  {result.map((product) => (
                    <div key={product.id} className="col-12 col-md-6 col-lg-4">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
