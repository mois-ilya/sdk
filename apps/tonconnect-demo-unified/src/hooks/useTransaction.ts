import { useState, useEffect } from "react"
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react"
import { toast } from "sonner"

export interface TransactionMessage {
  address: string
  amount: string
  stateInit?: string
  payload?: string
}

const PRESETS = {
  simple: {
    name: "Simple Transfer",
    validUntil: 600,
    network: "-239",
    from: "",
    messages: [{ address: "EQCKWpx7cNMpvmcN0dtJv8wGQyNJVOkC-kxfJKZSDPMcmWyW", amount: "5000000" }],
  },
  withPayload: {
    name: "Transfer with Comment",
    validUntil: 600,
    network: "-239",
    from: "",
    messages: [{ address: "EQCKWpx7cNMpvmcN0dtJv8wGQyNJVOkC-kxfJKZSDPMcmWyW", amount: "10000000", payload: "te6cckEBAQEADAAMABQAAAAASGVsbG8h" }],
  },
  multiMessage: {
    name: "Multiple Messages",
    validUntil: 600,
    network: "-239",
    from: "",
    messages: [
      { address: "EQCKWpx7cNMpvmcN0dtJv8wGQyNJVOkC-kxfJKZSDPMcmWyW", amount: "5000000" },
      { address: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N", amount: "3000000" },
    ],
  },
  jetton: {
    name: "Jetton Transfer",
    validUntil: 600,
    network: "-239",
    from: "",
    messages: [{ address: "EQCKWpx7cNMpvmcN0dtJv8wGQyNJVOkC-kxfJKZSDPMcmWyW", amount: "50000000", payload: "te6cckEBAgEAqwAB4YgBQzYIKlMZvqYGaO2k3+YDIZGkqnSBfSYvklMpBnmOTLbgIUMWCCpTGb6mBmjtpN/mAyGRpKp0gX0mL5JTKQZJjky2wAAAAAAAAAAAAAAAAAEBAGRURVNUIFRSQU5TRkVSIFRPIEpFVFRPTiBXQUxMRVQgV0lUSCBDT01NRU5U" }],
  },
} as const

export type PresetKey = keyof typeof PRESETS

export function useTransaction(showToastBefore = true, showToastSuccess = true, showToastError = true, networkOverride?: string) {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  const [validUntil, setValidUntil] = useState("600")
  const [network, setNetwork] = useState("-239")
  const [from, setFrom] = useState("")
  const [messages, setMessages] = useState<TransactionMessage[]>([
    { address: "EQCKWpx7cNMpvmcN0dtJv8wGQyNJVOkC-kxfJKZSDPMcmWyW", amount: "5000000", stateInit: "", payload: "" },
  ])

  const [requestJson, setRequestJson] = useState("")
  const [responseJson, setResponseJson] = useState("")

  // For transaction tracking
  const [lastBoc, setLastBoc] = useState<string | null>(null)
  const [lastValidUntil, setLastValidUntil] = useState<number>(0)

  // Build request JSON
  useEffect(() => {
    const builtMessages = messages.map((msg) => {
      const m: Record<string, string> = { address: msg.address, amount: msg.amount }
      if (msg.stateInit) m.stateInit = msg.stateInit
      if (msg.payload) m.payload = msg.payload
      return m
    })

    const tx: Record<string, unknown> = {
      validUntil: Math.floor(Date.now() / 1000) + parseInt(validUntil),
      messages: builtMessages,
    }
    const effectiveNetwork = networkOverride || network
    if (effectiveNetwork) tx.network = effectiveNetwork
    if (from) tx.from = from

    setRequestJson(JSON.stringify(tx, null, 2))
  }, [validUntil, network, networkOverride, from, messages])

  const loadPreset = (key: PresetKey) => {
    const preset = PRESETS[key]
    setValidUntil(preset.validUntil.toString())
    setNetwork(preset.network)
    setFrom(preset.from)
    setMessages(preset.messages.map((msg) => ({
      address: msg.address,
      amount: msg.amount,
      stateInit: "",
      payload: "payload" in msg ? msg.payload : "",
    })))
  }

  const addMessage = () => {
    setMessages([...messages, { address: "", amount: "1000000", stateInit: "", payload: "" }])
  }

  const removeMessage = (index: number) => {
    if (messages.length > 1) setMessages(messages.filter((_, i) => i !== index))
  }

  const updateMessage = (index: number, field: keyof TransactionMessage, value: string) => {
    const updated = [...messages]
    updated[index] = { ...updated[index], [field]: value }
    setMessages(updated)
  }

  // Set form state from JSON (for edit mode)
  const setFromJson = (json: string) => {
    try {
      const data = JSON.parse(json)

      // Extract validUntil as offset from now
      if (data.validUntil) {
        const offset = data.validUntil - Math.floor(Date.now() / 1000)
        setValidUntil(Math.max(60, offset).toString())
      }

      if (data.network !== undefined) setNetwork(data.network)
      if (data.from !== undefined) setFrom(data.from)

      if (Array.isArray(data.messages)) {
        setMessages(data.messages.map((msg: Record<string, string>) => ({
          address: msg.address || "",
          amount: msg.amount || "0",
          stateInit: msg.stateInit || "",
          payload: msg.payload || "",
        })))
      }
    } catch {
      // Invalid JSON - ignore
    }
  }

  const send = async () => {
    if (!wallet) {
      toast.error("Please connect wallet first")
      return
    }

    // Reset previous tracking
    setLastBoc(null)
    setLastValidUntil(0)

    try {
      const builtMessages = messages.map((msg) => {
        const m: Record<string, string> = { address: msg.address, amount: msg.amount }
        if (msg.stateInit) m.stateInit = msg.stateInit
        if (msg.payload) m.payload = msg.payload
        return m
      })

      const txValidUntil = Math.floor(Date.now() / 1000) + parseInt(validUntil)

      if (showToastBefore) toast.info("Please confirm in your wallet")

      const result = await tonConnectUI.sendTransaction({
        validUntil: txValidUntil,
        messages: builtMessages as Array<{ address: string; amount: string; stateInit?: string; payload?: string }>,
      })

      setResponseJson(JSON.stringify(result, null, 2))

      // Save BOC and validUntil for tracking
      if (result.boc) {
        setLastBoc(result.boc)
        setLastValidUntil(txValidUntil)
      }

      if (showToastSuccess) toast.success("Transaction sent successfully")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed"
      setResponseJson(JSON.stringify({ error: message }, null, 2))
      if (showToastError) toast.error(message)
    }
  }

  return {
    validUntil, setValidUntil,
    network, setNetwork,
    from, setFrom,
    messages,
    requestJson,
    responseJson,
    loadPreset,
    addMessage,
    removeMessage,
    updateMessage,
    send,
    setFromJson,
    isConnected: !!wallet,
    // For transaction tracking
    lastBoc,
    lastValidUntil,
  }
}
