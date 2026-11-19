
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(
  new URL("../../.env", import.meta.url)
);

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Supabase environment variables missing!");
  console.error("SUPABASE_URL found:", Boolean(supabaseUrl));
  console.error("SUPABASE_SECRET_KEY found:", Boolean(supabaseSecretKey));

  throw new Error("Supabase environment variables are missing");
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey
);

// console.log("Supabase URL:", supabaseUrl);
// console.log("Storage Bucket:", process.env.SUPABASE_STORAGE_BUCKET);

console.log("Supabase client configured successfully!");

export default supabase;
