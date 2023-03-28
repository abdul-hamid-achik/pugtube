import { log as logger } from "next-axiom";

export const log = process.env.NODE_ENV === "development" ? logger : console;
