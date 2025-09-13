import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalSettingsContext } from "@/components/providers/local-settings-provider";

export function ThemeToggle() {
  const { settings, updateSetting } = useLocalSettingsContext();

  const themes = [
    {
      value: "light",
      label: "Светлая",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Тёмная",
      icon: Moon,
    },
    {
      value: "system",
      label: "Системная",
      icon: Monitor,
    },
  ] as const;

  const currentTheme = themes.find(theme => theme.value === settings.theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          style={{
            background: "hsl(var(--primary-foreground))",
            color: "hsl(var(--primary))",
            border: "2px solid hsl(var(--primary-foreground))",
            transition: "background 0.2s, color 0.2s",
          }}
          className="hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))] focus:bg-[hsl(var(--primary))] focus:text-[hsl(var(--primary-foreground))]"
        >
          {currentTheme?.icon && <currentTheme.icon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
          <span className="sr-only">Переключить тему</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => updateSetting("theme", theme.value)}
            className="cursor-pointer"
          >
            <theme.icon className="mr-2 h-4 w-4" />
            <span>{theme.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 