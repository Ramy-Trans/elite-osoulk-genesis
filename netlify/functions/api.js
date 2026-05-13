// Netlify serverless entry point — wraps Express with serverless-http
import serverless from "serverless-http";
import app from "../../server/index.js";

export const handler = serverless(app, {
  // Strip the Netlify function path prefix so Express routes match normally
  request(req) {
    req.url = req.url.replace(/^\/.netlify\/functions\/api/, "") || "/";
    return req;
  },
});
