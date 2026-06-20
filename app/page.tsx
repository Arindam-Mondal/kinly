import { redirect } from "next/navigation";

// Entry point: send users into the app. Middleware bounces unauthenticated visitors
// from /home to /login.
export default function RootPage() {
  redirect("/home");
}
