import { PackageOpen } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet.",
  description = "Create your first item to get started.",
  action = null,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="card p-10 text-center flex flex-col items-center justify-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-brand-500/10 grid place-items-center text-brand-300">
        <Icon size={24} />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="font-display text-lg">{title}</h3>
        <p className="text-sm text-ink-400">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
