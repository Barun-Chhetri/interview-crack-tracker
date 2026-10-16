import { Metadata } from "next";
import { PublicProgressView } from "@/components/PublicProgressView";

export const metadata: Metadata = {
  title: "Public Verified Progress & Study Log | 180-Day SWE Prep",
  description:
    "Audited daily study time logs, LeetCode anchor problems solved, pattern mastery, and Summer 2027 Software Engineering Internship progress.",
};

export default function PublicPage() {
  return <PublicProgressView />;
}
