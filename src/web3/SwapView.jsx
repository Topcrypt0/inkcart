import { lazy, Suspense } from 'react';

// The LI.FI widget is ~1–2 MB; it only downloads when someone opens Swap & Bridge or hits a Buy button.
const Widget = lazy(() => import('./Widget.jsx'));

export function SwapView() {
  return (
    <Suspense fallback={<div className="loading"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><p className="muted">Loading LI.FI…</p></div>}>
      <Widget />
    </Suspense>
  );
}
