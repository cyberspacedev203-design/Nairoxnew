import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const user = localStorage.getItem("user");
      if (user) navigate("/dashboard");
      else navigate("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen liquid-bg flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-slide-up">
        <h1 className="text-6xl md:text-7xl font-extrabold gradient-text animate-float">
          Nairox9ja
        </h1>
        <p className="text-lg text-muted-foreground">Fast. Secure. Rewarding.</p>
      </div>
    </div>
  );
};

export default SplashScreen;
