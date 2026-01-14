import { useState, useEffect, useMemo } from "react"
import type { ReactNode } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { JsonDisplay } from "./JsonDisplay"
import { Code, FormInput, AlertCircle, X } from "lucide-react"
import { useSettingsContext } from "@/context/SettingsContext"
import { createTonConnectTheme } from "@/lib/codemirror-theme"
import type { ValidationResult } from "@/utils/validator"

interface FormContainerProps {
  formTitle: string
  formDescription: string
  formContent: ReactNode
  requestJson: string
  responseJson?: string
  onJsonChange?: (json: string) => void
  validateJson?: (json: string) => ValidationResult
  submitButton: ReactNode
}

export function FormContainer({
  formTitle,
  formDescription,
  formContent,
  requestJson,
  responseJson,
  onJsonChange,
  validateJson,
  submitButton,
}: FormContainerProps) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [editedJson, setEditedJson] = useState(requestJson)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Sync editedJson when requestJson changes (in view mode)
  useEffect(() => {
    if (mode === "view") {
      setEditedJson(requestJson)
    }
  }, [requestJson, mode])

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

  const handleModeToggle = () => {
    if (mode === "edit") {
      // Switching from edit to view - validate first
      if (validateJson) {
        const result = validateJson(editedJson)
        if (!result.valid) {
          setValidationErrors(result.errors.map((e) => `${e.path}: ${e.message}`))
          return
        }
      }

      // Try to parse and apply changes
      try {
        JSON.parse(editedJson)
        if (onJsonChange) {
          onJsonChange(editedJson)
        }
        setValidationErrors([])
        setMode("view")
      } catch {
        setValidationErrors(["Invalid JSON syntax"])
      }
    } else {
      // Switching from view to edit
      setEditedJson(requestJson)
      setValidationErrors([])
      setMode("edit")
    }
  }

  const handleCancel = () => {
    setEditedJson(requestJson)
    setValidationErrors([])
    setMode("view")
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex justify-end gap-2">
        {mode === "edit" && (
          <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleModeToggle} className="gap-2">
          {mode === "view" ? (
            <>
              <Code className="h-4 w-4" />
              Edit JSON
            </>
          ) : (
            <>
              <FormInput className="h-4 w-4" />
              Apply Changes
            </>
          )}
        </Button>
      </div>

      {mode === "view" ? (
        // View mode: Form + JSON side by side
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{formTitle}</CardTitle>
              <CardDescription>{formDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formContent}
              {submitButton}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON for Developers</CardTitle>
              <CardDescription>Request and response payloads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <JsonDisplay title="Request Payload" json={requestJson} />
              {responseJson && <JsonDisplay title="Response" json={responseJson} />}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Edit mode: JSON editor full width
        <Card>
          <CardHeader>
            <CardTitle>Edit JSON</CardTitle>
            <CardDescription>
              Edit the request payload directly. Changes will be validated when switching back to form view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeMirror
              value={editedJson}
              onChange={setEditedJson}
              extensions={[json(), ...codemirrorTheme]}
              theme="none"
              height="400px"
              className="rounded-md border overflow-hidden"
            />

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {submitButton}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
