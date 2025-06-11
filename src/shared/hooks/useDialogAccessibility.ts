import { useEffect } from "react";

export function useDialogAccessibility(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEffect(() => {
    if (!ref.current) return;

    document.body.style.overflow = "hidden";

    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ];
    const focusables = ref.current.querySelectorAll<HTMLElement>(selectors.join(","));
    setTimeout(() => focusables[0]?.focus(), 0);

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      trapFocus(e);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, onClose]);
}
