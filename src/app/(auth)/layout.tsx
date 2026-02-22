import { Clock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="mb-8 flex items-center gap-2">
        <Clock className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          ShiftSync
        </span>
      </div>
      {children}
    </div>
  );
}
