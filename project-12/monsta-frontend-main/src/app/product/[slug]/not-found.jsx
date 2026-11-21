import Link from 'next/link';
import './ProductDetail.css';

// Rendered by Next.js when the route segment's page calls notFound() - i.e. a slug that
// matches neither the API nor the hardcoded fallback list. Scoped to /product/[slug] so the
// storefront 404 stays branded and offers a route back into the catalogue.
export default function ProductNotFound() {
  return (
    <main>
      <section className="product_not_found">
        <div className="container">
          <div className="product_not_found_inner">
            <i className="fa fa-search" aria-hidden="true"></i>

            <h2>Product not found</h2>

            <p>
              We could not find the product you are looking for. It may have been
              removed, or the link may be incorrect.
            </p>

            <div className="product_not_found_actions">
              <Link href="/shop" className="btn_default">
                Continue Shopping
              </Link>
              <Link href="/" className="btn_default btn_secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
