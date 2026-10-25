import React from "react";
import { Link } from "react-router-dom";

// Primary: ink fill, paper text, radius 2px, hover lifts 1px with hard offset shadow.
// Secondary: underlined text link with arrow.
export default function JournalButton({
  children,
  to,
  href,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) {
  const base =
    "font-grotesk font-medium text-sm transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const styles =
    variant === "primary"
      ? "inline-flex items-center justify-center gap-2 rounded-[2px] bg-journal-ink px-5 py-2.5 text-journal-paper shadow-[3px_3px_0_0_var(--j-stamp)] hover:-translate-y-px active:translate-y-0"
      : "inline-flex items-center justify-center gap-1 text-journal-ink underline decoration-journal-stamp decoration-1 underline-offset-4 hover:text-journal-stamp";
  const cls = `${base} ${styles} ${className}`;
  const inner =
    variant === "secondary" ? (
      <>
        {children}
        <span aria-hidden="true"> →</span>
      </>
    ) : (
      children
    );

  if (to) return <Link to={to} className={cls} onClick={onClick}>{inner}</Link>;
  if (href) return <a href={href} className={cls} onClick={onClick}>{inner}</a>;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}
