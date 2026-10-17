import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import harbour from "@/assets/caleb-JmuyB_LibRo-unsplash.jpg";
import "./admin.css";

export default function AuthLayout({
  title,
  description,
  children,
  embedded = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  embedded?: boolean;
}) {
  const content = (
    <>
      <p className="mb-3 text-xs font-semibold uppercase text-primary">
        Community workspace
      </p>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children}
    </>
  );

  if (embedded)
    return (
      <section className="mx-auto w-full max-w-lg px-4 py-12">
        {content}
      </section>
    );

  return (
    <main className="admin-ui grid min-h-screen lg:grid-cols-[52%_48%]">
      <div className="relative min-h-[240px] overflow-hidden sm:min-h-[300px] lg:min-h-screen">
        <img
          src={harbour}
          alt="Sydney Opera House and Harbour Bridge"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-6 pb-7 pt-24 text-white lg:px-14 lg:pb-14">
          <p className="mb-3 text-xs font-bold uppercase">
            Mulembe Community NSW
          </p>
          <p className="max-w-lg text-2xl font-semibold leading-tight lg:text-4xl">
            Connected by heritage.
            <br />
            Growing together in Australia.
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col px-6 py-7 sm:px-12 lg:min-h-screen lg:py-10 xl:px-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <span
              className="brand-mark !h-8 !w-8 !text-base"
              aria-hidden="true"
            >
              M
            </span>
            Mulembe Community
          </Link>
          <Link
            to="/"
            className="flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to site
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-[410px] flex-1 flex-col justify-center py-12">
          {content}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © Mulembe Community NSW
        </p>
      </div>
    </main>
  );
}
