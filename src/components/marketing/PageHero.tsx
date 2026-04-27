type PageHeroProps = {
  title: string;
  subtitle: string;
};

export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="bg-[#d32f2f] px-4 py-12 text-center sm:py-14 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/95 sm:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
