import { useMapGestures } from "@hooks/useMapGestures";
import {
  formatViewBox,
  panBy,
  parseViewBox,
  type Point,
  pointerToMap,
  type Viewport,
  zoomAt,
  zoomOf,
} from "@utils/viewport";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
} from "react";

const WHEEL_SENSITIVITY = 0.0015;
const BUTTON_STEP = 1.6;
/** Fraction of the visible width an arrow key moves. */
const KEY_PAN = 0.12;

const PANS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** Arrow keys pan, plus and minus zoom, zero shows the whole state. */
function keyboardHandler(
  base: Viewport,
  setView: Dispatch<SetStateAction<Viewport>>,
  zoomBy: (factor: number) => void,
) {
  return (event: KeyboardEvent<SVGSVGElement>) => {
    const pan = PANS[event.key];

    if (pan) {
      event.preventDefault();
      setView(current =>
        panBy(current, base, pan.x * current.width * KEY_PAN, pan.y * current.height * KEY_PAN),
      );
    } else if (event.key === "+" || event.key === "=") {
      zoomBy(BUTTON_STEP);
    } else if (event.key === "-" || event.key === "_") {
      zoomBy(1 / BUTTON_STEP);
    } else if (event.key === "0") {
      setView(base);
    }
  };
}

export function useMapViewport(baseViewBox: string) {
  const base = useMemo(() => parseViewBox(baseViewBox), [baseViewBox]);
  const [view, setView] = useState<Viewport>(base);
  const gestures = useMapGestures(base, setView);
  const detach = useRef<(() => void) | null>(null);

  useEffect(() => setView(base), [base]);

  /**
   * A callback ref rather than an effect over a ref object. The svg only
   * mounts once the map data has loaded, and by then nothing in the effect's
   * dependencies has changed, so an effect would never see the element.
   *
   * The listener is added by hand rather than through onWheel because React
   * registers wheel listeners as passive: preventDefault there is ignored and
   * the page scrolls out from under the map instead of it zooming.
   */
  const svgRef = useCallback(
    (svg: SVGSVGElement | null) => {
      detach.current?.();
      detach.current = null;

      if (!svg) return;

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();

        setView(current =>
          zoomAt(
            current,
            base,
            Math.exp(-event.deltaY * WHEEL_SENSITIVITY),
            pointerToMap(current, svg.getBoundingClientRect(), event.clientX, event.clientY),
          ),
        );
      };

      svg.addEventListener("wheel", onWheel, { passive: false });
      detach.current = () => svg.removeEventListener("wheel", onWheel);
    },
    [base],
  );

  const zoomBy = useCallback(
    (factor: number) =>
      setView(current =>
        zoomAt(current, base, factor, {
          x: current.x + current.width / 2,
          y: current.y + current.height / 2,
        }),
      ),
    [base],
  );

  const onKeyDown = keyboardHandler(base, setView, zoomBy);

  return {
    svgRef,
    viewBox: formatViewBox(view),
    zoom: zoomOf(view, base),
    panning: gestures.panning,
    wasDragged: gestures.wasDragged,
    zoomIn: () => zoomBy(BUTTON_STEP),
    zoomOut: () => zoomBy(1 / BUTTON_STEP),
    reset: () => setView(base),
    handlers: { ...gestures.handlers, onKeyDown },
  };
}
