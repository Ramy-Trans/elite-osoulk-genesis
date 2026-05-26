import serverless from "serverless-http";
import app from "../../server/index.js";

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // Netlify rewrites /api/* → /.netlify/functions/api/:splat
  // so event.path becomes /.netlify/functions/api/some/path
  // Express routes are registered at /api/... — restore the prefix.
  const FN_BASE = "/.netlify/functions/api";

  const rewrite = (p) => {
    if (!p) return "/api/";
    if (p.startsWith(FN_BASE)) {
      const rest = p.slice(FN_BASE.length) || "/";
      return "/api" + (rest.startsWith("/") ? rest : "/" + rest);
    }
    // Already has /api prefix (called directly or via rawUrl)
    return p;
  };

  event.path    = rewrite(event.path);
  event.rawPath = rewrite(event.rawPath ?? event.path);

  return serverlessHandler(event, context);
};
