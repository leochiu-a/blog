/**
 * The browser side of an editor upload. `fetch` is not usable here: it reports
 * nothing until the response arrives, and a clip straight off a screen
 * recording is hundreds of megabytes — long enough that a spinner with no
 * numbers on it is indistinguishable from a hang. `XMLHttpRequest` is still the
 * only API that reports how many bytes have gone out.
 */

/**
 * How far along one upload is.
 *
 * The two phases are genuinely different waits, so they are different states
 * rather than one number: bytes leaving the browser can be measured, and the
 * server's work afterwards — transcoding a clip, above all — cannot. Pretending
 * the second half has a percentage would mean inventing one.
 */
export type UploadProgress = { phase: "sending"; ratio: number } | { phase: "processing" };

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** The server's own reason for refusing, when it sent one. */
function reason(body: unknown): string | null {
  const error = (body as { error?: unknown } | null)?.error;
  return typeof error === "string" ? error : null;
}

/** POSTs one file, reporting progress, and answers with the parsed JSON body. */
export function uploadFile<T>(
  endpoint: string,
  file: File,
  onProgress: (progress: UploadProgress) => void,
): Promise<T> {
  const body = new FormData();
  body.set("file", file);

  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", endpoint);

    request.upload.addEventListener("progress", (event) => {
      // `lengthComputable` is false for a body of unknown size, which a
      // FormData of one file never is — but the ratio has to stay a number.
      onProgress({
        phase: "sending",
        ratio: event.lengthComputable ? event.loaded / event.total : 0,
      });
    });

    // The last byte goes out long before the answer comes back; from here on
    // the wait is the server's, and there is nothing left to count.
    request.upload.addEventListener("load", () => onProgress({ phase: "processing" }));

    request.addEventListener("load", () => {
      const parsed = parseBody(request.responseText);
      if (request.status >= 200 && request.status < 300) {
        resolve(parsed as T);
        return;
      }
      reject(new Error(reason(parsed) ?? `上傳失敗（${request.status}）`));
    });

    request.addEventListener("error", () => reject(new Error("上傳失敗：連線中斷")));
    request.addEventListener("timeout", () => reject(new Error("上傳失敗：伺服器沒有回應")));

    request.send(body);
  });
}
