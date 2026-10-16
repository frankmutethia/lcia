import PublishedContent from "@/components/PublishedContent";
export default function Gallery() {
  return (
    <section id="gallery" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="mb-3 text-center text-3xl font-bold text-luhya-navy">
          Community gallery
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          Moments, connections and celebrations from our community.
        </p>
        <PublishedContent type="gallery" />
      </div>
    </section>
  );
}
