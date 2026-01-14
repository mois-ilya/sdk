import { useState, useEffect } from "react"
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react"
import { toast } from "sonner"
import { verifySignData } from "@/utils/sign-data-verification"
import type { VerificationResult } from "@/utils/sign-data-verification"

export type SignDataType = "text" | "binary" | "cell"

interface SignDataResponse {
  signature: string
  timestamp: number
  domain: string
  payload: {
    type: "text" | "binary" | "cell"
    text?: string
    bytes?: string
    schema?: string
    cell?: string
  }
}

export function useSignData(showToastBefore = true, showToastSuccess = true, showToastError = true) {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const [dataType, setDataType] = useState<SignDataType>("text")
  const [dataText, setDataText] = useState("Hello, TON!")
  const [schema, setSchema] = useState("")

  const [requestJson, setRequestJson] = useState("")
  const [responseJson, setResponseJson] = useState("")

  // For verification
  const [lastResponse, setLastResponse] = useState<SignDataResponse | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Build request JSON
  useEffect(() => {
    let payload: Record<string, string>
    if (dataType === "text") {
      payload = { type: "text", text: dataText }
    } else if (dataType === "binary") {
      payload = { type: "binary", bytes: dataText }
    } else {
      payload = { type: "cell", schema, cell: dataText }
    }
    setRequestJson(JSON.stringify({ method: "signData", params: [payload] }, null, 2))
  }, [dataType, dataText, schema])

  // Set form state from JSON (for edit mode)
  const setFromJson = (json: string) => {
    try {
      const data = JSON.parse(json)
      const payload = data.params?.[0] || data

      if (payload.type === "text" && payload.text !== undefined) {
        setDataType("text")
        setDataText(payload.text)
      } else if (payload.type === "binary" && payload.bytes !== undefined) {
        setDataType("binary")
        setDataText(payload.bytes)
      } else if (payload.type === "cell" && payload.cell !== undefined) {
        setDataType("cell")
        setDataText(payload.cell)
        if (payload.schema) setSchema(payload.schema)
      }
    } catch {
      // Invalid JSON - ignore
    }
  }

  const sign = async () => {
    if (!wallet) {
      toast.error("Please connect wallet first")
      return
    }

    // Reset previous state
    setLastResponse(null)
    setVerificationResult(null)

    try {
      let payload: Record<string, string>
      if (dataType === "text") {
        payload = { type: "text", text: dataText }
      } else if (dataType === "binary") {
        payload = { type: "binary", bytes: dataText }
      } else {
        payload = { type: "cell", schema, cell: dataText }
      }

      if (showToastBefore) toast.info("Please confirm in your wallet")

      const result = await tonConnectUI.signData(payload as Parameters<typeof tonConnectUI.signData>[0])

      setResponseJson(JSON.stringify(result, null, 2))
      setLastResponse(result as unknown as SignDataResponse)

      if (showToastSuccess) toast.success("Data signed successfully")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signing failed"
      setResponseJson(JSON.stringify({ error: message }, null, 2))
      if (showToastError) toast.error(message)
    }
  }

  const verify = async () => {
    if (!lastResponse || !wallet) {
      toast.error("No signature to verify")
      return
    }

    setIsVerifying(true)
    try {
      const result = await verifySignData({
        response: lastResponse,
        address: wallet.account.address,
        publicKey: wallet.account.publicKey || "",
        walletStateInit: wallet.account.walletStateInit || ""
      })

      setVerificationResult(result)

      if (result.valid) {
        toast.success("Signature is valid")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed"
      setVerificationResult({ valid: false, message })
      toast.error(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const [serverVerificationResult, setServerVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifyingOnServer, setIsVerifyingOnServer] = useState(false)

  const verifyOnServer = async () => {
    if (!lastResponse || !wallet) {
      toast.error("No signature to verify")
      return
    }

    setIsVerifyingOnServer(true)
    setServerVerificationResult(null)

    try {
      const requestBody = {
        address: wallet.account.address,
        network: wallet.account.chain,
        public_key: wallet.account.publicKey,
        signature: lastResponse.signature,
        timestamp: lastResponse.timestamp,
        domain: lastResponse.domain,
        payload: lastResponse.payload,
        walletStateInit: wallet.account.walletStateInit
      }

      const response = await fetch('/api/check_sign_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json() as VerificationResult
      setServerVerificationResult(data)

      if (data.valid) {
        toast.success("Server verification: Signature is valid")
      } else {
        toast.error(`Server verification failed: ${data.message}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server verification failed"
      setServerVerificationResult({ valid: false, message })
      toast.error(message)
    } finally {
      setIsVerifyingOnServer(false)
    }
  }

  return {
    dataType, setDataType,
    dataText, setDataText,
    schema, setSchema,
    requestJson,
    responseJson,
    sign,
    setFromJson,
    isConnected: !!wallet,
    // Client verification
    canVerify: !!lastResponse && !!wallet,
    verify,
    verificationResult,
    isVerifying,
    // Server verification
    verifyOnServer,
    serverVerificationResult,
    isVerifyingOnServer,
  }
}
