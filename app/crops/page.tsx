// Crops are now managed inside the unified Farm Manager page (/farms tab=crops)
import { redirect } from "next/navigation";

export default function CropsPage() {
  redirect("/farms");
}
