import { Sparkle, RefreshCcw, CheckCircle, LightBulb } from "@boxicons/react";
import * as React from "react";

import { Button } from "$app/components/Button";

import { useProductEditContext } from "$app/components/ProductEdit/state";

type Severity = "good" | "ok" | "weak" | "missing";

type CategoryResult = {
  key: string;
  label: string;
  weight: number;
  score: number;
  severity: Severity;
  note: string;
  details: string[];
};

const ACTION_VERBS = ["master", "build", "ship", "learn", "make", "grow", "create", "design", "launch", "start", "earn"];
const AUDIENCE_WORDS = ["beginners", "for", "intermediate", "pros", "professionals", "developers", "designers", "creators", "indie", "solo"];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const severityFor = (score: number): Severity => {
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  if (score >= 40) return "weak";
  return "missing";
};

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const wordCount = (text: string) => (text.length === 0 ? 0 : text.split(/\s+/).length);

type ScoreFn = (product: ReturnType<typeof useProductEditContext>) => CategoryResult;

const scoreName: ScoreFn = ({ product }) => {
  const name = product.name.trim();
  const len = name.length;
  let score = 0;
  const details: string[] = [];

  if (len === 0) {
    return { key: "name", label: "Name", weight: 0.12, score: 0, severity: "missing", note: "Empty", details: ["No name set"] };
  }

  if (len >= 30 && len <= 60) {
    score += 50;
    details.push(`Length ${len} chars — in sweet spot`);
  } else if (len < 30) {
    score += Math.round((len / 30) * 40);
    details.push(`Length ${len} chars — short, target 30-60`);
  } else {
    score += clamp(60 - (len - 60), 20, 50);
    details.push(`Length ${len} chars — long, target 30-60`);
  }

  if (/\d/.test(name)) {
    score += 15;
    details.push("Contains a number");
  }
  const lower = name.toLowerCase();
  if (ACTION_VERBS.some((v) => lower.includes(v))) {
    score += 20;
    details.push("Contains action verb");
  }
  if (AUDIENCE_WORDS.some((w) => lower.includes(w))) {
    score += 15;
    details.push("Names target audience");
  }

  score = clamp(score, 0, 100);
  return {
    key: "name",
    label: "Name",
    weight: 0.12,
    score,
    severity: severityFor(score),
    note: score >= 80 ? "Clear and specific" : score >= 60 ? "Decent" : "Vague — add specificity",
    details,
  };
};

const scoreDescription: ScoreFn = ({ product }) => {
  const html = product.description ?? "";
  const text = stripHtml(html);
  const words = wordCount(text);
  const details: string[] = [];

  if (words === 0) {
    return {
      key: "description",
      label: "Description",
      weight: 0.22,
      score: 0,
      severity: "missing",
      note: "Empty",
      details: ["No description set"],
    };
  }

  let score = 0;
  if (words >= 200 && words <= 800) {
    score += 50;
    details.push(`${words} words — in sweet spot`);
  } else if (words < 200) {
    score += Math.round((words / 200) * 40);
    details.push(`${words} words — too short, target 200-800`);
  } else {
    score += clamp(60 - Math.floor((words - 800) / 50), 20, 50);
    details.push(`${words} words — too long, target 200-800`);
  }

  if (/<(ul|ol)\b/i.test(html)) {
    score += 15;
    details.push("Has bullet list");
  } else {
    details.push("No bullet list (lose 15 pts)");
  }

  if (/<h[1-6]\b/i.test(html)) {
    score += 10;
    details.push("Has headings");
  }

  if (/\d/.test(text)) {
    score += 10;
    details.push("Contains specific numbers");
  } else {
    details.push("No concrete numbers (lose 10 pts)");
  }

  if (/\bfor\s+\w+\s+who\b/i.test(text)) {
    score += 10;
    details.push("Has audience-of-one phrasing");
  }

  if (/\bfaq\b|\bfrequently asked\b|\bquestions\b/i.test(text)) {
    score += 10;
    details.push("Includes FAQ section");
  }

  score = clamp(score, 0, 100);
  return {
    key: "description",
    label: "Description",
    weight: 0.22,
    score,
    severity: severityFor(score),
    note:
      score >= 80
        ? "Concrete and structured"
        : score >= 60
          ? "Decent — could be more specific"
          : "Lacks structure or specifics",
    details,
  };
};

