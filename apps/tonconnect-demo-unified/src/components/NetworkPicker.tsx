import { useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsContext } from "@/context/SettingsContext"
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react"

export function NetworkPicker() {
  const { selectedNetwork, setSelectedNetwork } = useSettingsContext()
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()

  // Sync selected network with TonConnect SDK
  useEffect(() => {
    // Pass undefined for "any network", or the chain ID for specific network
    const chainId = selectedNetwork || undefined
    tonConnectUI.setConnectionNetwork(chainId)
  }, [selectedNetwork, tonConnectUI])

  // Convert empty string to "any" for Radix Select (doesn't support empty values)
  const value = selectedNetwork || "any"
  const handleChange = (v: string) => setSelectedNetwork(v === "any" ? "" : v)

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={!!wallet}
    >
      <SelectTrigger className="w-[130px] h-9 header-button">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">Any Network</SelectItem>
        <SelectItem value="-239">Mainnet</SelectItem>
        <SelectItem value="-3">Testnet</SelectItem>
      </SelectContent>
    </Select>
  )
}
