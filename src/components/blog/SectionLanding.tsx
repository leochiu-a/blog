/**
 * Positioning the page on the section its URL names — at parse time, not after
 * hydration.
 *
 * The two things a reload does are both wrong on their own. Left alone it
 * restores the offset its history entry remembers and never looks at the
 * fragment, so a link to one section reopens wherever the reader had scrolled
 * to. Opted out of restoration it opens at the top, and waits for someone to
 * move the reader — and a scroll from a React effect happens long after the
 * first paint, which is the post-opens-at-the-top-then-jumps flash.
 *
 * So this is a plain inline script, emitted after the article, and it runs the
 * moment the parser reaches it: before hydration, before the effects, and in
 * the same window the browser does its own fragment scrolling. That is as early
 * as anything but native restoration can act, and native restoration is not
 * available here — it is the thing being overridden.
 *
 * Deliberately not a client component. It has to run once, during parsing,
 * whether or not React ever hydrates; rendering it from a client component
 * would leave React free to re-create the node and run the scroll a second
 * time, after paint, which is the flash coming back in.
 */
export const LANDING_SCRIPT = `(function () {
  var raw = location.hash.slice(1);
  if (!raw) return;
  // This entry stops restoring, so its next reload has nothing to put ahead of
  // the fragment. Set on arrival rather than on the way out: an entry keeps the
  // mode it was given, and by unload it is too late to be asked.
  history.scrollRestoration = "manual";
  // Only from a standing start. Anywhere but the top means the browser has
  // already landed the reader, or they have started reading on a slow load —
  // and a scroll into either is an interruption rather than a fix.
  if (window.scrollY > 0) return;
  var id;
  try {
    id = decodeURIComponent(raw);
  } catch (error) {
    id = raw;
  }
  var heading = document.getElementById(id);
  // \`scrollIntoView\` rather than a computed offset: it honours the heading's
  // own \`scroll-margin-top\`, so the landing spot stays defined in the
  // stylesheet instead of being duplicated as a number here.
  if (heading) heading.scrollIntoView();
})();`;

/** Renders nothing but the script above. Must come after the article it lands in. */
export function SectionLanding() {
  return <script dangerouslySetInnerHTML={{ __html: LANDING_SCRIPT }} />;
}
