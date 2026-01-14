import { useState, useEffect, useCallback } from "react"
import { useTonConnectUI, THEME } from "@tonconnect/ui-react"

// Default colors for each theme
const DEFAULT_COLORS = {
  [THEME.DARK]: {
    connectButton: { background: "#0098EA", foreground: "#FFFFFF" },
    accent: "#0098EA",
    background: { primary: "#121214", secondary: "#1c1c1e", tint: "#222224" },
    text: { primary: "#f5f5f5", secondary: "#8e8e93" }
  },
  [THEME.LIGHT]: {
    connectButton: { background: "#0098EA", foreground: "#FFFFFF" },
    accent: "#0098EA",
    background: { primary: "#ffffff", secondary: "#f1f3f5", tint: "#f1f3f5" },
    text: { primary: "#0f0f0f", secondary: "#6a7785" }
  }
}

export type ThemeOption = "light" | "dark" | "system"

export interface ColorsConfig {
  connectButtonBg: string
  connectButtonFg: string
  accent: string
  backgroundPrimary: string
  backgroundSecondary: string
  textPrimary: string
  textSecondary: string
}

export function useSettings() {
  const [, setOptions] = useTonConnectUI()

  // UI Settings
  const [language, setLanguage] = useState<"en" | "ru">("en")
  const [theme, setTheme] = useState<ThemeOption>("dark")
  const [borderRadius, setBorderRadius] = useState<"s" | "m" | "none">("m")

  // Colors
  const [darkColors, setDarkColors] = useState<ColorsConfig>({
    connectButtonBg: DEFAULT_COLORS[THEME.DARK].connectButton.background,
    connectButtonFg: DEFAULT_COLORS[THEME.DARK].connectButton.foreground,
    accent: DEFAULT_COLORS[THEME.DARK].accent,
    backgroundPrimary: DEFAULT_COLORS[THEME.DARK].background.primary,
    backgroundSecondary: DEFAULT_COLORS[THEME.DARK].background.secondary,
    textPrimary: DEFAULT_COLORS[THEME.DARK].text.primary,
    textSecondary: DEFAULT_COLORS[THEME.DARK].text.secondary,
  })

  const [lightColors, setLightColors] = useState<ColorsConfig>({
    connectButtonBg: DEFAULT_COLORS[THEME.LIGHT].connectButton.background,
    connectButtonFg: DEFAULT_COLORS[THEME.LIGHT].connectButton.foreground,
    accent: DEFAULT_COLORS[THEME.LIGHT].accent,
    backgroundPrimary: DEFAULT_COLORS[THEME.LIGHT].background.primary,
    backgroundSecondary: DEFAULT_COLORS[THEME.LIGHT].background.secondary,
    textPrimary: DEFAULT_COLORS[THEME.LIGHT].text.primary,
    textSecondary: DEFAULT_COLORS[THEME.LIGHT].text.secondary,
  })

  // Modals
  const [modalsBefore, setModalsBefore] = useState(true)
  const [modalsSuccess, setModalsSuccess] = useState(false)
  const [modalsError, setModalsError] = useState(false)

  // Notifications
  const [notificationsBefore, setNotificationsBefore] = useState(true)
  const [notificationsSuccess, setNotificationsSuccess] = useState(true)
  const [notificationsError, setNotificationsError] = useState(true)

  // Redirect
  const [returnStrategy, setReturnStrategy] = useState<"back" | "none">("back")
  const [skipRedirect, setSkipRedirect] = useState<"never" | "always" | "ios">("ios")
  const [twaReturnUrl, setTwaReturnUrl] = useState("")

  // Android
  const [enableAndroidBackHandler, setEnableAndroidBackHandler] = useState(true)

  // Network selection (for transactions)
  // "" = Any, "-239" = Mainnet, "-3" = Testnet
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")

  // Helper to get effective theme (resolve "system")
  const getEffectiveTheme = useCallback((): "light" | "dark" => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme()
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark")

    // Listen for system theme changes when in "system" mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle("dark", e.matches)
      }
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [theme, getEffectiveTheme])

  // Apply settings to TonConnect UI
  useEffect(() => {
    const tcTheme = theme === "system" ? "SYSTEM" : theme === "dark" ? THEME.DARK : THEME.LIGHT

    // Build modals array
    const modals: ("before" | "success" | "error")[] = []
    if (modalsBefore) modals.push("before")
    if (modalsSuccess) modals.push("success")
    if (modalsError) modals.push("error")

    // Build notifications array
    const notifications: ("before" | "success" | "error")[] = []
    if (notificationsBefore) notifications.push("before")
    if (notificationsSuccess) notifications.push("success")
    if (notificationsError) notifications.push("error")

    setOptions({
      language,
      uiPreferences: {
        theme: tcTheme,
        borderRadius,
        colorsSet: {
          [THEME.DARK]: {
            connectButton: {
              background: darkColors.connectButtonBg,
              foreground: darkColors.connectButtonFg
            },
            accent: darkColors.accent,
            background: {
              primary: darkColors.backgroundPrimary,
              secondary: darkColors.backgroundSecondary,
              tint: darkColors.backgroundSecondary
            },
            text: {
              primary: darkColors.textPrimary,
              secondary: darkColors.textSecondary
            }
          },
          [THEME.LIGHT]: {
            connectButton: {
              background: lightColors.connectButtonBg,
              foreground: lightColors.connectButtonFg
            },
            accent: lightColors.accent,
            background: {
              primary: lightColors.backgroundPrimary,
              secondary: lightColors.backgroundSecondary,
              tint: lightColors.backgroundSecondary
            },
            text: {
              primary: lightColors.textPrimary,
              secondary: lightColors.textSecondary
            }
          }
        }
      },
      actionsConfiguration: {
        modals: modals.length > 0 ? modals : undefined,
        notifications: notifications.length > 0 ? notifications : undefined,
        returnStrategy,
        skipRedirectToWallet: skipRedirect,
        twaReturnUrl: twaReturnUrl ? twaReturnUrl as `${string}://${string}` : undefined
      },
      enableAndroidBackHandler
    })
  }, [
    setOptions, language, theme, borderRadius,
    darkColors, lightColors,
    modalsBefore, modalsSuccess, modalsError,
    notificationsBefore, notificationsSuccess, notificationsError,
    returnStrategy, skipRedirect, twaReturnUrl,
    enableAndroidBackHandler
  ])

  // Helper to update a single dark color
  const updateDarkColor = useCallback((key: keyof ColorsConfig, value: string) => {
    setDarkColors(prev => ({ ...prev, [key]: value }))
  }, [])

  // Helper to update a single light color
  const updateLightColor = useCallback((key: keyof ColorsConfig, value: string) => {
    setLightColors(prev => ({ ...prev, [key]: value }))
  }, [])

  // Reset colors to defaults
  const resetColors = useCallback(() => {
    setDarkColors({
      connectButtonBg: DEFAULT_COLORS[THEME.DARK].connectButton.background,
      connectButtonFg: DEFAULT_COLORS[THEME.DARK].connectButton.foreground,
      accent: DEFAULT_COLORS[THEME.DARK].accent,
      backgroundPrimary: DEFAULT_COLORS[THEME.DARK].background.primary,
      backgroundSecondary: DEFAULT_COLORS[THEME.DARK].background.secondary,
      textPrimary: DEFAULT_COLORS[THEME.DARK].text.primary,
      textSecondary: DEFAULT_COLORS[THEME.DARK].text.secondary,
    })
    setLightColors({
      connectButtonBg: DEFAULT_COLORS[THEME.LIGHT].connectButton.background,
      connectButtonFg: DEFAULT_COLORS[THEME.LIGHT].connectButton.foreground,
      accent: DEFAULT_COLORS[THEME.LIGHT].accent,
      backgroundPrimary: DEFAULT_COLORS[THEME.LIGHT].background.primary,
      backgroundSecondary: DEFAULT_COLORS[THEME.LIGHT].background.secondary,
      textPrimary: DEFAULT_COLORS[THEME.LIGHT].text.primary,
      textSecondary: DEFAULT_COLORS[THEME.LIGHT].text.secondary,
    })
  }, [])

  return {
    // UI
    language, setLanguage,
    theme, setTheme,
    borderRadius, setBorderRadius,
    // Colors
    darkColors, updateDarkColor,
    lightColors, updateLightColor,
    resetColors,
    // Modals
    modalsBefore, setModalsBefore,
    modalsSuccess, setModalsSuccess,
    modalsError, setModalsError,
    // Notifications
    notificationsBefore, setNotificationsBefore,
    notificationsSuccess, setNotificationsSuccess,
    notificationsError, setNotificationsError,
    // Redirect
    returnStrategy, setReturnStrategy,
    skipRedirect, setSkipRedirect,
    twaReturnUrl, setTwaReturnUrl,
    // Android
    enableAndroidBackHandler, setEnableAndroidBackHandler,
    // Network
    selectedNetwork, setSelectedNetwork,
  }
}
