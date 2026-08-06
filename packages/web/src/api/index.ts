import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { admin } from "./routes/admin";
import { catalog } from "./routes/catalog";
import { checkout } from "./routes/checkout";
import { quotes } from "./routes/quotes";

export const router = {
  admin,
  catalog,
  checkout,
  quotes,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

export default app;
