'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav>
      <button onClick={() => setIsOpen(!isOpen)}>Menu</button>
      <div className={isOpen ? 'menu-open' : 'menu-closed'}>
        {/* navigation links */}
      </div>
    </nav>
  );
}