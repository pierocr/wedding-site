export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const isAnalyticsEnabled =
  process.env.NODE_ENV === "production" && Boolean(GA_MEASUREMENT_ID);

export const ANALYTICS_CONSENT_KEY = "ga_consent";

export type AnalyticsConsent = "granted" | "denied";

export type AnalyticsEventName =
  | "rsvp_click"
  | "map_click"
  | "calendar_click"
  | "gift_info_click"
  | "gallery_view"
  | "music_request_click";

export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "js" | "config" | "event" | "consent",
      target: string | Date,
      params?: AnalyticsEventParams,
    ) => void;
  }
}

const canUseGtag = () =>
  typeof window !== "undefined" &&
  isAnalyticsEnabled &&
  typeof window.gtag === "function" &&
  Boolean(GA_MEASUREMENT_ID);

export function trackPageView(path: string, title?: string) {
  if (!canUseGtag()) return;

  window.gtag?.("event", "page_view", {
    page_location: `${window.location.origin}${path}`,
    page_path: path,
    page_title: title ?? document.title,
  });
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (!canUseGtag()) return;

  window.gtag?.("event", eventName, {
    event_category: "engagement",
    ...params,
  });
}

export function updateAnalyticsConsent(consent: AnalyticsConsent) {
  if (!canUseGtag()) return;

  window.gtag?.("consent", "update", {
    analytics_storage: consent,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}
