'use client';

import ImageWithSkeleton from './ImageWithSkeleton';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './ProductCard.css';

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export default function ProductCard({ product, variant = 'grid' }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLoggedIn = useSelector((state) => Boolean(state.login.value));
  const isCarousel = variant === 'carousel';
  const isWishlisted = isInWishlist(product.id);

  return (
    <div className={`product_card${isCarousel ? ' carousel_card' : ''}`}>

      {/* Image */}
      <div className="product_image_wrapper">
        <Link href={`/product/${product.slug}`} className="product_image_link">
          {isCarousel ? (
            <ImageWithSkeleton
              src={product.image}
              alt={product.name}
              className="product_image"
            />
          ) : (
            <ImageWithSkeleton
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 576px) 100vw, (max-width: 991px) 50vw, 25vw"
              className="product_image"
              style={{ objectFit: 'cover' }}
            />
          )}
        </Link>
      </div>

      {/* Text + actions */}
      <div className="product_details">

        <div className="product_category">
          <a>{product.category}</a>
        </div>

        <h3 className="product_title">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="product_pricing">
          <span className="old_price">Rs. {formatPrice(product.oldPrice)}</span>
          <span className="new_price">Rs. {formatPrice(product.price)}</span>
        </div>

        {/*
          Spacer div — pushes the action row to the card bottom.
          Named class "product_spacer" so it is not affected by any
          global .product_* rules in style.css.
        */}
        <div className="product_spacer" />

        {/*
          product_actions uses display:flex !important in CSS.
          The parent selector .product_card .wishlist_btn / .cart_btn
          overrides style.css `.product_container button { display:none !important }`.
        */}
        <div className="product_actions">
          <button
            className={`wishlist_btn${isWishlisted ? ' active' : ''}`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-pressed={isWishlisted}
            onClick={(e) => {
              // Prevent the toggle from bubbling up to the product card
              // link and navigating to the product page.
              e.preventDefault();
              e.stopPropagation();
              if (!isLoggedIn) {
                toast.info('Please login to continue');
                return;
              }
              toggleWishlist(product);
            }}
          >
            {isWishlisted ? (
              <svg
                viewBox="0 0 512 512"
                aria-hidden="true"
                className="wishlist_icon wishlisted"
              >
                <path
                  fill="currentColor"
                  d="M462.3 62.6c-54.5-46.4-136-38.7-186.6 13.8L256 96.4l-19.7-20C185.7 23.9 104.2 16.2 49.7 62.6-16.6 119-20.4 220.5 38.5 281.4l187.5 193.1c16.5 17 43.4 17 59.9 0l187.5-193.1c58.9-60.9 55.1-162.4-11.1-218.8z"
                />
              </svg>
            ) : (
              <img
                src="/images/heart-regular.svg"
                alt=""
                aria-hidden="true"
                className="wishlist_icon"
              />
            )}
          </button>

          <button
            className="cart_btn"
            title="Add to cart"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
          >
            Add To Cart
          </button>
        </div>

      </div>
    </div>
  );
}
