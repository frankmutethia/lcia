import PublishedContent from "@/components/PublishedContent";
export default function BusinessDirectory() {
  return (
    <section
      id="business"
      className="scroll-mt-24 bg-luhya-cream/30 py-16 sm:py-20"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="mb-3 text-center text-3xl font-bold text-luhya-navy">
          Business directory
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          Discover and support businesses in our community.
        </p>
        <PublishedContent type="business" />
        <h3 className="mb-6 text-xl font-semibold">Business categories</h3>
        <PublishedContent type="category" />
      </div>
    </section>
  );
}
