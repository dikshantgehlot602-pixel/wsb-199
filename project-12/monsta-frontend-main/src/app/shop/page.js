import Link from 'next/link';
import SortSelect from './SortSelect';
import PriceSlider from './PriceSlider';
import CollapsibleFilter from './CollapsibleFilter';
import { products as fallbackProducts } from '@/data/products';
import { fetchProducts, fetchCategories, fetchSubCategories, fetchColors, fetchMaterials } from '@/lib/api';
import ProductCard from '../components/Common/ProductCard';
import './page.css';
export const metadata = {
  title: 'Shop Furniture - Online Furniture in India',
  description:
    'Browse our furniture shop — tables, sofas, mirrors and storage. Filter by category and sort by price.',
};

// -------------------------------------------------------------------------------------------
// Single "Sort By" dropdown, mirroring the reference site's 9 options in the same order.
//
// Note that the first four are NOT sorts -- they are collection FILTERS (product_type /
// is_best_sellings), which the reference deliberately mixes into the one dropdown. `kind`
// records which family an option belongs to, so the handler can clear the other family:
// selecting a filter must drop any active sort, and selecting a sort must drop any active
// collection filter. `params` names the URL key(s) the option writes.
// -------------------------------------------------------------------------------------------
const SORT_OPTIONS = [
  { value: 'default', label: 'Sort By', kind: 'default' },
  { value: 'featured', label: 'Featured Products', kind: 'filter', params: { product_type: '1' } },
  { value: 'arrivals', label: 'New Arrivals', kind: 'filter', params: { product_type: '2' } },
  { value: 'onsale', label: 'On sale', kind: 'filter', params: { product_type: '3' } },
  { value: 'best-sellings', label: 'Best Sellings', kind: 'filter', params: { is_best_sellings: '1' } },
  { value: 'price-asc', label: 'Sort by price: low to high', kind: 'sort', params: { sort: 'price-asc' } },
  { value: 'price-desc', label: 'Sort by price: high to low', kind: 'sort', params: { sort: 'price-desc' } },
  { value: 'name-asc', label: 'Product Name: A to Z', kind: 'sort', params: { sort: 'name-asc' } },
  { value: 'name-desc', label: 'Product Name: Z to A', kind: 'sort', params: { sort: 'name-desc' } },
];

// URL `sort` value -> the whitelisted `sort` key the public product endpoint accepts.
const API_SORT_KEYS = {
  default: 'order',
  newest: 'newest',
  'price-asc': 'price-low',
  'price-desc': 'price-high',
  'name-asc': 'name',
  'name-desc': 'name-desc',
};

// Which currently-selected option the URL represents. Because filters and sorts share one
// dropdown, the two families must be resolved separately -- `product_type`/`is_best_sellings`
// decide the first branch and `sort` decides the second.
function activeSortOption(productType, bestSellings, sort) {
  if (bestSellings === '1') {
    return 'best-sellings';
  }

  // Accept the enum (1/2/3) and the legacy label form (?product_type=featured). The label form
  // is still honoured by the API, so it has to resolve to an option too -- otherwise the chip
  // fell through to 'default' and displayed the raw URL value ("featured") instead of
  // "Featured Products".
  if (productType === '1' || productType === 'featured') return 'featured';
  if (productType === '2' || productType === 'arrivals') return 'arrivals';
  if (productType === '3' || productType === 'onsale') return 'onsale';

  return sort || 'default';
}

const PER_PAGE = 12;

