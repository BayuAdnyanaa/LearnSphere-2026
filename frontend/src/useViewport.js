import { useEffect, useState } from "react";

// Window size; phone = narrower than 1024 px (the map switches to the panning layout)
export function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return { ...vp, phone: vp.w < 1024 };
}
