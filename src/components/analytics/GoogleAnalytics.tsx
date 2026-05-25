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
    <div className="fixed inset-x-3 bottom-3 z-[10000] mx-auto max-w-xl rounded-lg border border-border bg-background p-4 text-sm text-foreground shadow-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed text-muted-foreground">
          Usamos cookies para mejorar el sitio.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 font-medium hover:bg-muted"
            onClick={() => setConsent("denied")}
          >
            Rechazar
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90"
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
        strategy="beforeInteractive"
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
