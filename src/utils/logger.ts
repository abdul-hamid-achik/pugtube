import { log } from "next-axiom";

const logger = process.env.NODE_ENV === "production" ? log : console;

export default logger;
