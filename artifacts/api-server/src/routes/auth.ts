import { Router, type Request, type Response } from "express";

const router = Router();

router.post("/auth/login", (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    res.status(500).json({ error: "APP_PASSWORD environment variable is not configured" });
    return;
  }

  if (!password || password !== appPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  req.session.authenticated = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ authenticated: true });
  });
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ authenticated: false });
  });
});

router.get("/auth/me", (req: Request, res: Response) => {
  res.json({ authenticated: !!req.session.authenticated });
});

export default router;
