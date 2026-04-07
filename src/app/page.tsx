import Link from "next/link";
import { ZeeusLogo } from "@/components/layout/ZeeusLogo";
import {
  ArrowRight,
  Leaf,
  TrendingUp,
  Globe2,
  ShieldCheck,
  Zap,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-surface-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <ZeeusLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/app/evaluate/start"
              className="btn-primary text-sm"
            >
              Start evaluation
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #39B54A 0%, #00654A 100%)', opacity: 0.97 }} />
        <div className="absolute inset-0 pattern-circles opacity-30" />
        {/* Decorative SVG circles */}
        <div className="absolute right-0 top-0 opacity-10">
          <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
            <circle cx="400" cy="100" r="300" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="500" cy="200" r="200" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="350" cy="350" r="180" stroke="white" strokeWidth="0.8" fill="none" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-zeeus-lime animate-pulse" />
              <span className="text-white text-xs font-semibold tracking-wide">Sustainability by Design (SbyD) Tool</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Build a startup that's{" "}
              <span className="text-zeeus-lime">right for people,</span>
              <br />
              the planet, and your{" "}
              <span className="text-zeeus-lime">bottom line.</span>
            </h1>

            <p className="text-white/85 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              The ZEEUS SbyD Tool weaves sustainability into your startup decisions from day one.
              This is a{" "}
              <strong className="text-white">guidance tool, not a judgment tool</strong> — helping
              you align with UN SDGs and ESRS dual materiality in a startup-friendly way.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/app/evaluate/start"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-brand-dark px-7 py-3.5 text-base font-bold shadow-lg hover:bg-zeeus-lime hover:text-white transition-all duration-200"
              >
                Start your evaluation
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 text-white px-7 py-3.5 text-base font-semibold transition-all duration-200" style={{ borderColor: 'rgba(255,255,255,0.5)' }}
              >
                Sign in
              </Link>
            </div>

            {/* Tagline */}
            <p className="mt-8 text-white/60 text-sm italic">
              "SDGs are a map, not a checklist. Use them to spot hot spots early and design smarter."
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">How the tool works</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Four steps from startup context to actionable sustainability roadmap.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: <Globe2 size={20} />,
                title: "Enter startup context",
                desc: "Your stage, country, NACE division, offering type, and innovation approach.",
              },
              {
                step: "02",
                icon: <BarChart3 size={20} />,
                title: "Stage I — Holistic Assessment",
                desc: "Assess financial, environmental (E1–E5), social & governance (S1–S4, G1) indicators inside-out.",
              },
              {
                step: "03",
                icon: <ShieldCheck size={20} />,
                title: "Stage II — Risks & Opportunities",
                desc: "Evaluate 10 risks and 10 opportunities from the outside-in using a probability × impact matrix.",
              },
              {
                step: "04",
                icon: <TrendingUp size={20} />,
                title: "Dashboard & SDG Alignment",
                desc: "Get your impact summary, SDG alignment, top risks/opportunities, and actionable recommendations.",
              },
            ].map((item) => (
              <div key={item.step} className="card relative overflow-hidden group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200">
                <div className="absolute top-3 right-3 text-5xl font-black text-surface-border group-hover:text-brand/10 transition-colors">
                  {item.step}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key principles */}
      <section className="bg-white py-20 border-t border-surface-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Leaf size={22} className="text-brand" />,
                title: "Qual before quant — by design",
                desc: "Early-stage founders rarely have perfect measurements. ESRS explicitly begins with qualitative judgements. L/M/H is a legitimate first pass.",
              },
              {
                icon: <Globe2 size={22} className="text-brand" />,
                title: "SDGs are a map, not a checklist",
                desc: "You don't need all 169 targets at once. You need the few relevant to your model today. The tool selects them by stage and NACE sector.",
              },
              {
                icon: <Zap size={22} className="text-brand" />,
                title: "Built on accountability",
                desc: "The tool rewards honesty. Genuine inputs strengthen your case with buyers, partners, investors, and regulators as you scale.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16" style={{ backgroundColor: '#00654A' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Sustainability isn't extra work.
          </h2>
          <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto">
            It's how you design a product and a business that wins in the better economy.
            Start your first evaluation in under 5 minutes.
          </p>
          <Link
            href="/app/evaluate/start"
            className="inline-flex items-center gap-2 rounded-xl bg-zeeus-lime text-zeeus-dark px-8 py-3.5 text-base font-bold hover:bg-brand hover:text-white transition-all duration-200 shadow-lg"
          >
            Start free evaluation
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-surface-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <ZeeusLogo />
          <p className="text-xs text-gray-400 text-center">
            ZEEUS — Zero Emissions Entrepreneurship for Universal Sustainability.
            Developed by TUAS – Trier University of Applied Sciences, IfaS.
            Funded by the European Union (EIT).
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
