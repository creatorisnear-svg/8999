/**
 * Minimal static file server for the Vite production build.
 * Used by Koyeb (and any other host) to serve the built frontend.
 *
 * Start command:  node artifacts/tiktok-dropship/static-server.mjs
 * Environment:    PORT (default 8080)
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "dist/public");
const PORT = Number(process.env.PORT ?? 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

function serveFile(res, filePath, statusCode = 200) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    // Assets with hashed filenames can be cached aggressively; HTML never.
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(res);
  return true;
}

const server = createServer((req, res) => {
  // Strip query string
  const url = req.url?.split("?")[0] ?? "/";

  // Try exact file match first
  const candidate = join(ROOT, url);
  if (serveFile(res, candidate)) return;

  // Try with .html extension
  if (serveFile(res, candidate + ".html")) return;

  // SPA fallback — always serve index.html so the React router handles routing
  if (!serveFile(res, join(ROOT, "index.html"), 200)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server running on port ${PORT}`);
});
