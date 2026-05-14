import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
import "./types/session.d.ts";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Allow specific origins via ALLOWED_ORIGINS env var (comma-separated).
// Falls back to wide-open for local development.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors(
    allowedOrigins.length > 0
      ? {
          origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) {
              cb(null, true);
            } else {
              cb(new Error(`CORS: origin '${origin}' not allowed`));
            }
          },
          credentials: true,
        }
      : { credentials: true, origin: true },
  ),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

// Auth guard — all /api routes require authentication except /auth/* and /healthz
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
  const open = req.path.startsWith("/auth/") || req.path === "/healthz";
  if (open || req.session.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
});

app.use("/api", router);

// ─── Production: serve Vite-built frontend ────────────────────────────────────
// In production (on Koyeb, etc.) the built frontend lives next to this file in
// a "public/" sub-directory that the build script places there.
if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(import.meta.dirname, "public");

  app.use(express.static(publicDir, { maxAge: "1h" }));

  // SPA fallback — any non-API route returns index.html so client-side routing works
  app.get("/{*path}", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
// Express 5 async errors are automatically forwarded here.
// This ensures all unhandled errors return JSON instead of crashing the process.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { status?: number; statusCode?: number }).statusCode
    ?? 500;

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");

  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
