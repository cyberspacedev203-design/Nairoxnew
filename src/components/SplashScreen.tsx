import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const name = "NAIROX9JA".split("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const user = localStorage.getItem("user");
      if (user) navigate("/dashboard");
      else navigate("/auth");
    }, 2600);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4">
      <div className="flex items-center gap-6">
        <div className="splash-box drop shift turn-slow flex items-center justify-center">
          <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" rx="14" fill="#2bb673" transform="rotate(45 50 50)" />
            <rect x="42" y="42" width="16" height="16" rx="3" fill="#07140a" transform="rotate(45 50 50)" />
          </svg>
        </div>

        <div className="splash-letters" aria-hidden>
          {name.map((ch, i) => (
            <span
              key={i}
              className={`letter animate`}
              style={{ animationDelay: `${0.9 + i * 0.07}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
