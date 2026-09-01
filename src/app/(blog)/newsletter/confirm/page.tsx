import Link from "next/link";
import type { Metadata } from "next";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";

export const metadata: Metadata = {
  title: "確認訂閱 • Leo Chiu",
  // A page that only ever holds somebody's signed token has no business in an index.
  robots: { index: false, follow: false },
};

/**
 * Where the confirmation link in the email lands.
 *
 * The link does not confirm anything by itself. Mail clients fetch links to
 * scan them, so a subscription confirmed by a GET would be a subscription
 * nobody consented to — the button below is what actually confirms.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <h1 className="mt-2 font-sans text-3xl font-extrabold leading-tight tracking-tight">
        確認訂閱
      </h1>

      <div className="mt-6 border-t border-border pt-6">
        {token ? (
          <>
            <p className="mb-4 font-sans text-base leading-relaxed">按下面的按鈕就完成訂閱。</p>
            <TokenActionForm
              token={token}
              endpoint="/api/newsletter/confirm/"
              action="確認訂閱"
              tone="primary"
              doneMessage="訂閱完成了，下一期會寄到你的信箱。"
              goneMessage="這個地址之前退訂過，所以這個連結不會把它加回來。想重新訂閱的話，回訂閱頁重新送一次就好。"
            />
          </>
        ) : (
          <p className="font-sans text-base leading-relaxed">
            這個連結少了確認碼。請從信裡的連結進來，或到{" "}
            <Link href="/newsletter/" className="underline">
              訂閱頁
            </Link>{" "}
            重新送一次。
          </p>
        )}
      </div>
    </>
  );
}
