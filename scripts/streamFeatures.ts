import { createReadStream } from "node:fs";

/**
 * Yields the members of a GeoJSON FeatureCollection one at a time.
 *
 * The ABS national boundary file is larger than this machine's memory, so it
 * can never be JSON.parse'd whole. Objects are found by tracking brace depth —
 * respecting strings and escapes, since a place name may contain a brace — and
 * parsed individually, which keeps memory flat whatever the file's size.
 *
 * `scanned` is what makes it correct across chunk boundaries: without it each
 * new chunk re-examines the characters already seen and counts their braces
 * twice.
 */
export async function* streamFeatures<T>(path: string): AsyncGenerator<T> {
  const stream = createReadStream(path, { encoding: "utf8", highWaterMark: 1 << 20 });

  let buffer = "";
  let scanned = 0;
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for await (const chunk of stream) {
    buffer += chunk;

    for (let index = scanned; index < buffer.length; index += 1) {
      const character = buffer[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (inString) {
        if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }

      if (character === '"') {
        inString = true;
      } else if (character === "{") {
        depth += 1;

        // Depth 1 is the collection itself, so its members open at depth 2.
        if (depth === 2) start = index;
      } else if (character === "}") {
        if (depth === 2 && start !== -1) {
          yield JSON.parse(buffer.slice(start, index + 1)) as T;

          buffer = buffer.slice(index + 1);
          index = -1;
          scanned = 0;
          start = -1;
        }

        depth -= 1;
      }
    }

    scanned = buffer.length;

    // Between members nothing needs keeping, so the buffer cannot grow.
    if (start === -1) {
      buffer = "";
      scanned = 0;
    }
  }
}
