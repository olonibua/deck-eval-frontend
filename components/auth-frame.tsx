import { Logo } from './ui/logo';

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="confetti flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/posy/sticker-document.svg" alt="" aria-hidden className="absolute -top-12 -right-10 hidden h-28 w-28 rotate-8 sm:block" />
        <div className="rounded-frame border border-border bg-surface p-8 shadow-card sm:p-10">
          <Logo className="mb-8" />
          {children}
        </div>
        <p className="stamp mt-5 text-center">Slide-deck evaluation, one deck at a time</p>
      </div>
    </div>
  );
}
