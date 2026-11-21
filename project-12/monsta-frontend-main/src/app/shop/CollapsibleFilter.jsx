'use client';

import { useEffect, useId, useState } from 'react';

export default function CollapsibleFilter({ title, children, className = '', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 992px)');
    const syncOpenState = () => setOpen(desktopQuery.matches || defaultOpen);

    syncOpenState();
    desktopQuery.addEventListener('change', syncOpenState);

    return () => desktopQuery.removeEventListener('change', syncOpenState);
  }, [defaultOpen]);

  return (
    <div className={`collapsible_filter${open ? ' open' : ''}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="collapsible_filter_heading"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span>{title}</span>
        <i className={`fa fa-chevron-${open ? 'up' : 'down'}`} aria-hidden="true" />
      </button>
      <div id={bodyId} className="collapsible_filter_body">
        {children}
      </div>
    </div>
  );
}
