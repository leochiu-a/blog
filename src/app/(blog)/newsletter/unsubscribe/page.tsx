import Link from "next/link";
import type { Metadata } from "next";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";

export const metadata: Metadata = {
  title: "退訂 • Leo Chiu",
  robots: { index: false, follow: false },
};

/**
 * Where the unsubscribe link in every Issue lands.
 *
 * No sign-in, no "tell us why", no survey — one button. The link is signed, so
 * clicking it is proof enough, and anything standing between a reader and
 * leaving turns an unsubscribe into a spam report.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <h1 className="mt-2 font-sans text-3xl font-extrabold leading-tight tracking-tight">退訂</h1>

      <div className="mt-6 border-t border-border pt-6">
        {token ? (
          <>
            <p className="mb-4 font-sans text-base leading-relaxed">
              按一下就不會再收到電子報。以後想回來，隨時可以再訂閱。
            </p>
            <TokenActionForm
              token={token}
              endpoint="/api/newsletter/unsubscribe/"
              action="確認退訂"
              tone="neutral"
              doneMessage="退訂完成，不會再寄了。謝謝你曾經讀過。"
            />
          </>
        ) : (
          <p className="font-sans text-base leading-relaxed">
            這個連結少了退訂碼。請用電子報裡的退訂連結，或直接回信告訴我，我手動處理。回到{" "}
            <Link href="/newsletter/" className="underline">
              訂閱頁
            </Link>
            。
          </p>
        )}
      </div>
    </>
  );
}