// Reads a single-valued search param; Next hands back a string[] for a repeated key.
function one(value) {
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function slugify(str) {
  return String(str).toLowerCase().replace(/\s+/g, '-');
}

// Parses a `min_price` / `max_price` URL value. Returns null for anything that is not a
// usable non-negative number, so a missing or malformed bound is simply omitted from the API
// query instead of being sent as 0.
function toPriceNumber(value) {
  const raw = one(value);

  if (raw === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

// Hardcoded catalogue categories, used only when the API is unreachable.
const fallbackCategories = Array.from(
  new Map(fallbackProducts.map((p) => [slugify(p.category), p.category])).entries()
);

// Filters the hardcoded catalogue. Only used on the fallback path — the live path filters in
// MongoDB, which is both faster and the reason this page scales past the sample products.
function filterFallback(list, { category, productType, search }) {
  let result = list;

  if (category) {
    result = result.filter((p) => slugify(p.category) === category);
  }

  if (productType) {
    result = result.filter((p) => p.tag === productType);
  }

  if (search) {
    const needle = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        String(p.category || '').toLowerCase().includes(needle)
    );
  }

  return result;
}

function sortFallback(list, sort) {
  const result = [...list];

  switch (sort) {
    case 'price-asc':
      return result.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return result.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return result.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return result;
  }
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Normalises a facet value from the URL so `?category=` works whether the visitor (or an internal
// link) passes the slug ("living-room"), the display name ("Living Room") or the raw ObjectId
// ("6abbc620..."). The public API filters these facets by ObjectId only, so the value is resolved
// against the fetched facet list to an id before the request. Returns '' when nothing matches, so
// an unknown value yields an honest empty state instead of silently dropping the filter.
function resolveFacet(value, facetList) {
  if (!value) return '';

  const raw = String(value).trim();
  if (OBJECT_ID.test(raw)) return raw;

  const needle = slugify(raw);

  const match = facetList.find(
    (f) => f.slug === raw || slugify(f.name) === needle || f.id === raw
  );

  return match ? match.id : '';
}

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};

  const category = one(params.category);
  const subCategory = one(params.sub_category);
  const color = one(params.color);
  const material = one(params.material);
  const productType = one(params.product_type);
  // "Best Sellings" lives in the same dropdown but is a separate filter, so it needs its own
  // URL key. Accepts 1/true (the enum is 1 = Yes, 2 = No -- not a boolean).
  const bestSellings = one(params.is_best_sellings);
  const sort = one(params.sort) || 'default';
  const search = one(params.search);
  const page = Math.max(1, parseInt(one(params.page), 10) || 1);

  // Price filter bounds, shared by the sidebar control and the API request. Declared before
  // `apiFilters` because the bounds are sent with the product query.
const minPrice = toPriceNumber(params.min_price);
const maxPrice = toPriceNumber(params.max_price);
const hasPriceFilter = minPrice !== null || maxPrice !== null;

  // Sidebar facets, fetched alongside the product list rather than after it.
  // Sub-categories are needed because the navbar links them through `?category=`, so a
  // `?category=dining-table` value has to be recognisable as a sub-category, not a category.
  const [categories, subCategories, colors, materials] = await Promise.all([
    fetchCategories(),
    fetchSubCategories(),
    fetchColors(),
    fetchMaterials(),
  ]);

  // Category is resolved from a slug, a display name or an id to the ObjectId the API filters on.
  // `categoryWasUnmatched` marks a value that matched no category, so the grid can show an honest
  // empty state rather than the whole catalogue.
  const activeCategoryId = resolveFacet(category, categories);
  let categoryWasUnmatched = Boolean(category) && !activeCategoryId;

  // The matched category record, used for the heading and the removable filter chip.
  const selectedCategory = activeCategoryId
    ? categories.find((c) => c.id === activeCategoryId) || null
    : null;

  // `?sub_category=` is resolved the same way as the other facets (slug OR name OR id). This used
  // to be forwarded only when it was already an ObjectId, so a sub-category slug was silently
  // dropped and the grid showed the unfiltered catalogue.
  let activeSubCategoryId = resolveFacet(subCategory, subCategories);
  let selectedSubCategory = activeSubCategoryId
    ? subCategories.find((s) => s.id === activeSubCategoryId) || null
    : null;

  // Backwards compatibility: the navbar links SUB-categories with `?category=<slug>`
  // (Header.jsx: `/shop?category=${sub.slug}`). So when `?category=` matches no category but does
  // match a sub-category, it is treated as a sub-category filter instead of being reported as an
  // unknown value. Category slugs are checked first (above), so a real category always wins.
  let subCategoryCameFromCategoryParam = false;

  if (categoryWasUnmatched) {
    const categoryParamAsSubCategory = resolveFacet(category, subCategories);

    if (categoryParamAsSubCategory) {
      categoryWasUnmatched = false;
      subCategoryCameFromCategoryParam = true;
      activeSubCategoryId = categoryParamAsSubCategory;
      selectedSubCategory =
        subCategories.find((s) => s.id === categoryParamAsSubCategory) || null;
    }
  }

  // Records which URL key actually carries the sub-category filter, so the removable chip clears
  // the right parameter (the navbar's `?category=` link, or an explicit `?sub_category=`).
  const subCategoryParamKey = subCategory
    ? 'sub_category'
    : subCategoryCameFromCategoryParam
    ? 'category'
    : null;

  const activeColorId = resolveFacet(color, colors);
  const activeMaterialId = resolveFacet(material, materials);

  const apiFilters = {
    limit: PER_PAGE,
    page: page,
    sort: API_SORT_KEYS[sort] || 'order',
  };

  if (activeCategoryId) apiFilters.parent_category_id = activeCategoryId;
  // Resolved to an ObjectId above, so sub-category slugs and names now work.
  if (activeSubCategoryId) apiFilters.sub_category_id = activeSubCategoryId;
  if (productType) apiFilters.product_type = productType;
  if (bestSellings) apiFilters.is_best_sellings = bestSellings;
  if (search) apiFilters.search = search;
  if (activeColorId) apiFilters.color_id = activeColorId;
  if (activeMaterialId) apiFilters.material_id = activeMaterialId;
  // Only send a bound that was actually chosen, so the API can distinguish "no lower bound"
  // from a lower bound of 0.
  if (minPrice !== null) apiFilters.min_price = minPrice;
  if (maxPrice !== null) apiFilters.max_price = maxPrice;

  // fetchProducts resolves to [] on any failure, so this needs no try/catch.
  const apiProducts = await fetchProducts(apiFilters);

  // The count matching the current filters, ignoring pagination. Attached to the array by
  // fetchProducts; undefined on the hardcoded fallback path or if the API omits it.
  const apiTotal = typeof apiProducts.total === 'number' ? apiProducts.total : null;

  // `[]` is ambiguous: fetchProducts returns it both when the API is unreachable AND when the
  // filters genuinely match nothing. Falling back to the hardcoded catalogue in the second case
  // would show unrelated products for a valid-but-empty filter (e.g. ?color=red when no product
  // has that colour), so the API's liveness is established separately: if the category/colour/
  // material facet calls above returned data, the API is up and an empty product list is a real
  // answer, not a failure.
  const apiIsReachable =
    categories.length > 0 || colors.length > 0 || materials.length > 0;

  let result;
  let total = 0;

  if (apiProducts.length > 0) {
    result = apiProducts;
    // True total for the current filters, so "Showing 13-24 of 57 results" is accurate on
    // page 2. Falls back to the page length if the API did not send a count.
    total = apiTotal != null ? apiTotal : apiProducts.length;

    // A facet value that matched nothing in the fetched facet lists cannot be sent to the API
    // (which filters by id), so it is applied here instead. Without this, `?category=bogus` would
    // silently return the entire catalogue.
    if (categoryWasUnmatched) {
      result = [];
    }
    if (color && !activeColorId) {
      result = result.filter((p) => slugify(p.color) === slugify(color));
    }
    if (material && !activeMaterialId) {
      result = result.filter((p) => slugify(p.material) === slugify(material));
    }

    // When a facet value had to be resolved client-side (the filters above), this page shows fewer
    // rows than the API returned. The total can then be clamped to the last row actually
    // displayed, so "of N results" never claims more than the visitor can reach. On a clean
    // API filter the API's own count is already correct and this is skipped.
    if (result.length !== apiProducts.length) {
      total = Math.min(total, (page - 1) * PER_PAGE + result.length);
    }
  } else if (apiIsReachable) {
    // The API answered and genuinely has no matches for these filters. Show an honest empty state
    // rather than the hardcoded catalogue, which would list unrelated products.
    result = [];
    total = apiTotal != null ? apiTotal : 0;
  } else {
    const all = filterFallback(fallbackProducts, { category, productType, search });
    total = all.length;
    const start = (page - 1) * PER_PAGE;
    result = sortFallback(all, sort).slice(start, start + PER_PAGE);
  }

  const hasFilters = Boolean(category || subCategory || color || material || productType || bestSellings || hasPriceFilter || search);
  const shown = result.length;

  // Upper bound of the price slider, fixed so the control does not shift between pages. It is
  // deliberately not derived from the prices on the current page: doing that made the slider's
  // travel change as you paged or filtered, and it would cap the range below what the catalogue
  // can actually contain.
  const sliderCeiling = 10000;
  // Reference-style range: "Showing 1-12 of 20 results". `rangeFrom` is the first row index on
  // this page and `rangeTo` the last, so page 2 correctly reads "Showing 13-20 of 20 results".
  const rangeFrom = shown === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangeTo = shown === 0 ? 0 : rangeFrom + shown - 1;
  const resultLabel = `Showing ${rangeFrom}-${rangeTo} of ${total} result${total === 1 ? '' : 's'}`;

  // Every filter/sort control is a plain link carrying the current params plus the one change, so
  // the page stays a server component and each state is shareable/bookmarkable.
  const buildHref = (overrides = {}) => {
    const next = {
      category,
      sub_category: subCategory,
      color,
      material,
      product_type: productType,
      is_best_sellings: bestSellings,
      min_price: minPrice === null ? '' : String(minPrice),
      max_price: maxPrice === null ? '' : String(maxPrice),
      search,
      sort: sort === 'default' ? '' : sort,
      // Changing a filter must return to page 1, otherwise page 4 of a new filter is empty.
      page: '',
      ...overrides,
    };

    const query = Object.entries(next)
      .filter(([, value]) => value !== '' && value != undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return query ? `/shop?${query}` : '/shop';
  };

  // Builds the href for a "Sort By" choice. Because the dropdown mixes filters and sorts, each
// selection first clears BOTH families and then writes only its own params -- so a filter can
// never leave a stale `sort` behind, or a sort a stale `product_type`/`is_best_sellings`.
const buildSortHref = (value) => {
  const option = SORT_OPTIONS.find((opt) => opt.value === value);
  const overrides = { product_type: '', is_best_sellings: '', sort: '' };

  if (option && option.kind === 'filter') {
    Object.assign(overrides, option.params);
  } else if (option && option.kind === 'sort') {
    Object.assign(overrides, option.params);
  }

  // 'Sort By' (default) clears everything, leaving just /shop plus any category/colour/etc.
  return buildHref(overrides);
};

const selectedSortValue = activeSortOption(productType, bestSellings, sort);

  // A full page back implies there may be another one. With the API's real total this is now
// exact (page * PER_PAGE < total) rather than inferring from a short page.
  const hasMore = rangeTo < total;

  return (
    <main>
      {/* Breadcrumb */}
      <section className="breadcrumbs_area">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="breadcrumb_content">
                {/* The reference keeps the heading static ("Product Listing") and mirrors it in
                    the breadcrumb, instead of substituting the active category name. The active
                    category/sub-category is still conveyed by the filter chips below and by the
                    sidebar's highlighted row, so nothing is lost. */}
                <h3>Product Listing</h3>
                {/* Reference places the breadcrumb BELOW the heading, not above it. */}
                <ul className="shop_breadcrumb">
                  <li><Link href="/">Home</Link></li>
                  <li><i className="fa fa-angle-right"></i></li>
                  <li>Product Listing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shop_area">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 col-md-12">
              {/* Each facet is its own block, matching the reference: Categories, Material, Color and
                  Filter By Price stacked with bold headings. */}
              <CollapsibleFilter title="Categories" className="widget_list widget_categories shop_facets">
                <ul className="shop_facet_list">
                  <li className={!category && !subCategory ? 'active' : ''}>
                    <Link href={buildHref({ category: '', sub_category: '' })}>All Products</Link>
                  </li>
                  {/* Parent categories, each followed by its sub-categories. Sub-categories link
                      through `?sub_category=<slug>` (the canonical key); the navbar's
                      `?category=<slug>` form is still accepted by resolveFacet above.

                      The checkbox is the reference's visual treatment for these filters. It is
                      `aria-hidden` and non-interactive: the whole row is the link, so keyboard
                      users get one focusable target per row rather than a checkbox that does
                      nothing when clicked. */}
                  {categories.length > 0
                    ? categories.map((c) => {
                        const subs = subCategories.filter((s) => s.parentId === c.id);
                        const isChecked = activeCategoryId === c.id;

                        return (
                          <li key={c.id} className={`shop_parent_cat${isChecked ? ' active' : ''}`}>
                            <Link href={buildHref({ category: c.slug, sub_category: '' })}>
                              {/* Parent categories are group headers, not a facet value, so they
                                  get NO checkbox (`.shop_facet_label--plain`). Only sub-categories
                                  below carry `.shop_check`. The row stays a link, so clicking it
                                  still filters by that category. The `active` class is kept on the
                                  <li> so the selected parent is still highlighted. */}
                              <span className="shop_facet_label shop_facet_label--plain">
                                {c.name}
                              </span>
                            </Link>
                            {subs.length > 0 && (
                              <ul className="shop_sub_categories">
                                {subs.map((s) => {
                                  const subChecked = activeSubCategoryId === s.id;

                                  return (
                                    <li key={s.id} className={subChecked ? 'active' : ''}>
                                      <Link href={buildHref({ category: '', sub_category: s.slug })}>
                                        <span className="shop_check" aria-hidden="true"></span>
                                        <span className="shop_facet_label">{s.name}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </li>
                        );
                      })
                    : /* API down: the hardcoded slugs, which resolve by name via filterFallback.
                         These are parent categories too, so no checkbox -- same as above. */
                      fallbackCategories.map(([slug, name]) => (
                        <li key={slug} className={`shop_parent_cat${category === slug ? ' active' : ''}`}>
                          <Link href={buildHref({ category: slug })}>
                            <span className="shop_facet_label shop_facet_label--plain">{name}</span>
                          </Link>
                        </li>
                      ))}
                </ul>
              </CollapsibleFilter>

              {/* Material */}
              <CollapsibleFilter title="Material" className="widget_list widget_categories shop_facets">
                <ul className="shop_facet_list">
                  {materials.map((m) => {
                    const isChecked = activeMaterialId === m.id;

                    return (
                      <li key={m.id} className={isChecked ? 'active' : ''}>
                        <Link href={buildHref({ material: isChecked ? '' : m.slug })}>
                          <span className="shop_check" aria-hidden="true"></span>
                          <span className="shop_facet_label">{m.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleFilter>

              {/* Color */}
              <CollapsibleFilter title="Color" className="widget_list widget_categories shop_facets">
                <ul className="shop_facet_list">
                  {colors.map((c) => {
                    const isChecked = activeColorId === c.id;

                    return (
                      <li key={c.id} className={isChecked ? 'active' : ''}>
                        <Link href={buildHref({ color: isChecked ? '' : c.slug })}>
                          <span className="shop_check" aria-hidden="true"></span>
                          {/* Swatch from the hex the admin stored, so colours are visually
                              distinguishable the way the reference shows them. */}
                          <span
                            className="shop_color_swatch"
                            style={{ backgroundColor: c.code || '#cccccc' }}
                            aria-hidden="true"
                          ></span>
                          <span className="shop_facet_label">{c.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleFilter>

              {/* Filter By Price. PriceSlider is a small client component: the displayed range has
                  to update as the thumb moves, which needs local state a Server Component cannot
                  hold. It submits a real GET form, so Filter still navigates normally. */}
              <CollapsibleFilter title="Filter By Price" className="widget_list widget_categories shop_facets">

                <PriceSlider
                  min={0}
                  max={sliderCeiling}
                  step={100}
                  value={maxPrice}
                  hidden={{
                    category: category,
                    sub_category: subCategory,
                    color: color,
                    material: material,
                    product_type: productType,
                    is_best_sellings: bestSellings,
                    search: search,
                    sort: sort === 'default' ? '' : sort,
                    min_price: minPrice === null ? '' : String(minPrice),
                  }}
                />
              </CollapsibleFilter>
            </div>

            {/* Main listing */}
            <div className="col-lg-9 col-md-12">
              {/* Toolbar */}
              <div className="shop_toolbar">
                {/* NOTE: there is no separate Featured / New Arrivals / On Sale tab row here. Those
                    tabs live on the homepage only (ProductTabs, rendered in src/app/page.js).
                    Their filtering is reachable from the "Sort By" dropdown below, which mixes
                    those collection filters with the real sorts exactly as the reference does. */}

                <div className="orderby_wrapper">
                  {/* Reference order: "Sort By" label on the left, one dropdown beside it, then
                      the result count on the right. The 9 options and the URLs they produce are
                      unchanged -- only the presentation moved from a row of links to a <select>.

                      SortSelect is a small client component because a native <select> needs an
                      onChange handler, which a server component cannot have. It navigates by
                      pushing the href the server already computed, so the page stays a server
                      component and every other filter/sort state is preserved. */}
                  <div className="shop_sort_form">
                    <label className="shop_sort_label" htmlFor="shop-sort-select">
                      Sort By
                    </label>

                    <SortSelect
                      id="shop-sort-select"
                      value={selectedSortValue}
                      options={SORT_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                        href: buildSortHref(opt.value),
                      }))}
                    />
                  </div>
                </div>

                <div className="page_amount">
                  <p>{shown === 0 ? 'No products found' : resultLabel}</p>
                </div>
              </div>

              {/* Active filter chips, so a filtered shop is reversible one click at a time. */}
              {hasFilters && (
                <div className="shop_active_filters">
                  {category && selectedCategory && (
                    <Link href={buildHref({ category: '' })}>
                      Category: {selectedCategory.name} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {/* A sub-category reached via `?category=<slug>` (the navbar's format): label it
                      as a sub-category, and clear `category` -- the key that actually holds it. */}
                  {subCategoryCameFromCategoryParam && selectedSubCategory && (
                    <Link href={buildHref({ category: '' })}>
                      Sub Category: {selectedSubCategory.name} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {subCategory && selectedSubCategory && (
                    <Link href={buildHref({ sub_category: '' })}>
                      Sub Category: {selectedSubCategory.name} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {subCategory && !selectedSubCategory && (
                    <Link href={buildHref({ sub_category: '' })}>
                      Sub Category: {subCategory} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {category && !selectedCategory && !subCategoryCameFromCategoryParam && (
                    <Link href={buildHref({ category: '' })}>
                      Category: {category} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {productType && (
                    <Link href={buildHref({ product_type: '' })}>
                      {activeSortOption(productType, '', '') === 'default'
                        ? productType
                        : SORT_OPTIONS.find((o) => o.value === activeSortOption(productType, '', ''))?.label || productType}{' '}
                      <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {bestSellings && (
                    <Link href={buildHref({ is_best_sellings: '' })}>
                      Best Sellings <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {color && (
                    <Link href={buildHref({ color: '' })}>
                      Color: {color} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {material && (
                    <Link href={buildHref({ material: '' })}>
                      Material: {material} <i className="fa fa-times"></i>
                    </Link>
                  )}
                  {search && (
                    <Link href={buildHref({ search: '' })}>
                      Search: {search} <i className="fa fa-times"></i>
                    </Link>
                  )}
                </div>
              )}

              {/* Grid / empty state */}
              {shown === 0 ? (
                <div className="shop_empty">
                  <p>No products found in this category.</p>
                  <Link href="/shop" className="shop_empty_btn">Back to Shop</Link>
                </div>
              ) : (
                <div className="row">
                  {result.map((product) => (
                    <div key={product.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination. The API path cannot know the true total, so the next-page link is
                  simply omitted once a short page arrives. */}
              {hasMore && (
                <div className="shop_pagination">
                  <Link href={buildHref({ page: String(page + 1) })} className="shop_pagination_btn">
                    Load More
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
