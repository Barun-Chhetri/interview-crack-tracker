import { Metadata } from "next";
import { PublicProgressView } from "@/components/PublicProgressView";

export const metadata: Metadata = {
  title: "Barun Chhetri | 180-Day SWE Interview Preparation & Daily Study Log",
  description:
    "Audited daily study time logs, LeetCode anchor problems solved, pattern mastery, and Summer 2027 Software Engineering Internship progress for Barun Chhetri (UNT, F-1 Visa).",
  openGraph: {
    title: "Barun Chhetri | 180-Day SWE Study Log & Solved Problems",
    description:
      "Public verified timeline tracking 540 study hours, 180 LeetCode anchor problems, CS fundamentals, and system design.",
    type: "website",
  },
};

export default function SharePage() {
  return <PublicProgressView />;
}
