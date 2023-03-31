import { log as logger } from "next-axiom";

import fetch from "node-fetch";

// @ts-ignore
global.fetch = fetch

export const log = process.env.NODE_ENV === "production" ? logger : console;
