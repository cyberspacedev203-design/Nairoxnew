import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const name = "NAIROX9JA".split("");
  const boxRef = useRef<HTMLDivElement | null>(null);
  const lettersRef = useRef<HTMLDivElement | null>(null);
  const [timings, setTimings] = useState({
    total: 3000,
    drop: 900,
    lettersPhase: 1500,
    letterAnim: 500,
    letterStagger: 110,
    shift: 600,
  });
  const [shiftPx, setShiftPx] = useState(104); // fallback
  const [shifted, setShifted] = useState(false);

  useEffect(() => {
    // detect reload vs normal navigation
    let isReload = false;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav && nav.type === "reload") isReload = true;
      // fallback to deprecated API
      // @ts-ignore
      if (!nav && performance?.navigation?.type === 1) isReload = true;
    } catch (e) {}

    if (isReload) {
      const total = 1800;
      const drop = Math.round(total * 0.35); // ~630
      const lettersPhase = Math.round(total * 0.5); // ~900
      const letterAnim = 300;
      const letterStagger = Math.max(40, Math.round((lettersPhase - letterAnim) / name.length));
      const shift = Math.max(180, total - drop - lettersPhase);
      setTimings({ total, drop, lettersPhase, letterAnim, letterStagger, shift });
    } else {
      const total = 3000;
      const drop = Math.round(total * 0.3); // 900
      const lettersPhase = Math.round(total * 0.5); // 1500
      const letterAnim = 500;
      const letterStagger = Math.max(50, Math.round((lettersPhase - letterAnim) / name.length));
      const shift = Math.max(500, total - drop - lettersPhase);
      setTimings({ total, drop, lettersPhase, letterAnim, letterStagger, shift });
    }
  }, []);

  useEffect(() => {
    // measure widths to compute shift in px so the box is pushed left enough
    const measure = () => {
      const box = boxRef.current;
      const letters = lettersRef.current;
      if (!box || !letters) return;
      const boxRect = box.getBoundingClientRect();
      const lettersRect = letters.getBoundingClientRect();
      // shift so that letters fit to the right of box: move box left by half letters width plus small gap
      const desired = Math.round((lettersRect.width / 2) + (boxRect.width / 2) + 12);
      setShiftPx(desired);
    };

    // measure after a small tick so DOM styles apply
    const t = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [timings]);

  useEffect(() => {
    // orchestrate shift after drop + lettersPhase
    const totalDelay = timings.drop + timings.lettersPhase + 30; // small buffer
    const shiftTimer = setTimeout(() => setShifted(true), totalDelay);

    const redirectTimer = setTimeout(() => {
      const user = localStorage.getItem("user");
      if (user) navigate("/dashboard");
      else navigate("/auth");
    }, timings.total);

    return () => {
      clearTimeout(shiftTimer);
      clearTimeout(redirectTimer);
    };
  }, [timings, navigate]);

  const boxStyle: React.CSSProperties = {
    animation: `boxDrop ${timings.drop}ms cubic-bezier(.2,.9,.2,1) forwards`,
    // keep slow turn always
    animationPlayState: "running",
  };

  const shiftStyle: React.CSSProperties = shifted
    ? {
        transform: `translateX(-${shiftPx}px) rotate(18deg)`,
        transition: `transform ${timings.shift}ms cubic-bezier(.2,.9,.2,1)`,
      }
    : undefined;

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4">
      <div className="flex items-center gap-6">
        <div
          ref={boxRef}
          className="splash-box turn-slow"
          style={{ ...boxStyle, ...(shiftStyle || {}) }}
        >
          <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" rx="14" fill="#2bb673" transform="rotate(45 50 50)" />
            <rect x="42" y="42" width="16" height="16" rx="3" fill="#07140a" transform="rotate(45 50 50)" />
          </svg>
        </div>

        <div ref={lettersRef} className="splash-letters" aria-hidden>
          {name.map((ch, i) => {
            const delay = timings.drop + i * timings.letterStagger;
            const anim = `letterIn ${timings.letterAnim}ms cubic-bezier(.2,.9,.2,1) ${delay}ms forwards`;
            return (
              <span key={i} className="letter" style={{ animation: anim }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
