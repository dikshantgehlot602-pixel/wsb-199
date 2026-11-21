'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './HeroSlider.css';

// Image-only hero slides, matching the reference: the reference's own
// .slider_content is present but fully commented out, so each slide shows
// only its background image. Images and slide order are unchanged.
const slides = [
  {
    bg: '/images/banner1.jpg',
    alt: 'Modern wooden sofa and living room furniture',
  },
  {
    bg: '/images/banner2.jpg',
    alt: 'Elegant dining tables and chairs',
  },
  {
    bg: '/images/banner3.jpg',
    alt: 'Cozy bedroom furniture and decor',
  },
];

export default function HeroSlider() {
  return (
    <section className="slider_area">
      <Swiper
        modules={[EffectFade, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={250}
        loop
        pagination={{ clickable: true }}
        className="hero_swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.bg}>
            <div
              className="single_slider"
              role="img"
              aria-label={slide.alt}
              style={{ backgroundImage: `url('${slide.bg}')` }}
            >
              <div className="container">
                <div className="row align-items-center">
                  <div className="col-12">
                    {/* Kept (empty) because the theme's .single_slider .row
                        height and .slider_content geometry depend on this
                        wrapper. The reference's own hero copy is commented
                        out, so each slide shows only its background image. */}
                    <div className="slider_content"></div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
