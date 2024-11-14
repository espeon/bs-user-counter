import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Rainbow, Sun } from "lucide-react";

function matchThemeToIcon(theme: string | undefined) {
  switch (theme) {
    case "light":
      return Sun;
    case "dark":
      return Moon;
    default:
      return Rainbow;
  }
}

export function ThemeSwitcher({
  setConfettiActive,
}: {
  setConfettiActive: (value: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // make sure to set the mounted state after the component has finished rendering
  // to the DOM
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <Button variant="outline" size="icon" className="rounded-full" disabled>
        <Rainbow className="h-4 w-4" />
      </Button>
    );

  let ButtonType = matchThemeToIcon(resolvedTheme);

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      onDoubleClick={() => setConfettiActive(true)}
    >
      <ButtonType className="h-4 w-4" />
    </Button>
  );
}
