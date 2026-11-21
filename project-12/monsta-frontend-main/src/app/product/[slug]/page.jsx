import { notFound } from 'next/navigation';
import { products } from '@/data/products';
import { fetchProductBySlug } from '@/lib/api';
import ProductDetail from './ProductDetail';

// Pre-render every valid product slug at build time. The hardcoded list covers the
// build; `dynamicParams` stays at its default (true) so API-only slugs such as
// `3-seater-sofa` are generated on demand instead of 404ing.
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // API first, hardcoded list second, so the title matches whichever product the
  // page actually renders.
  const product =
    (await fetchProductBySlug(slug)) || products.find((p) => p.slug === slug) || null;

  return {
    title: product ? `${product.name} - Online Furniture in India` : 'Product not found',
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;

  // Resolve from the API first (server-side, cache: 'no-store' is set in api.js).
  // Hardcoded products.js is the fallback so the page still renders if the API is
  // down. `allProducts` stays hardcoded and is used only as the slider fallback.
  const apiProduct = await fetchProductBySlug(slug);
  const product = apiProduct || products.find((p) => p.slug === slug);

  // Unknown slug in BOTH sources -> proper Next.js 404 instead of a broken page.
  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} allProducts={products} />;
}