import { redirect } from "next/navigation";

/** The Earth applications now live on the Safety page. */
export default function Page() {
  redirect("/safety#earth");
}
