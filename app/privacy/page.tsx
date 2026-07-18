import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/MarkdownViewer";

export default function PrivacyPage() {
  const filePath = path.join(process.cwd(), "assets/privacy.md");
  const fileContent = fs.readFileSync(filePath, "utf8");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-surface px-6 py-8 md:py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-display font-bold tracking-tight text-ink/40">Kinora Legal</span>
      </div>

      <article className="max-w-none">
        <MarkdownViewer content={fileContent} />
      </article>
    </main>
  );
}
