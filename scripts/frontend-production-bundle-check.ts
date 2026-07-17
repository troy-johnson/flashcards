import { assertFrontendProductionBundle } from "./cloudflare-production-deploy.ts";

const main = async () => {
  await assertFrontendProductionBundle();
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
