import './Skeleton.css';

export default function Skeleton({ variant = 'text', count = 1, className = '' }) {
  return (
    <div
      className={`skeleton skeleton--${variant}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton__item">
          {variant === 'product-card' && (
            <>
              <div className="skeleton__image" />
              <div className="skeleton__details">
                <div className="skeleton__text skeleton__text--sm" />
                <div className="skeleton__text skeleton__text--lg" />
                <div className="skeleton__text skeleton__text--md" />
              </div>
            </>
          )}
          {variant === 'testimonial' && (
            <>
              <div className="skeleton__text skeleton__text--lg" />
              <div className="skeleton__text" />
              <div className="skeleton__text skeleton__text--md" />
            </>
          )}
          {variant === 'list' && (
            <>
              <div className="skeleton__thumb" />
              <div className="skeleton__lines">
                <div className="skeleton__text skeleton__text--md" />
                <div className="skeleton__text skeleton__text--sm" />
              </div>
            </>
          )}
          {variant === 'card' && (
            <>
              <div className="skeleton__image skeleton__image--circle" />
              <div className="skeleton__text skeleton__text--md" />
              <div className="skeleton__text skeleton__text--sm" />
            </>
          )}
          {variant === 'text' && <div className="skeleton__text skeleton__text--md" />}
        </div>
      ))}
    </div>
  );
}
