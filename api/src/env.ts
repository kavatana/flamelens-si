/** Reads api/.env into the environment. Imported first, before anything looks a setting up. */
import { config } from "dotenv";

config({ path: ".env", quiet: true });
