'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import './ProductSlider.css';
import ProductCard from './ProductCard';

/**
 * Reusable product carousel: a heading, a horizontally scrolling track of product
 * cards and left/right arrow buttons.
 *
 * Built on Swiper (the same stack BestsellingProducts uses) so the arrows,
 * snapping and breakpoints behave like the rest of the site:
 *   - 5 cards per view on desktop, 4 / 3 / 2 / 1 on smaller screens
 *   - the arrows slide one card at a time and lock at either end (loop: false),
 *     so there is never a dead click and never a duplicated card
 *   - slides stretch their child so every card in the row is the same height
 *
 * Props:
 *   title      - heading text
 *   subtitle   - optional line under the heading
 *   products   - array of products (the caller decides how many, 10 is the norm)
 *   viewAllHref / viewAllLabel - optional "View All" link next to the arrows
 */
export default function ProductSlider({
  title,
  subtitle,
  products = [],
  viewAllHref,
  viewAllLabel = 'View All',
}) {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Nothing to slide - render no section at all (also keeps the page clean when a
  // product is the last one in the catalogue).
  if (products.length === 0) return null;

  return (
    <section className="product_slider_section">
      <div className="container">

        {/* ── Header: title (+ subtitle) on the left, view all + arrows on the right ── */}
        <div className="product_slider_header">
          <div className="product_slider_heading">
            <h2 className="product_slider_title">{title}</h2>
            {subtitle && <p className="product_slider_subtitle">{subtitle}</p>}
          </div>

          <div className="product_slider_nav">
            {viewAllHref && (
              <Link href={viewAllHref} className="product_slider_view_all">
                {viewAllLabel}
              </Link>
            )}

            <button
              type="button"
              className="product_slider_arrow prev_arrow"
              ref={prevRef}
              aria-label={`Previous products in ${title}`}
            >
              <i className="fa fa-angle-left" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="product_slider_arrow next_arrow"
              ref={nextRef}
              aria-label={`Next products in ${title}`}
            >
              <i className="fa fa-angle-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Track ── */}
        <div className="product_slider_wrapper">
          <Swiper
            className="product_slider_swiper"
            modules={[Navigation]}
            slidesPerView={5}
            slidesPerGroup={1}
            spaceBetween={20}
            speed={400}
            grabCursor
            loop={false}
            watchOverflow
            breakpoints={{
              0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 15 },
              481: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 15 },
              768: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 15 },
              992: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 15 },
              1200: { slidesPerView: 5, slidesPerGroup: 1, spaceBetween: 20 },
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              if (typeof swiper.params.navigation !== 'boolean') {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
            }}
            onInit={(swiper) => {
              if (typeof swiper.params.navigation !== 'boolean') {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }
              swiper.navigation.init();
              swiper.navigation.update();
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} variant="carousel" />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </section>
  );
}
