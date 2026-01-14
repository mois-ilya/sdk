import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormContainer } from "@/components/shared/FormContainer"
import { TransactionResult } from "@/components/shared/TransactionResult"
import { useTransaction } from "@/hooks/useTransaction"
import { useSettingsContext } from "@/context/SettingsContext"
import { validateTransactionJson } from "@/utils/validator"
import { Plus, Trash2 } from "lucide-react"
import type { PresetKey } from "@/hooks/useTransaction"

export function TransactionTab() {
  const { modalsBefore, modalsSuccess, modalsError, selectedNetwork } = useSettingsContext()
  const {
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
    isConnected,
    lastBoc,
    lastValidUntil,
  } = useTransaction(modalsBefore, modalsSuccess, modalsError, selectedNetwork)

  const formContent = (
    <>
      <div className="space-y-2">
        <Label>Load preset</Label>
        <Select onValueChange={(value) => loadPreset(value as PresetKey)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a preset..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple Transfer (0.005 TON)</SelectItem>
            <SelectItem value="withPayload">Transfer with Comment</SelectItem>
            <SelectItem value="multiMessage">Multiple Messages (2 recipients)</SelectItem>
            <SelectItem value="jetton">Jetton Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid Until (seconds)</Label>
          <Input id="validUntil" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="600" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="network">Network (optional)</Label>
          <Input
            id="network"
            value={selectedNetwork || network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="-239"
            disabled={!!selectedNetwork}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="from">From (optional)</Label>
        <Input id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Sender address" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Messages</Label>
          <Button variant="outline" size="sm" onClick={addMessage}>
            <Plus className="mr-2 h-4 w-4" />Add Message
          </Button>
        </div>

        {messages.map((message, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Message {index + 1}</h4>
              {messages.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeMessage(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`address-${index}`}>Address</Label>
              <Input id={`address-${index}`} value={message.address} onChange={(e) => updateMessage(index, "address", e.target.value)} placeholder="Recipient address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`amount-${index}`}>Amount (nanotons)</Label>
              <Input id={`amount-${index}`} value={message.amount} onChange={(e) => updateMessage(index, "amount", e.target.value)} placeholder="5000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`stateInit-${index}`}>State Init (optional)</Label>
              <Textarea id={`stateInit-${index}`} value={message.stateInit} onChange={(e) => updateMessage(index, "stateInit", e.target.value)} placeholder="State init data" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`payload-${index}`}>Payload (optional)</Label>
              <Textarea id={`payload-${index}`} value={message.payload} onChange={(e) => updateMessage(index, "payload", e.target.value)} placeholder="Transaction payload" rows={2} />
            </div>
          </div>
        ))}
      </div>
    </>
  )

  const submitButton = (
    <Button onClick={send} className="w-full" disabled={!isConnected}>
      {isConnected ? "Send Transaction" : "Connect wallet to send transaction"}
    </Button>
  )

  return (
    <>
      <FormContainer
        formTitle="Configure and send transaction"
        formDescription="Set up transaction parameters and send to the network"
        formContent={formContent}
        requestJson={requestJson}
        responseJson={responseJson}
        onJsonChange={setFromJson}
        validateJson={validateTransactionJson}
        submitButton={submitButton}
      />
      {lastBoc && <TransactionResult boc={lastBoc} validUntil={lastValidUntil} />}
    </>
  )
}
