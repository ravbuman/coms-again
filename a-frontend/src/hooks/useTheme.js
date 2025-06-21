import { useEffect, useState } from "react";

const defaultPrimary = "#22c55e"; // Tailwind green-500

export function useTheme() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [primary, setPrimary] = useState(() => localStorage.getItem("primaryColor") || defaultPrimary);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.setProperty("--color-primary", primary);
    localStorage.setItem("primaryColor", primary);
  }, [dark, primary]);

  return {
    dark,
    setDark,
    primary,
    setPrimary,
  };
}
