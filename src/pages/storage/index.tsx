import { HardDrive, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEmulator } from "@/context/EmulatorContext"

const formatBytes = (value: number) => {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export default function StoragePage() {
  const { user, localGames, cloudGames, cloudSaves } = useEmulator()
  const localBytes = localGames.reduce((total, game) => total + game.fileSize, 0)
  const saveBytes = cloudSaves.reduce((total, save) => total + save.sizeBytes, 0)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="size-4 text-primary" />
            Browser storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Metric label="Local ROMs" value={String(localGames.length)} />
          <Metric label="Estimated ROM size" value={formatBytes(localBytes)} />
          <Badge variant="outline">ROM files never leave browser</Badge>
        </CardContent>
      </Card>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4 text-primary" />
            Cloud storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Metric label="Account" value={user ? "Connected" : "Guest"} />
          <Metric label="Game profiles" value={String(cloudGames.length)} />
          <Metric label="Savefiles" value={`${cloudSaves.length} / ${formatBytes(saveBytes)}`} />
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
