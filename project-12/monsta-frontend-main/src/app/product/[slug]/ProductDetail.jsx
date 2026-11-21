'use client';

import { useEffect, useState } from 'react';
import ImageWithSkeleton from '../../components/Common/ImageWithSkeleton';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchProducts } from '@/lib/api';
import ProductSlider from '../../components/Common/ProductSlider';
import './ProductDetail.css';

// Number of cards held in each carousel track (5 are visible per view).
const SLIDER_LIMIT = 10;

// Human labels for the `tag` the mapper derives from product_type.
const TAG_LABELS = {
  featured: 'Featured',
  arrivals: 'New Arrival',
  onsale: 'On Sale',
};

function formatPrice(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

// Must match the slug format used by /shop category filtering.
function categorySlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// products.js ships a single `image` per product, so a hardcoded product has no gallery.
// Only the primary photo is shown in that case: the thumbnail strip is hidden by the
// caller when the list has a single entry, so there is nothing to switch between.
function productImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }

  return product.image ? [product.image] : [];
}

// Shown in a spec row when the admin has not filled the field in. Deliberately a dash
// rather than invented data - a blank cell would look like a rendering bug, and a
// made-up value would be worse.
const NOT_PROVIDED = '-';

// Spec sheet rendered under "Add to cart". Every row is backed by real API data now,
// so a row is dropped entirely when the field is empty and the product genuinely has
// no such value. Only Code falls back to a generated reference when absent.
function productDetails(product) {
  const rows = [
    {
      label: 'Code',
      value: product.code || `FRN-${String(product.id).padStart(4, '0')}`,
    },
    { label: 'Dimension', value: product.dimension },
    { label: 'Estimate Delivery Days', value: product.estimateDeliveryDays },
    {
      label: 'Category',
      value: product.category,
      href: `/shop?category=${categorySlug(product.category)}`,
    },
    { label: 'Color', value: product.color },
    { label: 'Material', value: product.material },
  ];

  return rows
    .filter((row) => row.value != undefined && row.value !== '')
    .map((row) => ({ ...row, value: row.value || NOT_PROVIDED }));
}

// Real long_description from the API. `shortDescription` is used when there is no long
// copy. If the admin has written neither, the section is omitted entirely rather than
// showing generic filler text.
function productDescription(product) {
  return product.description || product.shortDescription || '';
}

