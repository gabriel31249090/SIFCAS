import { cache } from "react";

/** A consistent, request-scoped timestamp for dynamic server-rendered pages. */
export const getRequestTimestamp = cache(() => Date.now());
