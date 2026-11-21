// -------------------------------------------------------------------------------------------
// Pure mapping functions: API response shape -> website component shape.
//
// Deliberately side-effect free (no fetch) so each mapper can be unit tested or reused from a
// server component without pulling in the HTTP layer. The request helpers live in api.js and
// call these.
//
// The website components (and src/data/products.js, which this must stay compatible with)
// expect camelCase keys, `id` instead of `_id`, and images as paths the browser can load.
// -------------------------------------------------------------------------------------------

// Base URL of the API, used to turn the API's relative "/uploads/..." paths into absolute URLs.
// The website runs on a different port (3000) than the API (5001), so a relative "/uploads/..."
// would resolve against the website origin and 404 on every image.
const API_ORIGIN = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/website/'
).replace(/\/(api\/website\/?)?$/, '');

// Turns a stored path into a loadable URL.
//   "/uploads/products/x.png"  -> "http://localhost:5001/uploads/products/x.png"
//   "http://..." / "https://..." -> returned untouched
//   "/images/featured5.jpg"    -> returned untouched (already a website-local asset)
export function toImageUrl(path) {
    if (!path || typeof path !== 'string') {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    if (path.startsWith('/uploads/')) {
        return `${API_ORIGIN}${path}`;
    }

    return path;
}

// Slugify fallback: the API always stores a slug, but a record created before the slug field
// existed may not have one, and product URLs depend on it.
export function slugify(value) {
    if (!value) {
        return '';
    }

    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// product_type: 1 | 2 | 3 -> the website's collection tag.
// Products with no product_type are not part of any homepage collection, and products.js
// deliberately omits `tag` for those (e.g. "Hrithvik Stool"), so this returns '' rather than
// defaulting to 'featured' -- otherwise every uncategorised product would appear in Featured.
const PRODUCT_TYPE_TO_TAG = {
    1: 'featured',
    2: 'arrivals',
    3: 'onsale',
};

export function mapProductTypeTag(productType) {
    if (productType == undefined || productType === null || productType === '') {
        return '';
    }

    return PRODUCT_TYPE_TO_TAG[Number(productType)] || '';
}

// A populated reference arrives as either a sub-document (populated) or the raw id string
// (unresolved). Both are normalised to a display name, '' when unknown.
function refName(value) {
    if (!value || typeof value === 'string') {
        return '';
    }

    return value.name || '';
}

// Numbers arrive as Number from JSON, but a record that passed through a form can hold a string
// ("8"). Coerce so the cart total is never "9" + 8 = "98".
function toNumber(value, fallback = 0) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
}

// -------------------------------------------------------------------------------------------
// Category / sub-category
// -------------------------------------------------------------------------------------------
export function mapCategory(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        slug: raw.slug || slugify(raw.name),
        image: toImageUrl(raw.image),
        order: toNumber(raw.order, 0),
    };
}

export function mapSubCategory(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        slug: raw.slug || slugify(raw.name),
        image: toImageUrl(raw.image),
        order: toNumber(raw.order, 0),
        parentId: String(raw.parent_category_id?._id || raw.parent_category_id || ''),
        // Display name of the parent, flattened by the public API endpoint.
        parentName: raw.parent_category_name || refName(raw.parent_category_id),
    };
}

export function mapSubSubCategory(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        slug: raw.slug || slugify(raw.name),
        image: toImageUrl(raw.image),
        order: toNumber(raw.order, 0),
        subCategoryId: toId(raw.sub_category_id),
        subCategoryName: raw.sub_category_name || refName(raw.sub_category_id),
    };
}

// -------------------------------------------------------------------------------------------
// Product
// -------------------------------------------------------------------------------------------

