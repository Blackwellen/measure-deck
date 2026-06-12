import { cn } from "@/lib/utils";

const COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-[13px]",
  lg: "w-12 h-12 text-[15px]",
  xl: "w-16 h-16 text-[18px]",
};

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const baseClass = cn(
    "rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-600 select-none",
    sizeClass,
    className
  );

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn(baseClass, "object-cover")}
      />
    );
  }

  if (name) {
    const colorIdx = getColorIndex(name);
    const color = COLORS[colorIdx];
    return (
      <span className={cn(baseClass, color.bg, color.text)}>
        {getInitials(name)}
      </span>
    );
  }

  return (
    <span className={cn(baseClass, "bg-gray-100 text-gray-400")}>?</span>
  );
}

export default Avatar;
