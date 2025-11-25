"use client"

interface TransactionFlowProps {
  sender: string
  recipients: string[]
  moveCalls: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
}

export function TransactionFlow({
  sender,
  recipients,
  moveCalls,
  objectsCreated,
  objectsMutated,
  objectsTransferred,
}: TransactionFlowProps) {
  return (
    <div className="w-full space-y-4">
      {/* Sender */}
      <div className="flex items-center justify-center">
        <div className="px-4 py-3 bg-card border border-border rounded-lg shadow-sm">
          <p className="text-xs text-muted-foreground">Sender</p>
          <p className="font-mono text-sm font-semibold">{sender.slice(0, 10)}...</p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="text-muted-foreground">↓</div>
      </div>

      {/* Move Calls */}
      {moveCalls.length > 0 && (
        <>
          <div className="space-y-2">
            {moveCalls.map((call, index) => (
              <div key={index} className="flex items-center justify-center">
                <div className="px-4 py-2 bg-muted rounded-lg border border-border text-center">
                  <p className="text-xs text-muted-foreground">Move Call</p>
                  <p className="font-mono text-xs">{call.split("::")[2] || call}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="text-muted-foreground">↓</div>
          </div>
        </>
      )}

      {/* Object Changes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Objects Created</p>
          <p className="text-lg font-bold">{objectsCreated}</p>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Objects Mutated</p>
          <p className="text-lg font-bold">{objectsMutated}</p>
        </div>
        <div className="p-3 bg-card border border-border rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Objects Transferred</p>
          <p className="text-lg font-bold">{objectsTransferred}</p>
        </div>
      </div>

      {/* Arrow */}
      {recipients.length > 0 && (
        <div className="flex justify-center">
          <div className="text-muted-foreground">↓</div>
        </div>
      )}

      {/* Recipients */}
      {recipients.length > 0 && (
        <div className={`grid gap-3 ${recipients.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {recipients.map((recipient, index) => (
            <div key={index} className="px-4 py-3 bg-card border border-border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-mono text-sm font-semibold">{recipient.slice(0, 10)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