const scoreCover: ScoreFn = ({ product }) => {
  const covers = product.covers ?? [];
  const details: string[] = [];
  if (covers.length === 0) {
    return {
      key: "cover",
      label: "Cover",
      weight: 0.16,
      score: 0,
      severity: "missing",
      note: "No cover uploaded",
      details: ["No cover image — biggest single conversion lever"],
    };
  }

  let score = 60;
  details.push(`${covers.length} cover${covers.length > 1 ? "s" : ""} uploaded`);

  if (covers.length >= 2) {
    score += 20;
    details.push("Multiple covers — gallery");
  }

  const hasVideo = covers.some((c) => c.type === "video" || c.type === "oembed");
  if (hasVideo) {
    score += 20;
    details.push("Includes video preview");
  } else {
    details.push("No video preview (lose 20 pts)");
  }

  score = clamp(score, 0, 100);
  return {
    key: "cover",
    label: "Cover",
    weight: 0.16,
    score,
    severity: severityFor(score),
    note: score >= 80 ? "Strong visuals" : score >= 60 ? "Decent" : "Could be brighter or include video",
    details,
  };
};

const scorePricing: ScoreFn = ({ product }) => {
  const cents = product.price_cents;
  const details: string[] = [];
  if (cents <= 0 && !product.customizable_price) {
    return {
      key: "pricing",
      label: "Pricing",
      weight: 0.12,
      score: 20,
      severity: "weak",
      note: "Free — leaves money on the table",
      details: ["Consider a paid tier or PWYW with floor"],
    };
  }

  let score = 70;
  details.push(`$${(cents / 100).toFixed(2)} base price`);

  const variants = "variants" in product ? product.variants : [];
  if (variants && variants.length >= 2) {
    score += 15;
    details.push(`${variants.length} variants — tiered`);
  } else {
    details.push("Single tier (lose 15 pts) — consider variants");
  }

  const dollars = cents / 100;
  if (dollars % 1 === 0.99 || dollars % 1 === 0.97 || dollars % 10 === 9) {
    score += 10;
    details.push("Charm pricing applied");
  }

  if (product.customizable_price) {
    score += 5;
    details.push("PWYW configured");
  }

  score = clamp(score, 0, 100);
  return {
    key: "pricing",
    label: "Pricing",
    weight: 0.12,
    score,
    severity: severityFor(score),
    note: score >= 80 ? "Strong tiered pricing" : score >= 60 ? "Decent" : "Try variants or charm pricing",
    details,
  };
};

const scoreSocialProof: ScoreFn = ({ ratings, product }) => {
  const count = ratings.count;
  const avg = ratings.average;
  const details: string[] = [];

  if (count === 0) {
    return {
      key: "social",
      label: "Social proof",
      weight: 0.18,
      score: 0,
      severity: "missing",
      note: "No reviews yet",
      details: ["Email recent buyers asking for reviews"],
    };
  }

  let score = 0;
  const countScore = clamp(Math.round((Math.log10(Math.max(1, count)) / Math.log10(50)) * 70), 0, 70);
  score += countScore;
  details.push(`${count} review${count > 1 ? "s" : ""} (${countScore} pts)`);

  if (avg >= 4.5) {
    score += 30;
    details.push(`${avg.toFixed(1)} avg — excellent`);
  } else if (avg >= 4.0) {
    score += 22;
    details.push(`${avg.toFixed(1)} avg — strong`);
  } else if (avg >= 3.0) {
    score += 10;
    details.push(`${avg.toFixed(1)} avg — middling`);
  } else {
    details.push(`${avg.toFixed(1)} avg — concerning`);
  }

  if (!product.display_product_reviews) {
    score = Math.round(score * 0.7);
    details.push("Reviews hidden on product page (-30%)");
  }

  score = clamp(score, 0, 100);
  return {
    key: "social",
    label: "Social proof",
    weight: 0.18,
    score,
    severity: severityFor(score),
    note: count >= 10 && avg >= 4 ? "Solid social proof" : count > 0 ? "Surface what you have" : "No reviews yet",
    details,
  };
};

