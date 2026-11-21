'use client';

import { useRouter } from 'next/navigation';

// The shop page's "Sort By" dropdown.
//
// A native <select> needs an onChange handler, and a Server Component cannot have one -- so the
// control lives here, in a tiny client component. It receives the href for every option
// (already computed by the server, preserving category/colour/material/etc.) and simply pushes
// the chosen one. No filtering logic is duplicated in the browser: the server remains the single
// source of truth for what each option means.
//
// The control is fully controlled by `value`, so it stays in step with back/forward navigation --
// on those the URL changes, the server re-renders with a new value, and the <select> follows.
export default function SortSelect({ id, value, options }) {
  const router = useRouter();

  return (
    <select
      id={id}
      className="shop_sort_select"
      value={value}
      onChange={(event) => {
        const chosen = options.find((opt) => opt.value === event.target.value);

        // Unknown value (should not happen) or no change: do nothing.
        if (!chosen || chosen.value === value) {
          return;
        }

        router.push(chosen.href);
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}