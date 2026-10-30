import Image from "next/image";
import { Suspense } from "react";
import { SendPreview } from "./SendPreview";

// `.dev.tsx` — a route only while `next dev` is running. See
// src/lib/editor/dev-routes.ts.

/**
 * The send dialog and its paper plane, to press without mailing anyone.
 *
 * Laid out as the editor lays out a professional Post — the `dark` wrapper, the
 * header across the top, the same column — so what folds here is what folds
 * there, colours included. The theme lives on that wrapper, not on <html>, and
 * a preview without it would fold a light page the editor never shows.
 */
export default function SendPreviewPage() {
  return (
    <div className="dark min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/90 px-6 py-3 font-sans text-sm backdrop-blur">
        <Suspense fallback={null}>
          <SendPreview />
        </Suspense>
      </header>
      <main className="@container flex w-full flex-col items-center px-6 pb-32 pt-10 font-garamond sm:px-10">
        <div data-letter className="w-full min-w-0 max-w-[45.5rem]">
          <h1 className="font-sans text-3xl font-extrabold leading-[1.3] sm:text-4xl md:text-5xl">
            AI 時代的工程師，該往哪裡走？
          </h1>
          <p className="mt-3 font-sans text-xl leading-snug text-muted-foreground">
            延伸上篇：從四篇論文洞察 AI 的極限，這次我們談「人」
          </p>
          <div className="prose prose-lg prose-zinc relative mt-6 max-w-none border-t border-border pt-6 sm:mt-8 sm:pt-8">
            <figure>
              <Image
                src="/blog-images/ai-engineer-where-to-go-hero.webp"
                alt="雪地上的兩台單車，往遠方的冰河前進"
                width={1200}
                height={675}
              />
            </figure>
            <p>
              這一年寫程式的方式變了很多。以前花在查文件、寫樣板的時間，現在大多交給了
              agent；剩下的，是決定要做什麼、怎麼驗收、什麼時候該停。
            </p>
            <p>
              上一篇從四篇論文看 AI 的極限：它會在長鏈推理裡走偏，會把沒看過的情境硬套成看過的，
              也很難自己發現哪裡錯了。這些極限不會因為模型變大就消失，它們決定了人該站在哪裡。
            </p>
            <h2>判斷力變成主要的產出</h2>
            <p>
              以前一個工程師的價值，很大一部分在「寫得出來」。現在寫得出來的成本趨近於零，
              值錢的變成「知道該寫什麼、寫出來的東西對不對」。驗收、取捨、說不，這些都是判斷。
            </p>
            <p>
              判斷力沒辦法速成，但可以刻意練：每次讓 agent 交稿之前，先自己寫下你預期它會怎麼做、
              哪裡最可能出錯。交稿之後對答案，久了你會知道自己的直覺在哪些地方可靠。
            </p>
            <h2>把流程寫下來</h2>
            <p>
              團隊裡最常見的浪費，是同一個坑每個人都踩一次。把踩過的坑寫成規則、寫成檢查， agent
              會照著做，新人也會照著做。這比任何一次 code review 都省事。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