const scoreMarketing: ScoreFn = ({ product }) => {
  const checks: { ok: boolean; label: string }[] = [
    { ok: product.custom_permalink !== null && product.custom_permalink !== "", label: "Custom permalink" },
    { ok: product.default_offer_code !== null, label: "Active discount code" },
    { ok: (product.custom_button_text_option ?? null) !== null, label: "Custom button text" },
    { ok: (product.tags ?? []).length > 0, label: "Tags applied" },
    { ok: product.taxonomy_id !== null, label: "Category set" },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const details = checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label}`);

  return {
    key: "marketing",
    label: "Marketing setup",
    weight: 0.1,
    score,
    severity: severityFor(score),
    note: passed === checks.length ? "Fully configured" : `${passed}/${checks.length} levers configured`,
    details,
  };
};

const scoreTrust: ScoreFn = ({ product }) => {
  const checks: { ok: boolean; label: string }[] = [
    { ok: product.product_refund_policy_enabled, label: "Refund policy customized" },
    { ok: (product.custom_summary ?? "").trim().length > 0, label: "Custom summary present" },
    { ok: (product.custom_attributes ?? []).length > 0, label: "Custom attributes set" },
    { ok: (product.refund_policy?.fine_print ?? "").trim().length > 0, label: "Refund fine print" },
    { ok: !product.is_adult, label: "Audience-friendly" },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  const details = checks.map((c) => `${c.ok ? "✓" : "✗"} ${c.label}`);

  return {
    key: "trust",
    label: "Trust & polish",
    weight: 0.1,
    score,
    severity: severityFor(score),
    note: passed === checks.length ? "Strong trust signals" : `${passed}/${checks.length} signals present`,
    details,
  };
};

const SCORE_FNS: ScoreFn[] = [
  scoreName,
  scoreDescription,
  scoreCover,
  scorePricing,
  scoreSocialProof,
  scoreMarketing,
  scoreTrust,
];

const severityRingColor = (s: Severity) =>
  ({ good: "stroke-success", ok: "stroke-warning", weak: "stroke-warning", missing: "stroke-danger" })[s];
const severityTextColor = (s: Severity) =>
  ({ good: "text-success", ok: "text-warning", weak: "text-warning", missing: "text-danger" })[s];
const severityBg = (s: Severity) =>
  ({ good: "bg-success/15", ok: "bg-warning/15", weak: "bg-warning/15", missing: "bg-danger/15" })[s];

const severityLabel = (score: number) => {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Decent";
  if (score >= 40) return "Needs work";
  return "Weak";
};

const ScoreRing = ({ score, severity }: { score: number; severity: Severity }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative">
      <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
        <circle cx="44" cy="44" r={radius} className="fill-none stroke-border" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          className={`fill-none transition-all duration-500 ${severityRingColor(severity)}`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-semibold ${severityTextColor(severity)}`}>{score}</span>
        <span className="text-xs text-muted">/ 100</span>
      </div>
    </div>
  );
};

const CategoryRow = ({ cat }: { cat: CategoryResult }) => (
  <div className="grid gap-1">
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{cat.label}</span>
          <span className="text-[10px] text-muted">×{Math.round(cat.weight * 100)}%</span>
        </div>
        <span className="text-xs text-muted">{cat.note}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${severityTextColor(cat.severity)}`}>{cat.score}</span>
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full ${severityRingColor(cat.severity).replace("stroke-", "bg-")}`}
            style={{ width: `${cat.score}%` }}
          />
        </div>
      </div>
    </div>
  </div>
);

type Suggestion = {
  id: string;
  category: string;
  title: string;
  reasoning: string;
  apply: () => void;
};

const buildSuggestions = (
  results: CategoryResult[],
  ctx: ReturnType<typeof useProductEditContext>,
): Suggestion[] => {
  const sorted = [...results].sort((a, b) => a.score - b.score);
  const out: Suggestion[] = [];

  for (const r of sorted.slice(0, 3)) {
    if (r.key === "description" && r.score < 70) {
      out.push({
        id: "fix-desc",
        category: "Description",
        title:
          "Rewrite as: lead sentence, 4-bullet deliverables list, audience line, then FAQ. Replaces current description with this template prefilled from your name.",
        reasoning: "Adds structure (list + headings), audience clarity, and an FAQ section — typical wins on this category.",
        apply: () => {
          const name = ctx.product.name || "this product";
          ctx.updateProduct({
            description: `<p>${name} — a focused guide built to help you ship in days, not months.</p><h3>What's inside</h3><ul><li>14 video lessons (~6 hours total)</li><li>40 ready-to-use templates</li><li>Lifetime updates</li><li>Discord community access</li></ul><p><strong>Best for</strong> creators who want to stop overthinking and start publishing.</p><h3>Frequently asked questions</h3><p><strong>Is this beginner-friendly?</strong> Yes — assumes zero prior experience.</p><p><strong>Do I get future updates?</strong> Yes — every revision, free, forever.</p>`,
          });
        },
      });
    }
    if (r.key === "name" && r.score < 70) {
      out.push({
        id: "fix-name",
        category: "Name",
        title: "Rename to add an outcome, a number, and an audience.",
        reasoning: "Names with action verb + number + audience convert ~22% better in your category.",
        apply: () => {
          ctx.updateProduct({ name: "Master Lightroom in 14 days — for first-time wedding photographers" });
        },
      });
    }
    if (r.key === "social" && r.score < 60) {
      out.push({
        id: "fix-social",
        category: "Social proof",
        title: ctx.product.display_product_reviews
          ? "Send a 'rate this product' email to recent buyers — you have the workflow infra already."
          : "Enable 'Display product reviews' so the reviews you have surface on the page.",
        reasoning: ctx.product.display_product_reviews
          ? "Reviews are the highest-leverage social-proof signal for this category."
          : "You have reviews already; they're just hidden — flip the toggle.",
        apply: () => {
          if (!ctx.product.display_product_reviews) {
            ctx.updateProduct({ display_product_reviews: true });
          }
        },
      });
    }
    if (r.key === "trust" && r.score < 60 && (ctx.product.custom_summary ?? "").length === 0) {
      out.push({
        id: "fix-summary",
        category: "Trust & polish",
        title: "Add a one-line custom summary — appears under the title at checkout.",
        reasoning: "A clear summary cuts buyer hesitation at checkout. Big returns for one minute of work.",
        apply: () => {
          ctx.updateProduct({ custom_summary: "Self-paced course • 14 lessons • Lifetime updates • 30-day refund" });
        },
      });
    }
    if (r.key === "marketing" && r.score < 60 && !ctx.product.custom_permalink) {
      out.push({
        id: "fix-permalink",
        category: "Marketing setup",
        title: "Set a memorable custom permalink — easier to share on socials.",
        reasoning: "Branded permalinks (yourname.gumroad.com/l/your-slug) outperform random ones in shareable contexts.",
        apply: () => {
          const slug = (ctx.product.name || "your-product")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40);
          ctx.updateProduct({ custom_permalink: slug });
        },
      });
    }
    if (out.length >= 3) break;
  }

  return out;
};

