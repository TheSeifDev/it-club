import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/interview/login?mode=content");
}
