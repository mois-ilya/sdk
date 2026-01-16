import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { JsonViewer } from "./JsonViewer"
import type { Wallet } from "@tonconnect/ui-react"
import type { WalletEvent } from "@/hooks/useConnect"
import { Plug, Unplug, RefreshCw, Circle } from "lucide-react"

interface WalletResponseCardProps {
  wallet: Wallet | null
  events: WalletEvent[]
  lastWalletResponse: unknown
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const EVENT_ICONS = {
  connected: Plug,
  disconnected: Unplug,
  reconnected: RefreshCw
}

const EVENT_COLORS = {
  connected: 'text-green-500',
  disconnected: 'text-muted-foreground',
  reconnected: 'text-blue-500'
}

export function WalletResponseCard({ wallet, events, lastWalletResponse }: WalletResponseCardProps) {
  const isConnected = !!wallet

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Wallet Response</span>
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1.5">
            <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-muted-foreground text-muted-foreground'}`} />
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {wallet && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Address: </span>
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                {formatAddress(wallet.account.address)}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Network: </span>
              <Badge variant="outline" className="text-xs">
                {wallet.account.chain === '-239' ? 'Mainnet' : 'Testnet'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Wallet: </span>
              <span>{wallet.device.appName}</span>
            </div>
            {wallet.connectItems?.tonProof && !('error' in wallet.connectItems.tonProof) && (
              <div>
                <Badge variant="secondary" className="text-xs">Has Proof</Badge>
              </div>
            )}
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Events</span>
            <ScrollArea className={events.length > 4 ? "h-32" : ""}>
              <div className="space-y-1">
                {events.map((event) => {
                  const Icon = EVENT_ICONS[event.type]
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 text-xs font-mono"
                    >
                      <span className="text-muted-foreground">{formatTime(event.timestamp)}</span>
                      <Icon className={`h-3 w-3 ${EVENT_COLORS[event.type]}`} />
                      <span className={EVENT_COLORS[event.type]}>{event.type}</span>
                      {event.walletName && (
                        <span className="text-muted-foreground">({event.walletName})</span>
                      )}
                      {event.address && (
                        <code className="text-muted-foreground">{formatAddress(event.address)}</code>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Last Wallet Response JSON */}
        {lastWalletResponse != null && (
          <JsonViewer
            title="Last Wallet Response"
            json={JSON.stringify(lastWalletResponse, null, 2)}
            maxHeight={200}
            defaultExpanded={false}
          />
        )}

        {/* Empty state */}
        {!wallet && events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Connect a wallet to see response data here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
