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
} from "@/lib/analytics";

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function hasGrantedConsent() {
  return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
}

function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!isAnalyticsEnabled) return;

    const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "granted" || stored === "denied") return;

    setVisible(true);
  }, []);

  const setConsent = (consent: AnalyticsConsent) => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
    if (consent === "granted") {
      window.dispatchEvent(new Event("analytics-consent-granted"));
    }
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

function PageViewTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = React.useRef<string | null>(null);

  const trackCurrentPage = React.useCallback(() => {
    if (!enabled || !isAnalyticsEnabled || !hasGrantedConsent()) return;
    const path = getCurrentPath();
    if (lastPathRef.current === path) return;

    lastPathRef.current = path;
    trackPageView(path);
  }, [enabled]);

  React.useEffect(() => {
    trackCurrentPage();
  }, [pathname, searchParams, trackCurrentPage]);

  React.useEffect(() => {
    if (!enabled || !isAnalyticsEnabled) return;

    window.addEventListener("hashchange", trackCurrentPage);
    window.addEventListener("popstate", trackCurrentPage);

    return () => {
      window.removeEventListener("hashchange", trackCurrentPage);
      window.removeEventListener("popstate", trackCurrentPage);
    };
  }, [enabled, trackCurrentPage]);

  return null;
}

export default function GoogleAnalytics() {
  const [consent, setConsent] = React.useState<AnalyticsConsent | null>(null);

  React.useEffect(() => {
    if (!isAnalyticsEnabled) return;

    const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (stored === "granted" || stored === "denied") {
      setConsent(stored as AnalyticsConsent);
    }

    const onConsentGranted = () => setConsent("granted");
    window.addEventListener("analytics-consent-granted", onConsentGranted);
    return () =>
      window.removeEventListener("analytics-consent-granted", onConsentGranted);
  }, []);

  if (!isAnalyticsEnabled || !GA_MEASUREMENT_ID) return null;

  const analyticsAllowed = consent === "granted";

  return (
    <>
      {analyticsAllowed && (
        <>
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
`,
            }}
          />
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
        </>
      )}
      <React.Suspense fallback={null}>
        <PageViewTracker enabled={analyticsAllowed} />
      </React.Suspense>
      <ConsentBanner />
    </>
  );
}
