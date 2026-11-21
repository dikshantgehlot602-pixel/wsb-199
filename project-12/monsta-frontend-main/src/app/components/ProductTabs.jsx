'use client';

import { useEffect, useState } from 'react';
import { products as fallbackProducts } from '@/data/products';
import { fetchProducts } from '@/lib/api';
import ProductCard from './Common/ProductCard';
import Skeleton from './Common/Skeleton';

// The three tabs map 1:1 onto the backend `product_type` enum, so each tab is its
// own API call. `key` is the same tag string the hardcoded catalogue uses, which
// keeps one lookup working for both the API and the fallback path.
const TABS = [
  { key: 'featured', label: 'Featured', productType: 1 },
  { key: 'arrivals', label: 'New Arrivals', productType: 2 },
  { key: 'onsale', label: 'Onsale', productType: 3 },
];

// One grid of cards for a given tag. Extracted so the three panes stay identical
// to the previous markup instead of being triplicated by hand.
function ProductGrid({ items }) {
  return (
    <div className="product_container">
      <div className="row">
        {items.map((product) => (
          <div key={product.id} className="col-12 col-sm-6 col-lg-3">
            <ProductCard product={product} variant="grid" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState('featured');

  // Keep the fallback data for the post-request/error state.
  const [apiProducts, setApiProducts] = useState({ featured: [], arrivals: [], onsale: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load all three tabs in one effect. Each call resolves to [] on failure, so a
  // partial outage degrades a single tab instead of the whole section.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const results = await Promise.all(
          TABS.map((tab) => fetchProducts({ product_type: tab.productType }))
        );

        if (cancelled) {
          return;
        }

        setApiProducts({
          featured: results[0] || [],
          arrivals: results[1] || [],
          onsale: results[2] || [],
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Prefer the API list for a tab; fall back to the hardcoded catalogue filtered by
  // the same tag. A tab with no products on either side renders an empty grid
  // rather than an error, matching the previous behaviour.
  const itemsFor = (tabKey) => {
    const fromApi = apiProducts[tabKey];

    if (Array.isArray(fromApi) && fromApi.length > 0) {
      return fromApi;
    }

    return fallbackProducts.filter((product) => product.tag === tabKey);
  };
  const showLoadingSkeleton =
    isLoading && Object.values(apiProducts).every((products) => products.length === 0);

  return (
    <section className="product_section p_section1">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="product_area">

              {/* ── Tab navigation ── */}
              <div className="product_tab_button">
                <ul className="nav" role="tablist">
                  {TABS.map((tab) => (
                    <li key={tab.key}>
                      <a
                        className={activeTab === tab.key ? 'active' : ''}
                        onClick={() => setActiveTab(tab.key)}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        style={{ cursor: 'pointer' }}
                      >
                        {tab.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── Tab content ── */}
              <div className="tab-content">
                {TABS.map((tab) => (
                  <div
                    key={tab.key}
                    className={`tab-pane fade${activeTab === tab.key ? ' show active' : ''}`}
                    role="tabpanel"
                  >
                    {showLoadingSkeleton && activeTab === tab.key ? (
                      <Skeleton variant="product-card" count={4} />
                    ) : (
                      <ProductGrid items={itemsFor(tab.key)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