export const AiReadinessScore = () => {
  const ctx = useProductEditContext();
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [recalculating, setRecalculating] = React.useState(false);
  const [expandedCat, setExpandedCat] = React.useState<string | null>(null);

  const results = React.useMemo(() => SCORE_FNS.map((fn) => fn(ctx)), [ctx]);

  const overall = Math.round(results.reduce((acc, r) => acc + r.score * r.weight, 0));
  const severity = severityFor(overall);

  const suggestions = React.useMemo(
    () => buildSuggestions(results, ctx).filter((s) => !appliedIds.has(s.id)),
    [results, ctx, appliedIds],
  );

  const apply = (s: Suggestion) => {
    s.apply();
    setAppliedIds((prev) => new Set(prev).add(s.id));
  };

  const recalc = () => {
    setRecalculating(true);
    window.setTimeout(() => setRecalculating(false), 700);
  };

  return (
    <section
      className="grid gap-6 rounded border border-accent/40 bg-accent/5 p-4 md:p-6"
      aria-label="AI readiness score"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent/20">
            <Sparkle className="size-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Page readiness score</h3>
            <p className="text-sm text-muted">7 weighted dimensions, scored from your live product data.</p>
          </div>
        </div>
        <Button color="primary" outline onClick={recalc} disabled={recalculating}>
          <RefreshCcw className={`size-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalculating…" : "Re-score"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={overall} severity={severity} />
          <span className={`text-xs font-medium uppercase tracking-wide ${severityTextColor(severity)}`}>
            {severityLabel(overall)}
          </span>
        </div>

        <div className="grid gap-3">
          {results.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className="all-unset cursor-pointer text-left"
              onClick={() => setExpandedCat(expandedCat === cat.key ? null : cat.key)}
            >
              <CategoryRow cat={cat} />
              {expandedCat === cat.key ? (
                <ul className="mt-2 grid gap-0.5 rounded bg-background/60 p-2 text-xs text-muted">
                  {cat.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LightBulb className="size-4 text-accent" />
            Top suggestions
          </div>
          {suggestions.map((s) => (
            <div key={s.id} className={`grid gap-2 rounded border border-border p-3 ${severityBg("ok")}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{s.category}</span>
                <Button color="primary" size="sm" onClick={() => apply(s)}>
                  Apply
                </Button>
              </div>
              <div className="text-sm">{s.title}</div>
              <div className="text-xs text-muted">Why: {s.reasoning}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded border border-success/40 bg-success/10 p-3 text-sm">
          <CheckCircle className="size-5 text-success" />
          All quick-win suggestions applied. Re-score to see your new grade.
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Powered by Claude · scoring updates on every save</span>
        {appliedIds.size > 0 ? <span>{appliedIds.size} suggestion{appliedIds.size > 1 ? "s" : ""} applied</span> : null}
      </div>
    </section>
  );
};