export function mapProduct(raw) {
    if (!raw) {
        return null;
    }

    const name = raw.name || '';
    // sale_price is the price actually charged; actual_price is the strike-through price.
    const price = toNumber(raw.sale_price, 0);
    const oldPrice = toNumber(raw.actual_price, price);
    const images = buildGallery(raw);

    return {
        // products.js uses numeric ids, but cart keys and React keys only need a stable unique
        // string, so the ObjectId string is used as-is.
        id: String(raw._id || raw.id || ''),

        name: name,
        slug: raw.slug || slugify(name),
        // Display name of the top-level category, flattened by the public endpoint.
        category: raw.parent_category_name || refName(raw.parent_category_id) || '',
        subCategory: raw.sub_category_name || refName(raw.sub_category_id) || '',
        subSubCategory: raw.sub_sub_category_name || refName(raw.sub_sub_category_id) || '',
        parentCategoryId: toId(raw.parent_category_id),
        subCategoryId: toId(raw.sub_category_id),
        subSubCategoryId: toId(raw.sub_sub_category_id),

        price: price,
        oldPrice: oldPrice,
        // Guarantee a non-negative saving for the sale-badge components.
        discountAmount: Math.max(0, oldPrice - price),

        image: images[0] || '',
        images: images,

        tag: mapProductTypeTag(raw.product_type),
        isTrending: toNumber(raw.is_trending, 0) === 1,
        isBestSelling: toNumber(raw.is_best_sellings, 0) === 1,

        color: raw.color_name || refName(raw.color_id) || '',
        material: raw.material_name || refName(raw.material_id) || '',
        colorId: toId(raw.color_id),
        materialId: toId(raw.material_id),

        // Spec-sheet fields, in the camelCase the product detail page reads.
        code: raw.product_code || '',
        dimension: raw.dimension || '',
        estimateDeliveryDays:
            raw.estimate_delivery_days != undefined && raw.estimate_delivery_days !== ''
                ? String(raw.estimate_delivery_days)
                : '',
        shortDescription: raw.short_description || '',
        description: raw.long_description || raw.short_description || '',
    };
}

// -------------------------------------------------------------------------------------------
// Testimonial
// -------------------------------------------------------------------------------------------
// The homepage Testimonials component reads `name` / `text` / `img` / `job` / `designation`, while
// the API (and the admin form) use `name` / `message` / `image` / `rating`. Both are emitted so
// the existing component works unedited, and the canonical API names are kept alongside.
export function mapTestimonial(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        message: raw.message || '',
        image: toImageUrl(raw.image),
        rating: toNumber(raw.rating, 0),
        order: toNumber(raw.order, 0),
        // Aliases for the existing component's expected keys.
        text: raw.message || '',
        img: toImageUrl(raw.image),
        job: raw.designation || raw.job || '',
        designation: raw.designation || raw.job || '',
    };
}

// -------------------------------------------------------------------------------------------
// Why Choose Us
// -------------------------------------------------------------------------------------------
export function mapWhyChooseUs(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        title: raw.title || '',
        image: toImageUrl(raw.image),
        order: toNumber(raw.order, 0),
        description: raw.description || '',
    };
}

// -------------------------------------------------------------------------------------------
// Color / material (product detail options)
// -------------------------------------------------------------------------------------------
export function mapColor(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        code: raw.code || '',
        // The colour and material documents do not persist a `slug` column (verified against the
        // public API), so it is derived from the name. Without it the shop sidebar built its
        // filter links from `undefined`, buildHref dropped the param, and every Material/Color
        // link pointed at plain "/shop" -- so clicking one never filtered anything.
        slug: raw.slug || slugify(raw.name),
    };
}

export function mapMaterial(raw) {
    if (!raw) {
        return null;
    }

    return {
        id: String(raw._id || raw.id || ''),
        name: raw.name || '',
        // Same as mapColor: derived, because the schema has no slug field.
        slug: raw.slug || slugify(raw.name),
    };
}

// Maps a list and drops empty entries, so a null/undefined record never reaches a component.
export function mapList(rawList, mapper) {
    if (!Array.isArray(rawList)) {
        return [];
    }

    return rawList.map(mapper).filter(Boolean);
}

// The primary image plus the gallery. The product detail page treats `images` as the full gallery
// (its first entry is shown as the main image), so the primary is prepended when it is not already
// first. Duplicates are dropped so a product uploaded with the same file twice does not render two
// identical thumbnails.
export function buildGallery(raw) {
    const primary = toImageUrl(raw.image);
    const extras = Array.isArray(raw.images) ? raw.images.map(toImageUrl).filter(Boolean) : [];

    const seen = new Set();

    return [primary, ...extras].filter((url) => {
        if (!url || seen.has(url)) {
            return false;
        }
        seen.add(url);
        return true;
    });
}

function toId(value) {
    return String(value?._id || value || '');
}
