'use client';

import Link from 'next/link';
import Image from 'next/image';
import ImageWithSkeleton from './ImageWithSkeleton';
import { products } from '@/data/products';
import './Footer.css';

// The reference footer uses these two products for its Top Rated widget.
const topRatedIds = new Set([1, 11]);
const topRated = products.filter((product) => topRatedIds.has(product.id));

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export default function Footer() {
  return (
    <footer className="footer_widgets footer_other">
      <div className="container">
        <div className="footer_top">
          <div className="row">
            <div className="col-lg-4 col-md-6 col-sm-8">
              <div className="widgets_container contact_us">
                <h3>Contact Us</h3>
                <div className="footer_contact">
                  <p>Address: Claritas est etiam processus dynamicus</p>
                  <p>Phone: <a href="tel:98745612330">98745612330</a></p>
                  <p>Email: furniture@gmail.com</p>
                  <ul>
                    <li><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fa fa-facebook"></i></a></li>
                    <li><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa fa-instagram"></i></a></li>
                    <li><a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><i className="fa fa-twitter"></i></a></li>
                    <li><a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><i className="ion-social-youtube"></i></a></li>
                    <li><a href="https://telegram.com" target="_blank" rel="noreferrer" aria-label="Telegram"><i className="fa fa-telegram"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-4 col-6">
              <div className="widgets_container widget_menu">
                <h3>Information</h3>
                <div className="footer_menu">
                  <ul>
                    <li><Link href="/about-us">About Us</Link></li>
                    <li><Link href="/contact">Contact Us</Link></li>
                    <li><Link href="/frequently-questions">Frequently Questions</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-5 col-6">
              <div className="widgets_container widget_menu">
                <h3>My Account</h3>
                <div className="footer_menu">
                  <ul>
                    <li><Link href="/my-dashboard">My Dashboard</Link></li>
                    <li><Link href="/wishlist">Wishlist</Link></li>
                    <li><Link href="/cart">Cart</Link></li>
                    <li><Link href="/checkout">Checkout</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-7">
              <div className="widgets_container product_widget">
                <h3>Top Rated Products</h3>
                <div className="simple_product">
                  {topRated.map((product) => (
                    <div className="simple_product_items" key={product.id}>
                      <div className="simple_product_thumb">
                        <Link href={`/product/${product.slug}`}>
                          <ImageWithSkeleton src={product.image} alt={product.name} width={80} height={80} />
                        </Link>
                      </div>
                      <div className="simple_product_content">
                        <div className="tag_cate">
                          <Link href={`/product/${product.slug}`}>{product.category}</Link>
                        </div>
                        <div className="product_name">
                          <h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3>
                        </div>
                        <div className="product_price">
                          {product.oldPrice && <span className="old_price">Rs. {formatPrice(product.oldPrice)}</span>}
                          <span className="current_price">Rs. {formatPrice(product.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer_bottom">
          <div className="row">
            <div className="col-12">
              <div className="copyright_area">
                <p>All Rights Reserved By Furniture | © 2026</p>
                <Image src="/images/papyel2.png" alt="payment methods" width={200} height={30} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}