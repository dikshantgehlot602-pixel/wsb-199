import {
    mapCategory,
    mapSubCategory,
    mapSubSubCategory,
    mapProduct,
    mapTestimonial,
    mapWhyChooseUs,
    mapColor,
    mapMaterial,
    mapList,
} from './mappers';

// -------------------------------------------------------------------------------------------
// Website <-> API data layer (Phase 2).
//
// Every function here returns a plain, already-mapped array/object. On ANY failure (network
// down, API restarting, non-200, `_status: false`, malformed body) it resolves to an empty array
// (or null for the single product) and logs a warning, so a component can never crash on bad data
// and can fall back to its existing hardcoded content.
//
// Usage from a server component:
//     const products = await fetchProducts();
// Usage from a client component:
//     useEffect(() => { fetchProducts().then(setProducts); }, []);
//
// IMPORTANT (Phase 3 / W1):
//     - In the BROWSER these requests go through a short-lived in-memory cache (CACHE_TTL_MS,
//       default 30s) plus in-flight de-duplication, so several components asking for the same
//       data on one page cost a single network request.
//     - On the SERVER the cache is bypassed entirely (see `isBrowser`), because a server module
//       instance is reused across requests and caching there would leak one visitor's response
//       into another's page. Server components keep their per-request behaviour.
//     - `clearApiCache()` exists so an action can force fresh data without a page reload.
// -------------------------------------------------------------------------------------------

// Strip any trailing slash and any existing path, then always append the fixed API path.
// This way NEXT_PUBLIC_API_URL can be either the bare origin (https://api.example.com)
// or a legacy full URL (https://api.example.com/api/website) without doubling the path.
const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001').replace(/\/+$/, '').replace(/\/api\/website$/, '');
const BASE_URL = `${RAW_API_URL}/api/website/`;

// 30s is deliberately short: long enough to collapse the homepage's duplicate calls, short
// enough that an admin edit shows up almost immediately while still iterating.
const CACHE_TTL_MS = Number(process.env.NEXT_PUBLIC_API_CACHE_TTL_MS) || 30_000;

// Only the browser gets a cache.
const isBrowser = typeof window !== 'undefined';

// key -> { data, timestamp }. Stale entries are kept rather than deleted so they can serve as an
// offline fallback, and the cache needs nothing beyond this single map.
const cacheStore = new Map();

// In-flight requests, keyed the same way. Two components mounting in the same tick share one
// request instead of both hitting the network.
const inFlightStore = new Map();

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Wipes every cached entry and any pending de-duplication handle.
export function clearApiCache() {
    cacheStore.clear();
    inFlightStore.clear();
}

// Console-prefixed so these warnings are easy to spot while debugging.
const warn = (label, error) => {
    console.warn(`[api] ${label} failed:`, error?.message || error);
};

