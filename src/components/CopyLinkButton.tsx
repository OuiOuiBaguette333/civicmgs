import { useEffect, useState } from "react";

type Status = "idle" | "copied" | "failed";

const MESSAGES: Record<Status, string> = {
  idle: "Copy link",
  copied: "Link copied",
  failed: "Couldn't copy",
};

/** The scenario lives in the address bar, so sharing it is one click. */
export function CopyLinkButton() {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle") return;

    const timer = setTimeout(() => setStatus("idle"), 2500);

    return () => clearTimeout(timer);
  }, [status]);

  const copy = () => {
    // The clipboard API only exists in a secure context, so over plain http
    // from another device on the network it is simply absent.
    const clipboard = globalThis.navigator.clipboard;

    if (!clipboard) {
      setStatus("failed");
      return;
    }

    clipboard.writeText(globalThis.location.href).then(
      () => setStatus("copied"),
      () => setStatus("failed"),
    );
  };

  return (
    <>
      <button type="button" onClick={copy}>
        {MESSAGES[status]}
      </button>

      <span role="status" className="visually-hidden">
        {status === "idle" ? "" : MESSAGES[status]}
      </span>
    </>
  );
}
