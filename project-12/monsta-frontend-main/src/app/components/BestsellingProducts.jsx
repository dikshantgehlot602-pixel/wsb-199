'use client';

import { useEffect, useRef, useState } from 'react';
import { products, bestSellingSlugs } from '@/data/products';
import { fetchProducts } from '@/lib/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import './BestsellingProducts.css';
import ProductCard from './Common/ProductCard';
import Skeleton from './Common/Skeleton';

// The reference homepage's Bestselling carousel shows the first 10 items of
// the best-selling order. This hardcoded order is now the FALLBACK only -- the
// live list comes from the API (`is_best_sellings: 1`). Slugs are resolved
// against the product data and any unmatched slug is filtered out, so a
// missing product can never be rendered as `undefined`.
const fallbackBestSellingProducts = bestSellingSlugs
  .slice(0, 10)
  .map((slug) => products.find((product) => product.slug === slug))
  .filter(Boolean);

export default function BestsellingProducts() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // `null` means the request is in flight; an empty array means use the
  // hardcoded fallback after the request completes without products.
  const [apiProducts, setApiProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const list = await fetchProducts({ is_best_sellings: 1 });

        if (!cancelled) {
          // The carousel is capped at 10 products; an empty list selects fallback.
          setApiProducts(Array.isArray(list) ? list.slice(0, 10) : []);
        }
      } catch (error) {
        console.error('Failed to load bestselling products:', error);
        if (!cancelled) {
          setApiProducts([]);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Carousel holds 10 cards and shows 5 per view.
  const bestSellingProducts = apiProducts?.length
    ? apiProducts
    : fallbackBestSellingProducts;

  return (
    <section className="bestselling_section">
      <div className="container">

        {/* ── Section header ── */}
        <div className="bestselling_header">
          <h2 className="bestselling_title">Bestselling Products</h2>
          <div className="carousel_nav">
            <button
              type="button"
              className="carousel_arrow prev_arrow"
              ref={prevRef}
              aria-label="Previous products"
            >
              <i className="fa fa-angle-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="carousel_arrow next_arrow"
              ref={nextRef}
              aria-label="Next products"
            >
              <i className="fa fa-angle-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div className="bestselling_carousel_wrapper">
          {apiProducts === null ? (
            <Skeleton variant="product-card" count={5} />
          ) : (
          <Swiper
            className="bestselling_swiper"
            modules={[Navigation]}
            slidesPerView={5}
            slidesPerGroup={1}
            spaceBetween={20}
            speed={400}
            loop
            breakpoints={{
              0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 15 },
              481: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 15 },
              768: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 15 },
              992: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 10 },
              1200: { slidesPerView: 5, slidesPerGroup: 1, spaceBetween: 10 },
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
            {bestSellingProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} variant="carousel" />
              </SwiperSlide>
            ))}
          </Swiper>
          )}
        </div>

      </div>
    </section>
  );
}
