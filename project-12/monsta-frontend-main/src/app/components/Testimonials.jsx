'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { fetchTestimonials } from '@/lib/api';
import Skeleton from './Common/Skeleton';
import './Testimonial.css';

// Shown when the API returns nothing (or fails outright), so the section is never
// blank. Also used as the per-image fallback if an API image 404s.
const FALLBACK_TESTIMONIALS = [
  {
    text: "These guys have been absolutely outstanding. Perfect Themes and the best of all that you have many options to choose! Best Support team ever! Very fast responding! Thank you very much! I highly recommend this theme and these people!",
    img: "/images/testemonial.jpg",
    name: "Kathy Young",
    job: "CEO of SunPark",
  },
  {
    text:"These guys have been absolutely outstanding. Perfect Themes and the best of all that you have many options to choose! Best Support team ever! Very fast responding! Thank you very much! I highly recommend this theme and these people!",
    img: "/images/testimonial2.jpg",
    name: "Kathy Young",
    job: "CEO of SunPark",
  },
  {
    text:"These guys have been absolutely outstanding. Perfect Themes and the best of all that you have many options to choose! Best Support team ever! Very fast responding! Thank you very much! I highly recommend this theme and these people!",
    img: "/images/testimonial3.png",
    name: "Kathy Young",
    job: "CEO of SunPark",
  },
];

// Avatar used when a testimonial has no image, or the image fails to load, so a
// broken upload cannot leave a broken image icon in the slider.
const PLACEHOLDER_AVATAR = '/images/testemonial.jpg';

// Props keep the Home page rendering byte-identical:
// - title: overrides the heading (About Us copies the reference's own typo)
// - squareAvatar / avatarHeight: the reference renders its testimonial image
//   with inline height:100px and no border-radius
// - showRatings: the reference About Us slide includes a 5-star
//   .product_ratting block; Home does not
export default function Testimonials({
  title = "What Our Customers Say ?",
  squareAvatar = false,
  avatarHeight = 100,
  showRatings = false,
}) {
  // `null` = loading; an empty list after completion means use the fallback.
  const [testimonials, setTestimonials] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadTestimonials = async () => {
      try {
        const items = await fetchTestimonials();
        if (!cancelled) {
          setTestimonials(items.length > 0 ? items : []);
        }
      } catch (error) {
        console.error('Failed to load testimonials:', error);
        if (!cancelled) {
          setTestimonials([]);
        }
      }
    };

    loadTestimonials();

    return () => {
      cancelled = true;
    };
  }, []);

  const list = testimonials && testimonials.length > 0
    ? testimonials
    : FALLBACK_TESTIMONIALS;

  return (
    <div className="testimonial_are mt-5">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="testimonial_titile">
              <h1>{title}</h1>
            </div>
          </div>

          <div className="col-12">
            {testimonials === null ? (
              <Skeleton variant="testimonial" count={3} />
            ) : (
              <>
                <Swiper
                  modules={[Pagination]}
                  pagination={{
                    clickable: true,
                    el: '.testimonial_dots',
                  }}
                  loop={false}
                  spaceBetween={30}
                  className="testimonial_active"
                >
                  {list.map((t, idx) => {
                    // The API supplies a real 1-5 rating; the hardcoded fallback has none,
                    // so it keeps the reference's full 5 stars.
                    const rating = Math.max(0, Math.min(5, Number(t.rating) || 5));

                    return (
                      <SwiperSlide key={t.id || idx}>
                        <div className="single_testimonial">
                          <p>{t.text || t.message}</p>
                          <img
                            src={t.img || t.image || PLACEHOLDER_AVATAR}
                            alt={t.name}
                            height={avatarHeight}
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                            style={{
                              height: `${avatarHeight}px`,
                              width: squareAvatar ? 'auto' : undefined,
                              maxWidth: '100%',
                              borderRadius: squareAvatar ? 0 : '50%',
                              margin: '0 auto 15px',
                              display: 'block',
                            }}
                          />
                          <span className="name">{t.name}</span>
                          {t.job && <span className="job_title">{t.job}</span>}
                          {showRatings && (
                            <div className="product_ratting">
                              <ul>
                                {Array.from({ length: 5 }).map((_, star) => (
                                  <li key={star}>
                                    <i className={star < rating ? 'fa fa-star' : 'fa fa-star-o'}></i>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>

                <div className="testimonial_dots"></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}