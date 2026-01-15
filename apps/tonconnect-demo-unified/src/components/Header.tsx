import { TonConnectButton } from "@tonconnect/ui-react"
import { Button } from "@/components/ui/button"
import { useSettingsContext } from "@/context/SettingsContext"
import { Moon, Sun } from "lucide-react"

export function Header() {
  const { theme, setTheme } = useSettingsContext()
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const ThemeIcon = theme === "dark" ? Sun : Moon

  return (
    <header className="header-animated sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="header-content mx-auto max-w-7xl px-4 md:px-8 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="header-title font-bold text-foreground text-xl sm:text-3xl">
            TonConnect Demo
          </h1>
          <p className="header-subtitle text-xs sm:text-sm text-muted-foreground">
            Test and demonstrate wallet integration
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="header-button h-8 w-8 sm:h-9 sm:w-9"
          >
            <ThemeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <TonConnectButton />
        </div>
      </div>
    </header>
  )
}
