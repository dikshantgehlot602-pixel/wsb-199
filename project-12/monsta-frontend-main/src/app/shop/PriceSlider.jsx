'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// The shop page's "Filter By Price" control.
//
// This is a client component because the displayed range has to update as the slider moves,
// which needs local state -- a Server Component cannot hold it.
//
// The displayed value is `maxPrice`, and the filter applied is "everything up to this number",
// matching the reference's single-handle slider. It is a real GET <form>, so pressing Filter
// navigates normally and still works if JavaScript fails; the onChange handler only keeps the
// label in step with the thumb, it does not perform the navigation.
export default function PriceSlider({ min = 0, max, step = 100, value, hidden = {} }) {
  const router = useRouter();

  // `max` when no ceiling is chosen means "no upper bound applied", which is different from a
  // ceiling of 0, so the distinction is kept rather than collapsed to a single number.
  const [current, setCurrent] = useState(value == null ? max : value);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Rebuild the query from the active filters the server passed down, swapping in the new
    // ceiling. The page is dropped so a narrowed filter starts from page 1.
    const params = new URLSearchParams();

    for (const [name, val] of Object.entries(hidden)) {
      if (val !== '' && val != undefined && val != null) {
        params.set(name, String(val));
      }
    }

    params.set('max_price', String(current));

    router.push(`/shop?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="shop_price_form">
      {/* Carry every other active filter through the submission. */}
      {Object.entries(hidden).map(([name, val]) => (
        <input key={name} type="hidden" name={name} value={val ?? ''} />
      ))}

      <input
        type="range"
        name="max_price"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => setCurrent(Number(event.target.value))}
        className="shop_price_range"
      />

      <p className="shop_price_text">
        Rs. {min} – Rs. {current}
      </p>

      <button type="submit" className="shop_price_submit">
        Filter
      </button>
    </form>
  );
}