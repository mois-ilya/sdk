import { useState, useEffect, useMemo, useRef } from "react"
import type { ReactNode } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JsonViewer } from "./JsonViewer"
import { ResultCard } from "./ResultCard"
import { AlertCircle, AlertTriangle, Copy, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useSettingsContext } from "@/context/SettingsContext"
import { createTonConnectTheme } from "@/lib/codemirror-theme"
import type { ValidationResult } from "@/utils/validator"
import type { OperationResult } from "@/hooks/useTransaction"

export interface PresetOption {
  id: string
  name: string
  description: string
}

type EditorMode = "form" | "code"

interface FormContainerProps {
  // Metadata
  title: string

  // Content
  formContent: ReactNode
  requestJson: string

  // Callbacks
  onJsonChange?: (json: string) => void
  onSend: () => void
  onSendRaw?: (json: string) => void

  // Validation
  validateJson?: (json: string) => ValidationResult

  // State
  isConnected: boolean

  // Presets
  presets?: PresetOption[]
  onPresetSelect?: (presetId: string) => void

  // Result
  lastResult?: OperationResult | null
  onClearResult?: () => void
  onLoadResult?: () => void
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

export function FormContainer({
  title,
  formContent,
  requestJson,
  onJsonChange,
  onSend,
  onSendRaw,
  validateJson,
  isConnected,
  presets,
  onPresetSelect,
  lastResult,
  onClearResult,
  onLoadResult,
}: FormContainerProps) {
  const [mode, setMode] = useState<EditorMode>("form")
  const [editedJson, setEditedJson] = useState(requestJson)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const { theme } = useSettingsContext()

  // Determine if dark mode based on theme setting
  const isDark = useMemo(() => {
    if (theme === "system") {
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return theme === "dark"
  }, [theme])

  // Create reactive CodeMirror theme
  const codemirrorTheme = useMemo(() => createTonConnectTheme(isDark), [isDark])

  // Sync JSON when in form mode or when requestJson changes
  useEffect(() => {
    if (mode === "form") {
      setEditedJson(requestJson)
    }
  }, [requestJson, mode])

  // Real-time validation in code mode
  useEffect(() => {
    if (mode === "code" && validateJson && isValidJson(editedJson)) {
      setValidationResult(validateJson(editedJson))
    } else if (mode === "code" && !isValidJson(editedJson)) {
      setValidationResult(null)
    } else {
      setValidationResult(null)
    }
  }, [editedJson, mode, validateJson])

  // Smart scroll to result when it appears
  useEffect(() => {
    if (lastResult && resultRef.current) {
      const rect = resultRef.current.getBoundingClientRect()
      if (rect.top > window.innerHeight) {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }
  }, [lastResult?.id])

  // Handle mode switch
  const handleModeChange = (newMode: EditorMode) => {
    if (newMode === mode) return

    if (mode === "code" && newMode === "form") {
      // Code → Form: apply changes if valid JSON
      if (!isValidJson(editedJson)) {
        // Can't switch with invalid JSON syntax
        return
      }
      onJsonChange?.(editedJson)
    }

    if (mode === "form" && newMode === "code") {
      // Form → Code: sync JSON
      setEditedJson(requestJson)
    }

    setMode(newMode)
  }

  // Handle send
  const handleSend = () => {
    if (mode === "form") {
      onSend()
    } else {
      // Code mode - use sendRaw if available
      if (onSendRaw) {
        onSendRaw(editedJson)
      } else {
        // Fallback: apply JSON to form and send
        onJsonChange?.(editedJson)
        onSend()
      }
    }
  }

  // Determine validation state
  const hasSyntaxError = mode === "code" && !isValidJson(editedJson)
  const hasSchemaWarnings = mode === "code" && validationResult && !validationResult.valid && !hasSyntaxError

  // Send button disabled state
  const sendDisabled = !isConnected || hasSyntaxError

  // Send button text
  const sendButtonText = isConnected
    ? "Send Transaction"
    : "Connect wallet"

  return (
    <div className="space-y-4">
      <Card>
        {/* Header: Title + Toggle + Send */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>

          <div className="flex items-center gap-3">
            {/* Presets Dropdown */}
            {presets && presets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Presets
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => onPresetSelect?.(preset.id)}
                      className="flex flex-col items-start gap-0.5 cursor-pointer"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Segmented Toggle */}
            <div className="inline-flex rounded-md border">
              <Button
                variant={mode === "form" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none border-r-0"
                onClick={() => handleModeChange("form")}
              >
                Form
              </Button>
              <Button
                variant={mode === "code" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => handleModeChange("code")}
              >
                Code
              </Button>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={sendDisabled}
            >
              {sendButtonText}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {mode === "form" ? (
            // Form mode: 2 columns in one card
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-8">
              {/* LEFT: Form */}
              <div className="space-y-4 min-w-0">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Configure</h3>
                {formContent}
              </div>

              {/* RIGHT: Preview (with left border on lg) */}
              <div className="space-y-4 min-w-0 lg:border-l lg:pl-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Request Preview</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(requestJson)
                      toast.success("Copied to clipboard")
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <JsonViewer
                  title=""
                  json={requestJson}
                  collapsible={false}
                  maxHeight={500}
                />
              </div>
            </div>
          ) : (
            // Code mode: Full width editor
            <div className="space-y-4">
              <CodeMirror
                value={editedJson}
                onChange={setEditedJson}
                extensions={[json(), ...codemirrorTheme]}
                theme="none"
                height="400px"
                className="rounded-md border overflow-hidden"
              />

              {/* Syntax Error */}
              {hasSyntaxError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Invalid JSON syntax</AlertDescription>
                </Alert>
              )}

              {/* Schema Warnings (not blocking) */}
              {hasSchemaWarnings && (
                <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-4">
                    <span>
                      {validationResult!.errors.map(e => `${e.path}: ${e.message}`).join("; ")}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-orange-500 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
                      onClick={handleSend}
                    >
                      Send Anyway
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Card - ALWAYS visible (regardless of mode) */}
      {lastResult && (
        <div ref={resultRef}>
          <ResultCard
            result={lastResult}
            onDismiss={onClearResult}
            onLoadToForm={onLoadResult}
          />
        </div>
      )}
    </div>
  )
}
