import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import PaperGrain from "@/components/journal/PaperGrain";
import Stamp from "@/components/journal/Stamp";
import MarginNote from "@/components/journal/MarginNote";

const displayFont = { fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' };

// Shared styles for the auth forms — ledger fields on paper, no boxed UI kit.
export const authLabel =
  "font-plexmono text-[10px] uppercase tracking-[0.14em] text-journal-ink-soft";
export const authInput =
  "w-full border border-journal-rule bg-journal-paper py-2.5 pl-10 pr-3 font-grotesk text-sm text-journal-ink placeholder:text-journal-ink-soft/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp";
export const authLink =
  "font-medium text-journal-ink underline decoration-journal-stamp underline-offset-4 hover:text-journal-stamp focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp";
export const authGhostBtn =
  "mb-2 flex w-full items-center justify-center gap-2 border border-journal-rule bg-journal-paper py-2.5 font-grotesk text-sm font-medium text-journal-ink shadow-[3px_3px_0_0_transparent] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--j-stamp)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp";

export function AuthError({ children }) {
  return (
    <div className="mb-4 border border-dashed border-journal-stamp/60 bg-journal-paper px-3 py-2 font-plexmono text-[11px] leading-relaxed text-journal-stamp">
      {children}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-journal-rule" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-journal-card px-3 font-plexmono text-[10px] uppercase tracking-[0.16em] text-journal-ink-soft">
          or
        </span>
      </div>
    </div>
  );
}

function WashiTape() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-3 left-8 z-10 h-6 w-24"
      style={{
        background: "color-mix(in srgb, var(--j-stamp) 32%, transparent)",
        opacity: 0.75,
        transform: "rotate(-4deg)",
        clipPath: "polygon(2% 0, 98% 4%, 100% 96%, 0 100%)",
      }}
    />
  );
}

// Signing in is getting stamped into the journal: a taped-down access card on
// paper, with a postmark that thunks in on mount.
export default function AuthLayout({ title, subtitle, footer, note, children }) {
  const reduce = useReducedMotion();
  const today = new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="min-h-screen bg-journal-paper px-5 py-10 sm:py-16">
      <PaperGrain />
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md flex-col items-center justify-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full rotate-[-0.6deg] border border-journal-rule bg-journal-card px-6 pb-7 pt-8 shadow-[0_18px_40px_-18px_rgba(30,27,22,0.35)] sm:px-8"
        >
          <WashiTape />
          <div className="absolute right-5 top-5">
            <Stamp country="Field journal" code="Admit one" date={today} shape="rect" animate rotation={-5} delay={0.3} />
          </div>

          <Link to="/" className="font-plexmono text-[10px] uppercase tracking-[0.18em] text-journal-stamp no-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-journal-stamp">
            Jejak · Field journal
          </Link>
          <h1 className="mt-3 font-serif-display text-4xl leading-[1.05] text-journal-ink" style={displayFont}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-grotesk text-[14px] leading-relaxed text-journal-ink-soft">{subtitle}</p>
          )}

          <div className="mt-6">{children}</div>
        </motion.div>

        {footer && <div className="mt-5 text-center font-grotesk text-sm text-journal-ink-soft">{footer}</div>}
        <MarginNote tone="ink" className="mt-3">
          {note || "your entries stay yours"}
        </MarginNote>
      </div>
    </div>
  );
}
