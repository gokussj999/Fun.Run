import { useCallback, useState } from "react";

function inferToastType(text) {
  const msg = String(text || "").toLowerCase();
  if (!msg) return "default";

  if (
    msg.includes("fail") ||
    msg.includes("error") ||
    msg.includes("timeout") ||
    msg.includes("required") ||
    msg.includes("invalid") ||
    msg.includes("not enough") ||
    msg.includes("no wallet") ||
    msg.includes("no deposit") ||
    msg.includes("select a coin") ||
    msg.includes("enter address") ||
    msg.includes("enter amount")
  ) {
    return "error";
  }

  if (
    msg.includes("success") ||
    msg.includes("copied") ||
    msg.includes("claimed") ||
    msg.includes("created") ||
    msg.includes("connected") ||
    msg.includes("sent ") ||
    msg.includes("processed") ||
    msg.includes("opened") ||
    msg.includes("disconnected") ||
    msg.includes("logged out")
  ) {
    return "success";
  }

  if (msg.includes("wait") || msg.includes("initializing") || msg.includes("check phantom")) {
    return "warning";
  }

  return "default";
}

export function useToast() {
  const [toast, setToast] = useState({ text: "", type: "default" });

  const showToast = useCallback((text, type, duration) => {
    const message = String(text || "");
    if (!message) {
      setToast({ text: "", type: "default" });
      return;
    }
    const next = { text: message, type: type || inferToastType(message) };
    if (duration !== undefined) next.duration = duration;
    setToast(next);
  }, []);

  const clearToast = useCallback(() => {
    setToast({ text: "", type: "default" });
  }, []);

  return { toast, showToast, clearToast };
}