export default function ProductDetail({ product, allProducts }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isLoggedIn = useSelector((state) => Boolean(state.login.value));

  const [quantity, setQuantity] = useState(1);

  // Gallery. `mapProduct` always folds the primary image into `images[0]`, so the API
  // product renders a real multi-image gallery. A hardcoded fallback product has one
  // image, and the thumbnail strip is then skipped.
  const images = productImages(product);
  const [mainImage, setMainImage] = useState(images[0] || '');

  // Guard against a gallery that changes when the product prop is replaced (e.g. a
  // client-side re-fetch) while the selected main image points at an image that is no
  // longer in the list.
  useEffect(() => {
    if (images.length > 0 && !images.includes(mainImage)) {
      setMainImage(images[0]);
    }
  }, [images.join('|'), mainImage]);

  // Spec sheet + description rendered under "Add to cart". Both come from the API.
  const details = productDetails(product);
  const description = productDescription(product);

  const isWishlisted = isInWishlist(product.id);
  const hasDiscount = product.oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));
  const increaseQty = () => setQuantity((q) => q + 1);

  // ── Related / Upsell ──────────────────────────────────────────────────────────────
  // Start with the hardcoded algorithm so the sliders render on the first paint
  // (no layout shift), then upgrade to API data once it arrives. `null` means "not
  // loaded yet"; an empty array means "API returned nothing, keep the fallback".
  const [apiRelated, setApiRelated] = useState(null);
  const [apiUpsell, setApiUpsell] = useState(null);

  // Hardcoded fallback: same category first, then the rest of the catalogue. The
  // product being viewed is never included.
  const fallbackRelated = allProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (a.category === product.category ? 0 : 1) - (b.category === product.category ? 0 : 1))
    .slice(0, SLIDER_LIMIT);

  // Hardcoded fallback for upsell: other categories first and products priced at or
  // above the current one, never repeating a card already in Related.
  const fallbackRelatedIds = new Set(fallbackRelated.map((p) => p.id));
  const fallbackUpsell = allProducts
    .filter((p) => p.id !== product.id && !fallbackRelatedIds.has(p.id))
    .sort((a, b) => {
      const score = (p) =>
        (p.category !== product.category ? 2 : 0) + (p.price >= product.price ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, SLIDER_LIMIT);

  useEffect(() => {
    let cancelled = false;

    // Current product identity, in whichever id space it came from. API products use
    // ObjectId strings, hardcoded ones use numbers, so both are compared as strings.
    const currentId = String(product.id);

    // The API can only filter Related by parent category when the product came from
    // the API (it then carries parentCategoryId). A hardcoded product has no such
    // id, so Related falls back to filtering a broad list by matching category name.
    const categoryId = product.parentCategoryId;

    // Related: same parent category, excluding the current product.
    const relatedPromise = categoryId
      ? fetchProducts({ parent_category_id: categoryId })
      : fetchProducts({});

    Promise.all([relatedPromise, fetchProducts({})]).then(([sameCategory, allApi]) => {
      if (cancelled) return;

      const isCurrent = (item) => String(item.id) !== currentId;
      const sameId = (a, b) => String(a.id) === String(b.id);

      const related = sameCategory
        .filter(isCurrent)
        .filter((item) => (categoryId ? true : item.category === product.category));

      // The API returned nothing usable -> keep the hardcoded fallback.
      if (related.length === 0) return;

      const relatedFinal = related.slice(0, SLIDER_LIMIT);
      setApiRelated(relatedFinal);

      // Upsell: a different category, priced at or above this product, and never a
      // card that is already in Related. Ranked so the best cross-sell comes first.
      const relatedIds = new Set(relatedFinal.map((item) => String(item.id)));
      // Related was resolved, so the full list is reused to build Upsell.
      const candidates = allApi.filter(
        (item) =>
          isCurrent(item) &&
          !relatedIds.has(String(item.id)) &&
          item.category !== product.category &&
          item.price >= product.price
      );

      const scored = candidates
        .sort((a, b) => {
          const score = (p) => (p.isBestSelling ? 2 : 0) + (p.isTrending ? 1 : 0);
          const diff = score(b) - score(a);
          if (diff !== 0) return diff;
          return b.price - a.price;
        })
        .slice(0, SLIDER_LIMIT);

      // If nothing clears the "different category AND higher price" bar, fall back to
      // any other-category product so the section is not simply empty.
      const upsellFinal =
        scored.length > 0
          ? scored
          : allApi
              .filter((item) => isCurrent(item) && !relatedIds.has(String(item.id)))
              .filter((item) => !relatedFinal.some(sameId))
              .sort((a, b) => b.price - a.price)
              .slice(0, SLIDER_LIMIT);

      setApiUpsell(upsellFinal);
    });

    return () => {
      cancelled = true;
    };
  }, [product.id, product.category, product.price, product.parentCategoryId]);

  // `apiX || fallbackX` -- null keeps the fallback, an empty array is respected.
  const related = apiRelated || fallbackRelated;
  const upsell = apiUpsell || fallbackUpsell;

  return (
    <main>
      {/* Breadcrumb */}
      <section className="product_bread breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                <ul>
                  <li><Link href="/">Home</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li><Link href="/shop">{product.category || 'Shop'}</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li>{product.name}</li>
                </ul>
                <h3>{product.name}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
{/* Product info area */}
      <div className="product_details">
        <div className="container">
          <div className="row">
            {/* Gallery */}
            <div className="col-lg-6 col-md-12">
              <div className="product_d_image">
                <div className="product-details-tab">
                  <div className="product_d_image_main">
                    {mainImage ? (
                      <ImageWithSkeleton
                        src={mainImage}
                        alt={product.name}
                        width={600}
                        height={520}
                        priority
                        sizes="(max-width: 767px) 100vw, (max-width: 991px) 50vw, 50vw"
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="product_no_image">
                        <i className="fa fa-picture-o" aria-hidden="true"></i>
                        <span>No image available</span>
                      </div>
                    )}
                  </div>
                  {/* Thumbnails below the main image - clicking one swaps the main image. */}
                  {images.length > 1 && (
                    <div className="single-zoom-thumb">
                      <ul>
                        {images.map((img, index) => (
                          <li key={img} className={img === mainImage ? 'active' : ''}>
                            <button
                              type="button"
                              onClick={() => setMainImage(img)}
                              aria-label={`Show image ${index + 1} of ${images.length}`}
                              aria-pressed={img === mainImage}
                            >
                              <ImageWithSkeleton
                                src={img}
                                alt={`${product.name} - view ${index + 1}`}
                                width={110}
                                height={110}
                                sizes="(max-width: 767px) 25vw, 110px"
                              />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="col-lg-6 col-md-12">
              <div className="product_d_right">
                <h1>{product.name}</h1>

                <div className="product_price">
                  {/* Only show the strike-through price when the product is genuinely
                      discounted. mapProduct defaults actual_price to sale_price, so an
                      equal pair would otherwise render a redundant "old" price. */}
                  {hasDiscount && (
                    <span className="old_price">Rs. {formatPrice(product.oldPrice)}</span>
                  )}
                  <span className="current_price">Rs. {formatPrice(product.price)}</span>
                  {hasDiscount && (
                    <span className="product_discount">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>

                <div className="product_variant quantity">
                  <label>Quantity:</label>
                  <div className="qty_control">
                    <button
                      type="button"
                      className="qty_btn"
                      onClick={decreaseQty}
                      aria-label="Decrease quantity"
                    >
                      <i className="fa fa-minus"></i>
                    </button>
                    <span className="qty_input" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="qty_btn"
                      onClick={increaseQty}
                      aria-label="Increase quantity"
                    >
                      <i className="fa fa-plus"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product, quantity)}
                  >
                    Add to cart
                  </button>
                </div>

                <div className="product_d_action">
                  <ul>
                    <li>
                      <button
                        type="button"
                        className={`wishlist_action${isWishlisted ? ' active' : ''}`}
                        aria-pressed={isWishlisted}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!isLoggedIn) {
                            toast.info('Please login to continue');
                            return;
                          }
                          toggleWishlist(product);
                        }}
                      >
                        <i className={`ion-heart${isWishlisted ? ' wishlisted' : ''}`} aria-hidden="true"></i>{' '}
                        {isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Short description under the title - the admin's short_description,
                    shown above the fold when there is one. */}
                {product.shortDescription && (
                  <p className="product_short_desc">{product.shortDescription}</p>
                )}

                {/* Product type badge (Featured / New Arrivals / On Sale), driven by
                    product_type via the mapper's `tag`. */}
                {product.tag && (
                  <span className="product_type_badge">
                    {TAG_LABELS[product.tag] || product.tag}
                  </span>
                )}

                {/* Product spec sheet (reference site layout). Every row is real API
                    data; rows the admin has not filled in are omitted. */}
                {details.length > 0 && (
                  <ul className="product_d_spec">
                    {details.map((row) => (
                      <li key={row.label}>
                        <span className="spec_label">{row.label}</span>
                        <span className="spec_value">
                          {row.href ? <Link href={row.href}>{row.value}</Link> : row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Description - the real long_description. Rendered only when the
                    product actually has copy, so there is never a blank heading. */}
                {description && (
                  <div className="product_desc product_description">
                    <h3>Description</h3>
                    <p>{description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Related Products carousel (5 visible, 10 in the track) ── */}
      <ProductSlider
        title="Related Products"
        products={related}
        viewAllHref="/shop"
        viewAllLabel="View All"
      />

      {/* ── Upsell Products carousel ── */}
      <ProductSlider
        title="Upsell Products"
        products={upsell}
        viewAllHref="/shop?sort=popular"
        viewAllLabel="View All"
      />
    </main>
  );
}
