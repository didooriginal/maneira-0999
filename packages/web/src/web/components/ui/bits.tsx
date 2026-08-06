import { cn } from "../../lib/utils";

export function Wave({
  className,
  fill = "#FFF6E3",
  flip = false,
}: {
  className?: string;
  fill?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block h-[52px] w-full", flip && "rotate-180", className)}
    >
      <path
        d="M0 44c120-28 240-40 360-24s240 60 360 60 240-44 360-60 240-4 360 24v46H0z"
        fill={fill}
      />
    </svg>
  );
}

export function SectionTitle({
  kicker,
  title,
  script,
  align = "left",
  className,
}: {
  kicker?: string;
  title: string;
  script?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "reveal max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {kicker ? (
        <span className="tag bg-white">{kicker}</span>
      ) : null}
      <h2 className="mt-4 text-[clamp(2rem,4.2vw,3.25rem)]">
        {title}{" "}
        {script ? (
          <span className="script text-magenta text-[1.15em] leading-none">
            {script}
          </span>
        ) : null}
      </h2>
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value} de 5 estrelas`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
          <path
            d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.6 4.9 17.3l1-5.7-4.1-4 5.7-.8z"
            fill={i < Math.round(value) ? "#EEDA10" : "#DDD3BC"}
            stroke="#0D3E77"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border-[3px] border-navy/15 bg-navy/5",
        className,
      )}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 animate-spin", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
