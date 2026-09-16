import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted: the two faces ship with the build, so a reader's browser never
// calls out to a font service. Newsreader carries its optical-size axis, which
// is what lets the same face set a 68px headline and a 13px footnote.
import "@fontsource-variable/newsreader/standard.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "@fontsource-variable/source-sans-3/wght.css";
import "@fontsource-variable/source-sans-3/wght-italic.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
