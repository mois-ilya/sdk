import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConnect } from "@/hooks/useConnect"
import { useDevToolsContext } from "@/context/DevToolsContext"
import { ConnectedWalletCard } from "@/components/shared/ConnectedWalletCard"
import { ConnectionEventsCard } from "@/components/shared/ConnectionEventsCard"
import { JsonViewer } from "@/components/shared/JsonViewer"
import {
  Plug,
  RefreshCw,
  Key,
  ShieldCheck,
  User,
  Loader2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Copy,
  Check
} from "lucide-react"
import { Info } from "lucide-react" // Used in InfoModal
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

// Info button with modal
function InfoModal({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-3">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Inline copy button for text flow
function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex align-text-bottom ml-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// Verification checks from backend
interface VerifyChecks {
  jwtValid: boolean
  payloadMatch: boolean
  publicKeyMatch: boolean
  addressMatch: boolean
  domainAllowed: boolean
  timestampValid: boolean
  signatureValid: boolean
}

// Compact check indicator
function CheckIndicator({ label, valid }: { label: string; valid: boolean }) {
  return (
    <span>
      <span className={valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
        {label} {valid ? '✓' : '✗'}
      </span>
    </span>
  )
}

function VerificationResult({ checks, error }: { checks: VerifyChecks; error?: string }) {
  const isValid = Object.values(checks).every(Boolean)

  // Core TonProof checks (protocol-level)
  const coreChecks = [
    { key: 'addressMatch', label: 'Address' },
    { key: 'publicKeyMatch', label: 'Public key' },
    { key: 'domainAllowed', label: 'Domain' },
    { key: 'timestampValid', label: 'Timestamp' },
    { key: 'signatureValid', label: 'Signature' },
    { key: 'payloadMatch', label: 'Payload' },
  ] as const

  // Implementation-specific checks (JWT)
  const jwtChecks = [
    { key: 'jwtValid', label: 'JWT' },
  ] as const

  return (
    <div className="space-y-2 text-xs">
      {/* Error message (success shown via button state) */}
      {!isValid && (
        <div className="font-medium text-red-600 dark:text-red-400">
          Invalid — {error || 'Verification failed'}
        </div>
      )}

      {/* Core checks - inline */}
      <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
        {coreChecks.map((check, i) => (
          <span key={check.key}>
            <CheckIndicator label={check.label} valid={checks[check.key]} />
            {i < coreChecks.length - 1 && <span className="text-muted-foreground"> • </span>}
          </span>
        ))}
      </div>

      {/* JWT checks - collapsible */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3 w-3 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
          Implementation details (JWT)
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1.5 pl-4">
          <div className="flex gap-x-1.5">
            {jwtChecks.map((check, i) => (
              <span key={check.key}>
                <CheckIndicator label={check.label} valid={checks[check.key]} />
                {i < jwtChecks.length - 1 && <span className="text-muted-foreground"> • </span>}
              </span>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Display proof data from wallet
interface TonProof {
  timestamp: number
  domain: { lengthBytes: number; value: string }
  payload: string
  signature: string
  state_init?: string
}

function WalletResponseDisplay({ proof }: { proof: TonProof | null }) {
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-1.5 text-xs">
      <div className="font-medium text-muted-foreground">Wallet Response</div>

      <div className="space-y-1">
        {/* timestamp */}
        <p>
          <span className="font-semibold w-20 inline-block">timestamp</span>
          {proof ? (
            <>
              <span className="font-mono">{proof.timestamp}</span>
              <span className="text-muted-foreground ml-1">
                ({new Date(proof.timestamp * 1000).toLocaleTimeString('en-US', { hour12: false })})
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>

        {/* domain */}
        <p>
          <span className="font-semibold w-20 inline-block">domain</span>
          {proof ? (
            <span className="font-mono">{proof.domain.value}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>

        {/* payload — click to copy */}
        <p>
          <span className="font-semibold w-20 inline-block align-top">payload</span>
          {proof ? (
            <code
              onClick={() => copyToClipboard(proof.payload)}
              className="font-mono bg-primary/10 py-0.5 rounded break-all cursor-pointer hover:bg-primary/20 transition-colors [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
              title="Click to copy"
            >
              {proof.payload}
            </code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>

        {/* signature — click to copy */}
        <p>
          <span className="font-semibold w-20 inline-block align-top">signature</span>
          {proof ? (
            <code
              onClick={() => copyToClipboard(proof.signature)}
              className="font-mono bg-primary/10 py-0.5 rounded break-all cursor-pointer hover:bg-primary/20 transition-colors [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
              title="Click to copy"
            >
              {proof.signature}
            </code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </p>
      </div>
    </div>
  )
}

function PayloadDisplay({ response }: { response: Record<string, unknown> }) {
  const payloadToken = String(response.payloadToken || '')
  const payloadTokenHash = String(response.payloadTokenHash || '')

  return (
    <div className="space-y-3">
      {/* Challenge - inline text flow */}
      <p className="text-xs">
        <span className="font-semibold">Challenge</span>{' '}
        <code className="font-mono bg-primary/10 px-1 py-0.5 rounded break-all [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
          {payloadTokenHash}
        </code>
        <InlineCopyButton text={payloadTokenHash} />
      </p>

      {/* Implementation detail */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3 w-3 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
          Implementation details (JWT)
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2 pl-4 border-l-2 border-muted">
            <div className="flex items-center gap-1.5">
              <code className="text-xs font-semibold">payloadToken</code>
              <InfoModal title="Payload Token (JWT)">
                <p>
                  A JWT containing random bytes, created by your backend.
                  Stored client-side and sent back during verification.
                </p>
                <p>
                  The backend verifies the JWT signature to ensure it wasn't tampered with,
                  then checks that SHA256(payloadToken) matches what the wallet signed.
                </p>
              </InfoModal>
            </div>
            <div className="bg-muted/30 rounded-md p-2 font-mono text-[10px] break-all max-h-16 overflow-auto">
              {payloadToken}
            </div>
            <p className="text-[10px] text-muted-foreground">
              This demo uses JWT to create a stateless backend. Your implementation may differ.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function ConnectTab() {
  const { docsHidden } = useDevToolsContext()
  const {
    wallet,
    hasProof,
    isAuthenticated,

    events,

    isGeneratingPayload,
    isConnecting,
    isVerifying,
    isFetchingAccount,

    connect,
    disconnect,
    generatePayload,
    connectWithProof,
    verifyProof,
    getAccountInfo,

    payloadResult,
    verifyResult,
    accountResult,

    canConnect,
    canConnectWithProof,
    canVerify,
    canGetAccount
  } = useConnect()

  return (
    <div className="space-y-6">
      {/* Connected Wallet Card - TOP */}
      <ConnectedWalletCard
        wallet={wallet}
        isAuthenticated={isAuthenticated}
        onDisconnect={disconnect}
      />

      {/* Two columns: 1fr / 2fr */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Simple Connection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" />
              Simple Connection
            </CardTitle>
            <CardDescription>
              Connect wallet without TonProof
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={connect}
              disabled={!canConnect}
              className="gap-2"
            >
              {isConnecting && !hasProof ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plug className="h-4 w-4" />
              )}
              Connect
            </Button>
          </CardContent>
        </Card>

        {/* Right: TonProof Connect */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              TonProof Connect
            </CardTitle>
            <CardDescription>
              Connect with cryptographic proof of wallet ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Backend Challenge */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-sm">Backend Challenge</h4>
                    <InfoModal title="Backend Challenge">
                      <p>
                        Your backend generates a unique challenge (random data) for the wallet to sign.
                        This proves the user controls the wallet's private key.
                      </p>
                      <p>
                        The challenge is a SHA256 hash sent to the wallet. In this demo, it's derived from
                        a JWT token which allows stateless verification.
                      </p>
                    </InfoModal>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 ml-auto"
                      onClick={generatePayload}
                      disabled={isGeneratingPayload}
                      title="Regenerate challenge"
                    >
                      {isGeneratingPayload ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Your backend generates a challenge for wallet to sign</p>
                </div>
                {payloadResult?.status === 'error' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>

              <div className="pl-9 space-y-3">
                {/* Loading state */}
                {isGeneratingPayload && !payloadResult && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating challenge...
                  </div>
                )}

                {/* Payload Data */}
                {payloadResult?.status === 'success' && payloadResult.response != null && (
                  <PayloadDisplay response={payloadResult.response as Record<string, unknown>} />
                )}

                {/* Error */}
                {payloadResult?.status === 'error' && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{payloadResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Step 2: Connect with Proof */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-sm">Connect with Proof</h4>
                    <InfoModal title="Connect with Proof">
                      <p>
                        Opens the wallet with a TonProof request. The wallet signs the challenge
                        from Step 1 to prove ownership of the address.
                      </p>
                      <p>
                        The response contains timestamp, domain, payload (the signed challenge),
                        and signature for backend verification.
                      </p>
                    </InfoModal>
                    <Button
                      size="sm"
                      variant={hasProof ? "outline" : "default"}
                      className="ml-auto gap-2"
                      onClick={connectWithProof}
                      disabled={!canConnectWithProof}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Key className="h-3 w-3" />
                      )}
                      Connect
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Opens wallet with TonProof request</p>
                </div>
              </div>

              <div className="pl-9">
                <WalletResponseDisplay
                  proof={hasProof && wallet?.connectItems?.tonProof && !('error' in wallet.connectItems.tonProof)
                    ? wallet.connectItems.tonProof.proof as TonProof
                    : null}
                />
              </div>
            </div>

            {/* Step 3: Verify Proof */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-sm">Verify Proof</h4>
                    <InfoModal title="Verify Proof">
                      <p>
                        Backend performs cryptographic verification of the wallet's signature.
                        All checks must pass for successful authentication.
                      </p>
                      <p>
                        This demo uses JWT for stateless verification — the payloadToken
                        ties the signature to this specific session.
                      </p>
                    </InfoModal>
                    <Button
                      size="sm"
                      variant={isAuthenticated ? "outline" : "default"}
                      className={`ml-auto gap-2 ${isAuthenticated ? "border-green-600 text-green-600 hover:bg-green-600/10 dark:border-green-400 dark:text-green-400" : ""}`}
                      onClick={verifyProof}
                      disabled={!canVerify && !isAuthenticated}
                      title={isAuthenticated ? "Click to re-verify" : undefined}
                    >
                      {isVerifying ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isAuthenticated ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                      {isAuthenticated ? "Verified" : "Verify"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Send proof to backend for cryptographic verification
                  </p>
                </div>
              </div>

              {/* Result - only shown after verification */}
              {verifyResult && (verifyResult.response as { checks?: VerifyChecks } | undefined)?.checks && (
                <div className="pl-9">
                  <VerificationResult
                    checks={(verifyResult.response as { checks: VerifyChecks }).checks}
                    error={verifyResult.error}
                  />
                </div>
              )}
            </div>

            {/* Example: Using Auth Token (collapsible, only after verification) */}
            {isAuthenticated && (
              <Collapsible className="mt-6 pt-6 border-t">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full transition-colors">
                  <ChevronRight className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                  <span>Example: Using the Auth Token</span>
                  <Badge variant="outline" className="ml-auto text-[10px]">Optional</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="pl-6 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      After successful verification, your backend returns an auth token.
                      This example shows how to use it for authenticated API calls.
                    </p>
                    <Button
                      onClick={getAccountInfo}
                      disabled={!canGetAccount}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      {isFetchingAccount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      Get Account Info
                    </Button>
                    {accountResult && (
                      <div className="space-y-2">
                        {accountResult.status === 'error' && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{accountResult.error}</AlertDescription>
                          </Alert>
                        )}
                        {accountResult.request != null && (
                          <JsonViewer
                            title="Request"
                            json={JSON.stringify(accountResult.request, null, 2)}
                            maxHeight={100}
                            defaultExpanded={false}
                          />
                        )}
                        {accountResult.status === 'success' && accountResult.response != null && (
                          <JsonViewer
                            title="Response"
                            json={JSON.stringify(accountResult.response, null, 2)}
                            maxHeight={100}
                            defaultExpanded={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection Events */}
      <ConnectionEventsCard events={events} />

      {/* How It Works */}
      {!docsHidden && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-foreground mb-2">Simple Connection</h4>
                <p>Opens the wallet modal. User selects a wallet and approves.
                   No proof is requested - you only get the wallet address.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">TonProof Connection</h4>
                <p>First generates a challenge on your server. During connection,
                   wallet signs this challenge proving ownership. Proof can only
                   be requested at connection time, not after.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Verification</h4>
                <p>Backend verifies the Ed25519 signature, validates the challenge matches,
                   and checks the address. Returns an authentication token on success.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">After Authentication</h4>
                <p>The auth token can be used for protected API calls.
                   Token format (JWT, session, etc.) depends on your backend implementation.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
