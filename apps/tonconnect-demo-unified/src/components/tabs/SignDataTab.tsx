import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FormContainer } from "@/components/shared/FormContainer"
import { useSignData } from "@/hooks/useSignData"
import { useSettingsContext } from "@/context/SettingsContext"
import { validateSignDataJson } from "@/utils/validator"
import { CheckCircle, XCircle, Loader2, ShieldCheck, Server } from "lucide-react"

export function SignDataTab() {
  const { notificationsBefore, notificationsSuccess, notificationsError } = useSettingsContext()
  const {
    dataType, setDataType,
    dataText, setDataText,
    schema, setSchema,
    requestJson,
    responseJson,
    sign,
    setFromJson,
    isConnected,
    canVerify,
    verify,
    verificationResult,
    isVerifying,
    verifyOnServer,
    serverVerificationResult,
    isVerifyingOnServer,
  } = useSignData(notificationsBefore, notificationsSuccess, notificationsError)

  const formContent = (
    <>
      <div className="space-y-2">
        <Label>Data type</Label>
        <div className="flex gap-2">
          <Button variant={dataType === "text" ? "default" : "outline"} onClick={() => setDataType("text")} className="flex-1">Text</Button>
          <Button variant={dataType === "binary" ? "default" : "outline"} onClick={() => setDataType("binary")} className="flex-1">Binary</Button>
          <Button variant={dataType === "cell" ? "default" : "outline"} onClick={() => setDataType("cell")} className="flex-1">Cell</Button>
        </div>
      </div>

      {dataType === "cell" && (
        <div className="space-y-2">
          <Label htmlFor="schema">Schema (TL-B)</Label>
          <Input
            id="schema"
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            placeholder="e.g. transfer#123abc amount:Coins"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signData">{dataType === "cell" ? "Cell (base64 BOC)" : "Data for sign"}</Label>
        <Textarea
          id="signData"
          value={dataText}
          onChange={(e) => setDataText(e.target.value)}
          placeholder={dataType === "text" ? "Hello, TON!" : dataType === "binary" ? "Binary data (base64)" : "Base64 encoded BOC"}
          rows={4}
        />
      </div>

      {verificationResult && (
        <Alert variant={verificationResult.valid ? "default" : "destructive"}>
          {verificationResult.valid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            Client: {verificationResult.valid ? "Valid Signature" : "Invalid Signature"}
          </AlertTitle>
          <AlertDescription>
            {verificationResult.message}
            {verificationResult.details && (
              <div className="mt-2 text-xs space-y-1">
                <div>Address match: {verificationResult.details.addressMatch ? "Yes" : "No"}</div>
                <div>Public key match: {verificationResult.details.publicKeyMatch ? "Yes" : "No"}</div>
                <div>Signature valid: {verificationResult.details.signatureValid ? "Yes" : "No"}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {serverVerificationResult && (
        <Alert variant={serverVerificationResult.valid ? "default" : "destructive"}>
          {serverVerificationResult.valid ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            Server: {serverVerificationResult.valid ? "Valid Signature" : "Invalid Signature"}
          </AlertTitle>
          <AlertDescription>
            {serverVerificationResult.message}
            {serverVerificationResult.details && (
              <div className="mt-2 text-xs space-y-1">
                <div>Address match: {serverVerificationResult.details.addressMatch ? "Yes" : "No"}</div>
                <div>Public key match: {serverVerificationResult.details.publicKeyMatch ? "Yes" : "No"}</div>
                <div>Signature valid: {serverVerificationResult.details.signatureValid ? "Yes" : "No"}</div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  )

  const submitButton = (
    <div className="flex flex-wrap gap-2">
      <Button onClick={sign} className="flex-1" disabled={!isConnected}>
        {isConnected ? "Sign Data" : "Connect wallet to sign"}
      </Button>
      <Button
        onClick={verify}
        variant="outline"
        disabled={!canVerify || isVerifying}
        className="gap-2"
      >
        {isVerifying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Verify (Client)
      </Button>
      <Button
        onClick={verifyOnServer}
        variant="outline"
        disabled={!canVerify || isVerifyingOnServer}
        className="gap-2"
      >
        {isVerifyingOnServer ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Server className="h-4 w-4" />
        )}
        Verify (Server)
      </Button>
    </div>
  )

  return (
    <FormContainer
      formTitle="Configure and sign data"
      formDescription="Sign text, binary data, or cell data with your wallet"
      formContent={formContent}
      requestJson={requestJson}
      responseJson={responseJson}
      onJsonChange={setFromJson}
      validateJson={validateSignDataJson}
      submitButton={submitButton}
    />
  )
}
