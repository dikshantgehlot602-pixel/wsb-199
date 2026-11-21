'use client';

import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import ProductCard from '../components/Common/ProductCard';
import Skeleton from '../components/Common/Skeleton';
import './page.css';

export default function WishlistPage() {
  const { wishlist, isHydrated } = useWishlist();

  return (
    <main>
      {/* Page header / breadcrumb */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li>My Wishlist</li>
                </ul>
                <h3>My Wishlist</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wishlist body */}
      <section className="wishlist_area">
        <div className="container">
          {!isHydrated ? (
            <Skeleton variant="product-card" count={4} />
          ) : wishlist.length === 0 ? (
            <div className="wishlist_empty">
              <p className="wishlist_empty_text">Your wishlist is empty!</p>
              <p className="wishlist_empty_sub">
                Browse our collection and tap the heart on any product to save it here.
              </p>
              <Link href="/shop" className="wishlist_empty_btn">
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="row">
              {wishlist.map((product) => (
                <div key={product.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                  <ProductCard product={product} variant="grid" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}