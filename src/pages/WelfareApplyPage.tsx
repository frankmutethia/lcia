import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import WelfareApplicationForm from "@/components/WelfareApplicationForm";
import { COMMUNITY_REGISTRATION_FEE, WELFARE_CONTRIBUTION, JOINING_TOTAL } from "@/constants/welfare";
import { EMAIL } from "@/constants/contact";

export default function WelfareApplyPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Welfare Membership Form | Mulembe Community NSW";
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-luhya-cream/30">
      <header className="border-b border-luhya-navy/10 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luhya-gold">
            <img src={`${import.meta.env.BASE_URL}lcia-logo.jpg`} alt="" className="h-12 w-12 object-contain" />
            <span className="text-sm font-bold leading-5 text-luhya-navy sm:text-base">
              Mulembe Community<span className="block text-xs font-medium text-muted-foreground">NSW Incorporated</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-luhya-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luhya-gold">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to website
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-6 text-center text-sm sm:text-base text-luhya-navy">
          Joining contribution: Community registration fee <strong>${COMMUNITY_REGISTRATION_FEE}</strong> + Welfare
          contribution <strong>${WELFARE_CONTRIBUTION}</strong> = <strong>${JOINING_TOTAL} AUD</strong>, paid securely
          online after you submit this form.
        </p>
        <WelfareApplicationForm />
      </main>
      <footer className="border-t border-luhya-navy/10 bg-white px-4 py-8 text-center text-sm text-muted-foreground print:hidden">
        <p>Need help with your application?</p>
        <a href={`mailto:${EMAIL}`} className="mt-2 inline-block break-all text-luhya-navy underline underline-offset-4">{EMAIL}</a>
      </footer>
    </div>
  );
}
