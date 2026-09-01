import Link from "next/link";
import type { Metadata } from "next";
import { DarkPageShell } from "@/components/blog/DarkPageShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "隱私說明 • Leo Chiu",
  description: "這個網站與電子報收集什麼資料、為什麼收、怎麼刪掉。",
  alternates: { canonical: `${SITE_URL}/privacy/` },
};

/**
 * What this site actually stores, written from the code rather than from a
 * template.
 *
 * It exists for two reasons: subscribers deserve to know what happens to an
 * address they hand over, and Turnstile's invisible mode is permitted only on
 * the condition that this page references Cloudflare's Turnstile Privacy
 * Addendum. The reference is in the last section, and removing it would put the
 * subscribe form out of compliance.
 */
export default function PrivacyPage() {
  return (
    <DarkPageShell>
      <h1 className="mt-2 font-sans text-4xl font-extrabold leading-tight tracking-tight">
        隱私說明
      </h1>
      <p className="mt-3 font-sans text-lg leading-snug text-muted-foreground">
        這個網站收集什麼、為什麼收、怎麼要求刪掉。寫得具體，因為含糊的隱私政策等於沒有。
      </p>

      <div className="prose prose-lg prose-zinc mt-8 border-t border-border pt-8">
        <h2>訂閱電子報時</h2>
        <p>
          你在訂閱表單送出的<strong>電子郵件地址</strong>，會存在 Cloudflare D1
          資料庫裡。同一列還會記下：
        </p>
        <ul>
          <li>目前狀態（等待確認、已確認、已退訂、無法投遞）</li>
          <li>送出訂閱、寄出確認信、完成確認、退訂各自的時間</li>
          <li>
            你從哪一頁送出訂閱的（例如 <code>/blog/某篇文章/</code>）
          </li>
        </ul>
        <p>
          後面兩項是<strong>同意紀錄</strong>
          ：如果將來有人問「這個地址為什麼在你的名單裡」，我要能回答。
        </p>
        <p>
          <strong>不會收名字，也沒有名字欄位。</strong>
          表單只有一個輸入框，因為寄一份電子報不需要知道你叫什麼。
        </p>

        <h2>確認信與寄送</h2>
        <p>
          訂閱要經過二次確認：你送出地址之後會收到一封信，點裡面的連結才算完成。 確認連結在 24
          小時後失效。這道手續是為了確保沒有人能用別人的信箱訂閱。
        </p>
        <p>
          沒有完成確認的地址不會進入寄送名單，也會在之後的清理中刪除。想要立刻刪除，寄信告訴我。
        </p>
        <p>
          信件透過 <strong>Resend</strong> 寄送，所以已確認的地址也會存在 Resend
          那邊，作為寄送名單。Resend 會記錄投遞結果，也可能記錄開信與點擊。
          權威的名單在我自己的資料庫，Resend 那份是為了寄信而存在的副本。
        </p>

        <h2>退訂</h2>
        <p>每一封電子報都有退訂連結，點一下就結束，不需要登入、不會問你為什麼。</p>
        <p>
          退訂之後，<strong>你的地址不會被刪掉</strong>，而是被標記為已退訂。
          這聽起來違反直覺，但那筆紀錄正是「不要再寄給這個人」的證據 ——
          如果刪掉，將來匯入舊備份或更換寄送服務時，你可能會再收到信。
          想要完全刪除，寄信到下面的地址跟我說，我手動處理。
        </p>

        <h2>網站本身</h2>
        <p>
          這個網站沒有廣告、沒有第三方追蹤腳本、沒有 cookie 橫幅，因為沒有需要同意的 cookie。
          網站託管在 Cloudflare，它會保留一般的伺服器日誌。
        </p>

        <h2>機器人防護（Cloudflare Turnstile）</h2>
        <p>
          訂閱表單受 <strong>Cloudflare Turnstile</strong> 保護，用來擋自動化的濫用 ——
          沒有它，任何人都能拿這個表單對別人的信箱寄出大量確認信。
          它以隱藏模式運作，所以你不會看到任何要點擊的東西。
        </p>
        <p>
          Turnstile 會處理一些用來判斷是不是機器人的訊號，包括
          <strong>用戶端 IP 位址、TLS 指紋、User-Agent、以及 sitekey 與來源網域</strong>。
          這些訊號由 Cloudflare 處理，用途僅限偵測與阻擋機器人。
        </p>
        <p>
          依 Cloudflare 對隱藏模式的要求，此處引用{" "}
          <a
            href="https://www.cloudflare.com/turnstile-privacy-policy/"
            target="_blank"
            rel="noopener"
          >
            Cloudflare Turnstile Privacy Addendum
          </a>
          ，它是 Cloudflare 隱私政策的補充文件。
        </p>

        <h2>聯絡</h2>
        <p>
          關於資料的任何問題 —— 包括要求刪除 —— 寄到{" "}
          <a href="mailto:hi@leochiu.com">hi@leochiu.com</a>。
        </p>
      </div>

      <p className="mt-10 font-sans text-sm text-muted-foreground">
        回到{" "}
        <Link href="/newsletter/" className="underline hover:text-gold">
          電子報
        </Link>
        。
      </p>
    </DarkPageShell>
  );
}
