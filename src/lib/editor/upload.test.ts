// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { type UploadProgress, uploadFile } from "./upload";

/**
 * A stand-in for the browser's XMLHttpRequest that lets a test drive the two
 * halves of an upload by hand: bytes going out, then the server's answer.
 */
class FakeUpload extends EventTarget {}

class FakeRequest extends EventTarget {
  static last: FakeRequest;

  readonly upload = new FakeUpload();
  status = 0;
  responseText = "";
  opened: [string, string] | null = null;
  sent: FormData | null = null;

  constructor() {
    super();
    FakeRequest.last = this;
  }

  open(method: string, url: string) {
    this.opened = [method, url];
  }

  send(body: FormData) {
    this.sent = body;
  }

  /** Bytes leaving the browser. */
  progress(loaded: number, total: number) {
    this.upload.dispatchEvent(
      Object.assign(new Event("progress"), { lengthComputable: true, loaded, total }),
    );
  }

  /** The server's answer. */
  respond(status: number, body: string) {
    this.upload.dispatchEvent(new Event("load"));
    this.status = status;
    this.responseText = body;
    this.dispatchEvent(new Event("load"));
  }
}

vi.stubGlobal("XMLHttpRequest", FakeRequest);

const file = () => new File(["…"], "clip.mov", { type: "video/quicktime" });

function start() {
  const seen: UploadProgress[] = [];
  const result = uploadFile<{ src: string }>("/api/editor/videos/", file(), (progress) =>
    seen.push(progress),
  );
  return { seen, result, request: FakeRequest.last };
}

describe("uploadFile", () => {
  it("POSTs the file to the endpoint", async () => {
    const { request, result } = start();

    expect(request.opened).toEqual(["POST", "/api/editor/videos/"]);
    expect(request.sent?.get("file")).toBeInstanceOf(File);

    request.respond(201, JSON.stringify({ src: "/videos/clip.mp4" }));
    await expect(result).resolves.toEqual({ src: "/videos/clip.mp4" });
  });

  it("reports bytes sent, then the unmeasurable wait for the server", async () => {
    const { seen, request, result } = start();

    request.progress(25, 100);
    request.progress(100, 100);
    request.respond(201, "{}");
    await result;

    expect(seen).toEqual([
      { phase: "sending", ratio: 0.25 },
      { phase: "sending", ratio: 1 },
      { phase: "processing" },
    ]);
  });

  it("rejects with the server's own reason", async () => {
    const { request, result } = start();

    request.respond(413, JSON.stringify({ error: "影片太長了" }));

    await expect(result).rejects.toThrow("影片太長了");
  });

  it("falls back to the status when the body says nothing", async () => {
    const { request, result } = start();

    request.respond(500, "<html>oops</html>");

    await expect(result).rejects.toThrow("上傳失敗（500）");
  });

  it("rejects when the connection drops", async () => {
    const { request, result } = start();

    request.dispatchEvent(new Event("error"));

    await expect(result).rejects.toThrow("連線中斷");
  });
});
