import { remoteEnv } from "@/lib/newsletter/remote-env";
import { subscriberCounts, type SubscriberCounts } from "@/lib/newsletter/subscribers";
import { NavLink } from "@/components/NavLink";

// `.dev.tsx` — a route only while `next dev` is running, so the deployed app has
// no dashboard to protect. See src/lib/editor/dev-routes.ts.

// The figures are the point, so they are read per request rather than at build.
export const dynamic = "force-dynamic";

async function loadCounts(): Promise<SubscriberCounts> {
  const env = await remoteEnv();
  return await subscriberCounts(env.NEWSLETTER_DB);
}

/**
 * One figure. The number leads at a size you can read from across the desk,
 * because the whole page exists to be glanced at, and the line underneath says
 * what it counts in the terms the schema uses.
 */
function Figure({
  label,
  count,
  hint,
  muted = false,
}: {
  label: string;
  count: number;
  hint: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-4xl font-extrabold tabular-nums ${muted ? "text-muted-foreground" : ""}`}
      >
        {count.toLocaleString("en-US")}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export default async function SubscribersDashboard() {
  let counts: SubscriberCounts | null = null;
  let error: string | null = null;

  try {
    counts = await loadCounts();
  } catch (cause) {
    // Reaching the deployed database needs a network and a Wrangler login, and
    // either can be missing on a laptop. Say so on the page — an unhandled
    // throw here would show a stack trace that names neither.
    error = cause instanceof Error ? cause.message : String(cause);
  }

  return (
    // Dark, like the editor index: this is chrome rather than a post, and
    // `html:has(.dark)` in globals.css carries the tokens up to the document.
    <div className="dark min-h-screen font-sans">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/90 px-6 py-3 font-sans text-sm backdrop-blur">
        <NavLink href="/editor">← Editor</NavLink>
      </header>

      <main className="mx-auto w-full max-w-[45.5rem] px-6 pb-16 pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Subscribers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dev-only dashboard · 讀的是線上的訂閱名單
        </p>

        {error !== null && (
          <div className="mt-10 rounded-lg border border-destructive/50 p-5">
            <p className="font-bold">讀不到線上的訂閱名單</p>
            <p className="mt-2 text-sm text-muted-foreground">
              需要網路，以及這台機器上的 Wrangler 登入（<code>pnpm wrangler login</code>）。
            </p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
              {error}
            </pre>
          </div>
        )}

        {counts !== null && (
          <>
            {/* The two figures that were asked for, on their own row and at
                full width — the other two are context for these. */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <Figure label="已訂閱" count={counts.confirmed} hint="驗證過信箱，下一期會收到。" />
              <Figure
                label="未驗證"
                count={counts.pending}
                hint="送出了表單，但還沒點驗證信裡的連結。"
              />
            </div>

            {/* Below the fold of attention: these two only ever grow, and
                nothing is done about them day to day. */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Figure
                label="已退訂"
                count={counts.unsubscribed}
                hint="退訂過。這筆紀錄永久保留，不會再寄。"
                muted
              />
              <Figure label="退信" count={counts.bounced} hint="寄送硬性失敗的信箱。" muted />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
