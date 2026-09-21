import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COLLECTIONS } from "./collections";
import { createContentStore } from "./store";

/**
 * Hold the store still between writing the new contents and putting them in
 * place. Whatever the file holds at that moment is what a process killed
 * mid-save would leave behind.
 */
const midWrite = {
  reached: () => {},
  resume: Promise.resolve<void>(undefined),
};

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    writeFile: async (...args: Parameters<typeof actual.writeFile>) => {
      const written = await actual.writeFile(...args);
      midWrite.reached();
      await midWrite.resume;
      return written;
    },
  };
});

const ORIGINAL = `---\ntitle: "Hello"\ndatetime: "2026-01-01"\n---\n\nBody.\n`;

let root: string;
let path: string;
let store: ReturnType<typeof createContentStore>;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "editor-atomic-"));
  mkdirSync(join(root, "src/content/blog"), { recursive: true });
  path = join(root, "src/content/blog/hello.md");
  writeFileSync(path, ORIGINAL);
  store = createContentStore(root, COLLECTIONS.posts);
  midWrite.reached = () => {};
  midWrite.resume = Promise.resolve();
});

/**
 * The editor saves on a timer inside a `next dev` process that is restarted
 * freely, and `writeFile` truncates the file before it fills it. A post came
 * back at zero bytes from that overlap — the save and the server's exit share
 * a second in the logs — so the new contents go to a sibling file and a rename
 * puts them in place, which the filesystem does in one step.
 */
describe("saving a post", () => {
  it("has the post whole at every moment of the write", async () => {
    let resume!: () => void;
    midWrite.resume = new Promise<void>((settle) => (resume = settle));
    const reached = new Promise<void>((settle) => (midWrite.reached = settle));

    const saving = store.write("hello", "changed\n");
    await reached;

    // The new contents exist somewhere by now. A process killed here has to
    // leave the post as it was, not truncated and not half-written.
    expect(readFileSync(path, "utf8")).toBe(ORIGINAL);

    resume();
    await saving;

    expect(readFileSync(path, "utf8")).toBe("changed\n");
  });
});
