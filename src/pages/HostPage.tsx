export function HostPage() {
  return (
    <main className="flex h-[100dvh] items-center justify-center bg-brown px-6 text-center">
      <div>
        <p className="font-label text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
          Host
        </p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] text-foreground">
          Host screen.
        </h1>
        <p className="mt-4 font-body text-base text-muted">
          This screen is part of a later phase.
        </p>
      </div>
    </main>
  );
}
