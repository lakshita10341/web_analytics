// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect immediately to /login
  redirect("/login");
}