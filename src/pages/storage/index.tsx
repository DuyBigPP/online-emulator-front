import { Cloud, Database, HardDrive, Save, ShieldCheck } from "lucide-react"
import { MetricTile, PageHeader } from "@/components/app/PageShell"
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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Storage map"
        title="Browser and Cloud Storage"
        description="ROM files stay local in IndexedDB. Cloud storage only keeps account metadata and save files."
        icon={<HardDrive className="size-5" />}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Local ROMs" value={String(localGames.length)} detail={formatBytes(localBytes)} icon={<HardDrive className="size-4" />} tone="primary" />
        <MetricTile label="Cloud account" value={user ? "Connected" : "Guest"} detail={user?.email ?? "No cloud sync"} icon={<Cloud className="size-4" />} />
        <MetricTile label="Game profiles" value={String(cloudGames.length)} detail="Metadata rows" icon={<Database className="size-4" />} tone="accent" />
        <MetricTile label="Savefiles" value={String(cloudSaves.length)} detail={formatBytes(saveBytes)} icon={<Save className="size-4" />} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <StorageCard
          title="Browser cartridge shelf"
          icon={<HardDrive className="size-4 text-primary" />}
          badge="Local only"
          rows={[
            ["ROM files", `${localGames.length} files`],
            ["Estimated size", formatBytes(localBytes)],
            ["Upload policy", "Never sent to backend"],
          ]}
        />
        <StorageCard
          title="Cloud memory card"
          icon={<ShieldCheck className="size-4 text-primary" />}
          badge={user ? "Sync on" : "Guest"}
          rows={[
            ["Game profiles", String(cloudGames.length)],
            ["Savefiles", `${cloudSaves.length} files`],
            ["Stored bytes", formatBytes(saveBytes)],
          ]}
        />
      </div>
    </div>
  )
}

function StorageCard({ title, icon, badge, rows }: { title: string; icon: React.ReactNode; badge: string; rows: Array<[string, string]> }) {
  return (
    <Card className="console-panel overflow-hidden py-0">
      <CardHeader className="border-b border-white/10 bg-white/[0.025] cartridge-notch px-5 py-4">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">{icon}{title}</span>
          <Badge variant="outline">{badge}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-lg border bg-background/55 p-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="min-w-0 truncate text-right text-sm font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

