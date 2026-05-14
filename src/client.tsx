import { StrictMode, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { getRouter } from "./router";

const router = getRouter();

startTransition(() => {
  createRoot(document).render(
    <StrictMode>
      <StartClient router={router} />
    </StrictMode>,
  );
});
