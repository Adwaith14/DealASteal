import Image from 'next/image';
import Link from 'next/link';
import { DealSearchBarForm } from './DealSearchBarForm';

export function HomeMarketingHero() {
  return (
    <section
      className="relative isolate -mt-2 w-full overflow-hidden border-b border-slate-200/80 bg-slate-100"
      aria-labelledby="marketing-hero-heading"
    >
      {/* Mesh gradient backdrop (soft blue / lavender / purple blobs) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-slate-100" />
        <div className="absolute left-[10%] top-[8%] h-[min(55vw,28rem)] w-[min(70vw,36rem)] rounded-full bg-sky-400/45 blur-[100px] sm:blur-[120px]" />
        <div className="absolute right-[-5%] top-[20%] h-[min(60vw,26rem)] w-[min(65vw,30rem)] rounded-full bg-violet-400/42 blur-[100px] sm:blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[min(50vw,22rem)] w-[min(80vw,34rem)] rounded-full bg-fuchsia-300/38 blur-[90px] sm:bottom-[-5%]" />
        <div className="absolute left-1/2 top-[35%] h-[min(45vw,20rem)] w-[min(90vw,40rem)] -translate-x-1/2 rounded-full bg-indigo-400/40 blur-[110px]" />
        <div className="absolute inset-0 bg-linear-to-b from-white/25 via-transparent to-white/45" />
      </div>

      <Image
        src="/marketing/hero-shopping-cart-2.png"
        alt=""
        width={720}
        height={360}
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1 z-1 w-[min(58vw,28rem)] object-contain opacity-60 drop-shadow-md sm:bottom-1 sm:left-3 sm:w-[min(52vw,30rem)] lg:bottom-2 lg:left-5 lg:w-[min(36vw,24rem)]"
      />
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-7 lg:px-8 lg:pb-14 lg:pt-8">
        <div className="grid min-h-[min(64vh,28rem)] grid-cols-1 items-center gap-8 lg:min-h-[min(72vh,34rem)] lg:grid-cols-2 lg:gap-10 xl:gap-14">
          <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
            <div className="relative w-full max-w-[min(100%,32rem)] lg:max-w-none">
              <Image
                src="/marketing/hero-deals-dashboard.png"
                alt="Deals dashboard preview with live offers, affiliate analytics, and flash sale items."
                width={720}
                height={576}
                priority
                className="h-auto w-full object-contain filter-[drop-shadow(0_8px_28px_rgba(15,23,42,0.08))_drop-shadow(0_20px_48px_rgba(99,102,241,0.06))]"
                sizes="(max-width: 1024px) 95vw, 52vw"
              />
            </div>
          </div>

          <div className="order-1 flex flex-col items-center text-center lg:order-2 lg:items-start lg:justify-center lg:text-left">
            <h1
              id="marketing-hero-heading"
              className="max-w-xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#0B1340] sm:text-4xl md:text-[2.5rem] md:leading-tight"
            >
              <span className="text-yellow-500">AI-Powered</span>{' '}
              Savings at Your Fingertips
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">
              We algorithmically vet thousands of offers daily to bring you professional-grade deals. Experience the
              smartest way to shop for tech, fashion, and more.
            </p>

            <DealSearchBarForm inputId="hero-search-q" className="mt-7 w-full max-w-xl lg:mt-8" />

            <div className="mt-7 flex w-full max-w-xl flex-wrap justify-center gap-3 lg:mt-8 lg:justify-start">
              <Link
                href="/#expiring-deals"
                className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-2xl bg-[#26BBA4] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#1fa08d]"
              >
                Explore Today&apos;s Deals
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-2xl border-2 border-indigo-300/80 bg-white/60 px-6 py-2.5 text-sm font-bold text-indigo-700 backdrop-blur-sm transition hover:border-indigo-400 hover:bg-white/90"
              >
                How it Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