// Drops empty params so the request URL stays clean and cacheable.
function buildUrl(path, params = {}) {
    const search = Object.entries(params)
        .filter(([, value]) => value != undefined && value !== null && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

    return `${BASE_URL}${path}${search ? `?${search}` : ''}`;
}

// ---- CACHE PLUMBING ---------------------------------------------------------------------------------
// On the server every helper below is a no-op passthrough.

// Reads a fresh cache entry, or null when there is none / it has expired.
function readCache(key) {
    const entry = cacheStore.get(key);

    if (!entry) {
        return null;
    }

    return now() - entry.timestamp < CACHE_TTL_MS ? entry : null;
}

// Copies the response envelope, including `_data`. Two components share one cache entry, so
// without this a consumer that mutated the returned array would corrupt the next component's
// view of the data. The copy is shallow, which is enough: the mappers only read top-level
// fields and never write to the objects inside `_data`.
const copyBody = (body) => ({
    ...body,
    _data: Array.isArray(body?._data) ? [...body._data] : body?._data,
});

// Always hits the network. All error handling for a single call lives here.
async function fetchBody(url, label) {
    try {
        const response = await fetch(url, {
            // Both env values are public NEXT_PUBLIC_* by design; no server-only secret is
            // used here, so the same call works in a server or a client component.
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const body = await response.json();

        // The API answers with HTTP 200 + `_status: false` on application errors, so the
        // envelope has to be checked explicitly -- a 200 alone does not mean success.
        if (!body || body._status !== true) {
            throw new Error(body?._message || 'API reported _status: false');
        }

        return body;
    } catch (error) {
        warn(label, error);
        return null;
    }
}

// Fetches a URL, honouring the cache first and de-duplicating concurrent callers.
// -> the parsed body, or null if the call failed with nothing cached to fall back on.
async function requestUrl(url, label) {
    // Server: no cache, no shared state, straight to the network.
    if (!isBrowser) {
        return fetchBody(url, label);
    }

    const cached = readCache(url);

    if (cached) {
        return copyBody(cached.data);
    }

    // Another component already asked for exactly this URL in this tick -- wait for its result
    // rather than issuing a second identical request.
    const pending = inFlightStore.get(url);

    if (pending) {
        return pending;
    }

    const promise = fetchBody(url, label)
        .then((body) => {
            if (body) {
                cacheStore.set(url, { data: copyBody(body), timestamp: now() });
            } else {
                // The request failed. Keep whatever we had, even if stale: an API outage should
                // not empty the storefront. The entry keeps its ORIGINAL timestamp, so the next
                // call still tries the network instead of trusting the stale copy indefinitely.
                const stale = cacheStore.get(url);

                return stale ? copyBody(stale.data) : body;
            }

            return body;
        })
        .finally(() => {
            inFlightStore.delete(url);
        });

    inFlightStore.set(url, promise);

    return promise;
}

// Single request helper. Resolves to the parsed body, or null if the call failed in any way.
async function request(path, params, label) {
    return requestUrl(buildUrl(path, params), label);
}

// -------------------------------------------------------------------------------------------
// Categories
// -------------------------------------------------------------------------------------------
// -> [{ id, name, slug, image, order }]
export async function fetchCategories() {
    const body = await request('category', {}, 'fetchCategories');
    return body ? mapList(body._data, mapCategory) : [];
}

export async function fetchSubCategories(parentId) {
    const body = await request('sub-category', { parent_category_id: parentId }, 'fetchSubCategories');
    return body ? mapList(body._data, mapSubCategory) : [];
}

export async function fetchSubSubCategories(subCategoryId) {
    const body = await request('sub-sub-category', { sub_category_id: subCategoryId }, 'fetchSubSubCategories');
    return body ? mapList(body._data, mapSubSubCategory) : [];
}


// -------------------------------------------------------------------------------------------
// Products
// -------------------------------------------------------------------------------------------
// -> [{ id, name, slug, category, price, oldPrice, image, images, tag, ... }]
//
// filters (all optional, all sent to the public endpoint):
//   category / sub_category / sub_sub_category  -- ids or slugs
//   product_type  1 | 2 | 3                      -- featured | arrivals | onsale
//   is_trending / is_best_sellings              -- 1 to filter
export async function fetchProducts(filters = {}) {
    const body = await request('product', filters, 'fetchProducts');

    if (!body) {
        return [];
    }

    const list = mapList(body._data, mapProduct);

    // The endpoint returns `_total` (the count matching the filters, ignoring pagination) so
    // the shop page can render the reference's "Showing X-Y of Z results". It is attached to
    // the array rather than returned separately, so every existing caller -- which just maps
    // over the result -- keeps working untouched.
    if (typeof body._total === 'number') {
        Object.defineProperty(list, 'total', {
            value: body._total,
            enumerable: false,
            writable: true,
        });
    }

    return list;
}

// A single product by slug, or null when not found / on failure.
// -> { id, name, slug, price, images, color, material, code, dimension, ... } | null
export async function fetchProductBySlug(slug) {
    if (!slug) {
        return null;
    }

    const body = await request(`product/${encodeURIComponent(slug)}`, {}, 'fetchProductBySlug');

    if (!body || !body._data) {
        return null;
    }

    return mapProduct(body._data);
}

// -------------------------------------------------------------------------------------------
// Content sections
// -------------------------------------------------------------------------------------------
// -> [{ id, name, message, job, image, text, img, rating, ... }]
export async function fetchTestimonials() {
    const body = await request('testimonial', {}, 'fetchTestimonials');
    return body ? mapList(body._data, mapTestimonial) : [];
}

// -> [{ id, title, image, order }]
export async function fetchWhyChooseUs() {
    const body = await request('why-choose-us', {}, 'fetchWhyChooseUs');
    return body ? mapList(body._data, mapWhyChooseUs) : [];
}

// -------------------------------------------------------------------------------------------
// Product options
// -------------------------------------------------------------------------------------------
// -> [{ id, name, code }]
export async function fetchColors() {
    const body = await request('color', {}, 'fetchColors');
    return body ? mapList(body._data, mapColor) : [];
}

// -> [{ id, name }]
export async function fetchMaterials() {
    const body = await request('material', {}, 'fetchMaterials');
    return body ? mapList(body._data, mapMaterial) : [];
}

