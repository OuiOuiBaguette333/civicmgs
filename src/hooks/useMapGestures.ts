import { panByPixels, type Point, type Viewport, zoomAtPointer } from "@utils/viewport";
import { useRef, useState, type Dispatch, type PointerEvent, type SetStateAction } from "react";

/** Pixels of movement before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 4;

const gapBetween = ([a, b]: Point[]) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Drag to pan, two fingers to pinch. Pointer events rather than mouse and touch
 * separately, so a trackpad, a mouse and a phone all take the same path.
 */
export function useMapGestures(base: Viewport, setView: Dispatch<SetStateAction<Viewport>>) {
  const pointers = useRef(new Map<number, Point>());
  const dragged = useRef(false);
  const [panning, setPanning] = useState(false);

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged.current = false;
    setPanning(true);
  };

  /**
   * Capture is taken only once a press has actually become a drag. Capturing on
   * pointerdown would retarget the following click to the svg, and the areas
   * would stop being selectable.
   */
  const startDragging = (event: PointerEvent<SVGSVGElement>) => {
    if (dragged.current) return;

    dragged.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const active = pointers.current;

    if (!active.has(event.pointerId)) return;

    const box = event.currentTarget.getBoundingClientRect();
    const before = [...active.values()];

    active.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const after = [...active.values()];

    if (active.size >= 2) {
      startDragging(event);

      const factor = gapBetween(after) / (gapBetween(before) || 1);
      const midX = (after[0].x + after[1].x) / 2;
      const midY = (after[0].y + after[1].y) / 2;

      setView(current => zoomAtPointer(current, base, box, factor, midX, midY));

      return;
    }

    const dx = event.clientX - before[0].x;
    const dy = event.clientY - before[0].y;

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) startDragging(event);

    // Nothing to pan until the press is a drag, or the map would creep on a click.
    if (dragged.current) setView(current => panByPixels(current, base, box, dx, dy));
  };

  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size === 0) setPanning(false);
  };

  return {
    panning,
    /** True when the last press moved far enough to be a pan, not a click. */
    wasDragged: () => dragged.current,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
