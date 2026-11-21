import Link from 'next/link';
import ProductCard from './Common/ProductCard';
import './CollectionListing.css';

// Shared server component for the tag-based collection pages
// (/on-sale, /best-selling, /trending-collections, /top-rated).
// Renders the theme breadcrumb header, a dynamic product count and a
// responsive ProductCard grid. No client state, no invented data —
// the caller decides which products belong in the collection.
export default function CollectionListing({ title, products }) {
  const total = products.length;

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
                  <li>{title}</li>
                </ul>
                <h3>{title}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop_area">
        <div className="container">
          {/* Toolbar */}
          <div className="shop_toolbar">
            <div className="page_amount">
              <p>
                {total === 0
                  ? 'No products found'
                  : total === 1
                  ? 'Showing 1 product'
                  : `Showing all ${total} products`}
              </p>
            </div>
          </div>

          {/* Grid / empty state */}
          {total === 0 ? (
            <div className="shop_empty">
              <p>No products found in this collection.</p>
              <Link href="/shop" className="shop_empty_btn">Back to Shop</Link>
            </div>
          ) : (
            <div className="row">
              {products.map((product) => (
                <div key={product.id} className="col-12 col-md-6 col-lg-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
