import { Hono } from "hono";
import { cors } from "hono/cors";
import { audioCatalogRoutes } from "./routes/audio-catalog";
import { authRoutes } from "./routes/auth";
import { diagRoutes } from "./routes/diag";
import { practiceRoutes } from "./routes/practice";
import { studentRoutes } from "./routes/students";
import type { Env } from "./types";

type AppVariables = {
  guardian: {
    id: string;
    email: string;
    display_name: string | null;
  };
};

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", cors({ origin: (_origin, c) => c.env.APP_ORIGIN, credentials: true }));
app.route("/auth", authRoutes);
app.route("/students", studentRoutes);
app.route("/practice", practiceRoutes);
app.route("/guardian/audio-catalog", audioCatalogRoutes);
app.route("/guardian/diag", diagRoutes);

export default app;
