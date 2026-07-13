import { useEffect, useState } from "react";

const MOBILE_WIDTH_QUERY = "(max-width: 1023px)";
const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

function detectMobileLayout() {
  if (typeof window === "undefined") return true;

  // Phones/tablets: narrow viewport OR touch-primary device (real mobile)
  if (window.matchMedia(MOBILE_WIDTH_QUERY).matches) return true;
  if (window.matchMedia(TOUCH_QUERY).matches) return true;

  return false;
}

export function useMobileLayout() {
  const [mobile, setMobile] = useState(detectMobileLayout);

  useEffect(() => {
    const widthMq = window.matchMedia(MOBILE_WIDTH_QUERY);
    const touchMq = window.matchMedia(TOUCH_QUERY);

    const refresh = () => setMobile(detectMobileLayout());

    refresh();
    widthMq.addEventListener("change", refresh);
    touchMq.addEventListener("change", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      widthMq.removeEventListener("change", refresh);
      touchMq.removeEventListener("change", refresh);
      window.removeEventListener("orientationchange", refresh);
    };
  }, []);

  return mobile;
}
