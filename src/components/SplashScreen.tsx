import { useEffect, useRef } from "react";

type Props = { onDone?: () => void };

const SplashScreen = ({ onDone }: Props) => {
  const name = "Nairox9ja";
  const boxWrapRef = useRef<HTMLDivElement | null>(null);
  const textRowRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animFrame: number | null = null;
    const boxWrap = boxWrapRef.current!;
    const textRow = textRowRef.current!;
    const group = groupRef.current!;

    const colors = [
      "#1E88E5",
      "#1976D2",
      "#2196F3",
      "#42A5F5",
      "#1565C0",
      "#1E88E5",
      "#64B5F6",
      "#1976D2",
      "#2196F3",
    ];

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }
    function easeOut(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }
    function easeOutBack(t: number) {
      const c1 = 1.70158,
        c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    const letters: HTMLElement[] = [];
    textRow.innerHTML = "";
    for (let i = 0; i < name.length; i++) {
      const span = document.createElement("span") as HTMLElement;
      span.className = "letter";
      span.textContent = name[i];
      (span.style as any).color = colors[i % colors.length];
      textRow.appendChild(span);
      letters.push(span);
    }

    // smaller visuals
    const startY = -(window.innerHeight * 1.2 + 100); // offscreen above
    boxWrap.style.transform = `translateY(${startY}px) rotate(0deg)`;
    textRow.style.width = "0px";
    group.style.gap = "0px";
    const startX = Math.max(220, Math.round(window.innerWidth * 0.5));
    letters.forEach((l) => {
      l.style.opacity = "0";
      // start letters far to the right (offscreen)
      l.style.transform = `translateX(${startX}px)`;
      (l.style as any).fontSize = "28px";
      (l.style as any).fontWeight = "900";
      (l.style as any).lineHeight = "1";
    });

    // detect reload
    let isReload = false;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav && nav.type === "reload") isReload = true;
      // fallback
      // @ts-ignore
      if (!nav && (performance as any)?.navigation?.type === 1) isReload = true;
    } catch (e) {}

    // desired totals: normal load 4000ms, reload shorter (~1800ms)
    const NORMAL_TOTAL = 4000;
    const RELOAD_TOTAL = 1800;
    const total = isReload ? RELOAD_TOTAL : NORMAL_TOTAL;

    // distribute timings proportionally
    let FALL_DUR = Math.round(total * 0.25); // box drop
    let SETTLE_DUR = Math.round(total * 0.07); // small settle/bounce
    let EXPAND_DUR = Math.round(total * 0.18); // expand text container
    let LETTER_DUR = Math.max(120, Math.round(total * 0.08));
    let LETTER_STAGGER = Math.max(40, Math.round((total * 0.22) / name.length));


    const SLOW_SPIN_START = FALL_DUR + SETTLE_DUR + 100;
    const TOTAL = SLOW_SPIN_START + name.length * LETTER_STAGGER + LETTER_DUR + 200;

    let baseRotation = 0;
    let slowSpinStarted = false;
    let slowSpinStartAngle = 0;
    let slowSpinTime = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;

      if (elapsed < FALL_DUR) {
        const t = easeOutBack(Math.min(elapsed / FALL_DUR, 1));
        const y = lerp(startY, 0, t);
        const rot = lerp(0, -360, elapsed / FALL_DUR);
        boxWrap.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
        baseRotation = rot;
      } else if (elapsed < FALL_DUR + SETTLE_DUR) {
        const t = (elapsed - FALL_DUR) / SETTLE_DUR;
        const bounceY = Math.sin(t * Math.PI) * -6;
        boxWrap.style.transform = `translateY(${bounceY}px) rotate(${baseRotation}deg)`;
      } else {
        if (!slowSpinStarted) {
          slowSpinStarted = true;
          slowSpinStartAngle = baseRotation % 360;
          slowSpinTime = elapsed;
        }
        const spinElapsed = elapsed - slowSpinTime;
        const slowRot = slowSpinStartAngle + spinElapsed * 0.03;
        boxWrap.style.transform = `translateY(0px) rotate(${slowRot}deg)`;
      }

      const expandStart = FALL_DUR + SETTLE_DUR + 50;
      if (elapsed > expandStart) {
        const t = Math.min((elapsed - expandStart) / EXPAND_DUR, 1);
        const FULL_TEXT_WIDTH = name.length * 20 + 14; // reduced width per letter
        const w = lerp(0, FULL_TEXT_WIDTH, easeOut(t));
        textRow.style.width = w + "px";
        group.style.gap = lerp(0, 8, easeOut(t)) + "px";
      }

      letters.forEach((letter, i) => {
        const letterStart = SLOW_SPIN_START + i * LETTER_STAGGER;
        if (elapsed > letterStart) {
          const t = Math.min((elapsed - letterStart) / LETTER_DUR, 1);
          const et = easeOut(t);
          letter.style.opacity = String(et);
          letter.style.transform = `translateX(${lerp(startX, 0, et)}px)`;
        }
      });

      if (elapsed < TOTAL + 200) {
        animFrame = requestAnimationFrame(tick);
      } else {
        // signal done to parent if provided
        if (onDone) onDone();
      }
    }

    animFrame = requestAnimationFrame(tick);

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4" style={{ background: '#000' }}>
      <div id="logo-group" ref={groupRef} className="flex items-center" style={{ gap: 0 }}>
        <div id="box-wrap" ref={boxWrapRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform' }}>
          <div id="icon-box" style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'linear-gradient(135deg,#1565C0,#1976D2,#42A5F5)' }}>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
              <path d="M16 2 C16 2, 22 10, 30 16 C22 22, 16 30, 16 30 C16 30, 10 22, 2 16 C10 10, 16 2, 16 2Z" fill="#000"/>
            </svg>
          </div>
        </div>

        <div id="text-row" ref={textRowRef} style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', width: 0 }} />
      </div>
    </div>
  );
};

export default SplashScreen;
