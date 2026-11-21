'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import './RouteProgress.css';

export default function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRouteKey = useRef(routeKey);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) {
      return undefined;
    }

    previousRouteKey.current = routeKey;
    setLoading(true);
    setProgress(0);

    let hideTimer;
    const timers = [
      setTimeout(() => setProgress(30), 50),
      setTimeout(() => setProgress(60), 150),
      setTimeout(() => setProgress(90), 300),
      setTimeout(() => {
        setProgress(100);
        hideTimer = setTimeout(() => setLoading(false), 200);
      }, 500),
    ];

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(hideTimer);
    };
  }, [routeKey]);

  if (!loading) {
    return null;
  }

  return (
    <div className="route_progress" aria-hidden="true">
      <div
        className="route_progress_bar"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
