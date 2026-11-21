'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import './ImageWithSkeleton.css';

/**
 * Renders a product photo behind an animated shimmer placeholder.
 *
 * Why this exists: the theme painted a flat grey `.product_image_wrapper` block
 * while photos were in flight, so slow or below-the-fold images looked like
 * "stuck grey cards". This swaps that for an explicit shimmer and fades the real
 * image in over it, so a slow network reads as loading rather than broken.
 *
 * It is a drop-in for either element the codebase already used:
 *
 *   // next/image with `fill`
 *   <ImageWithSkeleton src={url} alt={name} fill sizes="25vw" className="product_image" />
 *
 *   // next/image with a fixed box
 *   <ImageWithSkeleton src={url} alt={name} width={70} height={70}
 *                      style={{ objectFit: 'contain' }} />
 *
 *   // plain <img>
 *   <ImageWithSkeleton src={url} alt={name} className="product_image" />
 *
 * Which element is rendered is inferred from the props, so a call site keeps the
 * exact behaviour it had: `fill` or a width+height pair -> next/image (so
 * optimisation is preserved); neither -> a plain <img>.
 *
 * The wrapper mirrors the image's own sizing so layout is untouched:
 *   - `fill`                          -> wrapper fills its positioned parent
 *   - width+height with a fluid style -> wrapper is full width, reserving the
 *                                       image's aspect ratio so nothing reflows
 *   - width+height in a fixed box     -> wrapper takes those pixel dimensions
 *   - neither                         -> wrapper fills its parent
 *
 * `loading="lazy"` is intentionally NOT added by default: next/image is already
 * lazy unless `priority` is set, and adding it to the plain <img> would delay the
 * above-the-fold carousels. Pass `loading` to opt in explicitly.
 */
export default function ImageWithSkeleton({
    src,
    alt = '',
    className = '',
    width,
    height,
    sizes,
    fill = false,
    priority = false,
    loading,
    style,
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const wrapperRef = useRef(null);

    // A new src is a brand-new load, so drop back to the shimmer first. Without
    // this the product gallery would keep the previous image's "loaded" state and
    // the new photo would pop in with no placeholder.
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    // A cached image can finish decoding before React attaches onLoad, in which
    // case onLoad never fires and the image would sit at opacity 0 forever. Settle
    // immediately if the DOM node is already complete.
    useEffect(() => {
        const node = wrapperRef.current?.querySelector('img');

        if (!node || !node.complete) {
            return;
        }

        if (node.naturalWidth > 0) {
            setIsLoaded(true);
        } else {
            setHasError(true);
        }
    }, [src]);

    const isSized = !fill && width != null && height != null;

    // A fluid dimension (a percentage in the caller's `style`) means the image is
    // stretched to its column rather than pinned to its intrinsic size, so the
    // wrapper must be fluid too instead of a fixed width x height box.
    const isFluid =
        isSized && typeof style?.width === 'string' && style.width.includes('%');

    const useNextImage = fill || isSized;
    const isLoading = !isLoaded && !hasError;

    const wrapperClasses = [
        'img-skeleton-wrapper',
        isLoading ? 'img-skeleton-wrapper--loading' : '',
        fill || !isSized ? 'img-skeleton-wrapper--fill' : '',
        isFluid ? 'img-skeleton-wrapper--fluid' : '',
    ]
        .filter(Boolean)
        .join(' ');

    // Reserving the box up front is what stops the shimmer collapsing to zero
    // height (and the page from reflowing when the image arrives).
    const wrapperStyle = isFluid
        ? { aspectRatio: `${width} / ${height}` }
        : isSized
            ? { width, height }
            : undefined;

    const imageClassName = ['img-skeleton-img', isLoaded ? 'img-skeleton-img--loaded' : '', className]
        .filter(Boolean)
        .join(' ');

    // In a fixed-size box the image is pinned to the reserved box; elsewhere it
    // keeps whatever sizing the caller asked for.
    const imageStyle = isSized && !isFluid
        ? { width: '100%', height: '100%', ...style }
        : style;

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(false);
    };

    return (
        <span
            ref={wrapperRef}
            className={wrapperClasses}
            style={wrapperStyle}
            data-skeleton-state={isLoading ? 'loading' : hasError ? 'error' : 'loaded'}
        >
            {isLoading && <span className="img-skeleton-shimmer" aria-hidden="true" />}

            {hasError ? (
                // Same fallback markup the product page uses for a missing image, so
                // a dead URL degrades to an icon instead of a broken-image glyph.
                <span
                    className="img-skeleton-error"
                    role="img"
                    aria-label={alt ? `${alt} (image unavailable)` : 'Image unavailable'}
                >
                    <i className="fa fa-picture-o" aria-hidden="true" />
                </span>
            ) : useNextImage ? (
                <Image
                    src={src}
                    alt={alt}
                    className={imageClassName}
                    style={imageStyle}
                    sizes={sizes}
                    priority={priority}
                    {...(fill ? { fill: true } : { width, height })}
                    {...(loading ? { loading } : {})}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            ) : (
                <img
                    src={src}
                    alt={alt}
                    className={imageClassName}
                    style={imageStyle}
                    sizes={sizes}
                    {...(loading ? { loading } : {})}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </span>
    );
}
