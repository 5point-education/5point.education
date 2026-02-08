/**
 * Run Prisma Studio with env from .env.local (then .env).
 * Prisma CLI only loads .env by default; this ensures DATABASE_URL from .env.local is used.
 */
const path = require("path");
const { config } = require("dotenv");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

execSync("npx prisma studio", {
  stdio: "inherit",
  shell: true,
  cwd: root,
  env: process.env,
});
