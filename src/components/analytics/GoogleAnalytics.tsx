"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ANALYTICS_CONSENT_KEY,
  GA_MEASUREMENT_ID,
  type AnalyticsConsent,
  isAnalyticsEnabled,
  trackPageView,
  updateAnalyticsConsent,
} from "@/lib/analytics";

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isAnalyticsEnabled) return;

    const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      updateAnalyticsConsent(stored as AnalyticsConsent);
      return;
    }

    setVisible(true);
  }, []);

  const setConsent = (consent: AnalyticsConsent) => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
    updateAnalyticsConsent(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[10000] mx-auto max-w-xl rounded-lg border border-neutral-950/20 bg-white p-4 text-sm text-neutral-950 shadow-2xl dark:border-white/20 dark:bg-neutral-950 dark:text-white">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="leading-relaxed text-neutral-800 dark:text-neutral-200">
          Usamos cookies para mejorar el sitio.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-md border border-neutral-950/30 bg-white px-4 py-2 font-medium text-neutral-950 hover:bg-neutral-100 dark:border-white/30 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"
            onClick={() => setConsent("denied")}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md bg-[#315640] px-4 py-2 font-medium text-white hover:bg-[#284835]"
            onClick={() => setConsent("granted")}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isAnalyticsEnabled) return;

    const path = getCurrentPath();
    if (lastPathRef.current === path) return;

    lastPathRef.current = path;
    trackPageView(path);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (!isAnalyticsEnabled) return;

    const onLocationChange = () => {
      const path = getCurrentPath();
      if (lastPathRef.current === path) return;

      lastPathRef.current = path;
      trackPageView(path);
    };

    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);

    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  return null;
}

export default function GoogleAnalytics() {
  if (!isAnalyticsEnabled || !GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
`,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
`,
        }}
      />
      <React.Suspense fallback={null}>
        <PageViewTracker />
      </React.Suspense>
      <ConsentBanner />
    </>
  );
}
