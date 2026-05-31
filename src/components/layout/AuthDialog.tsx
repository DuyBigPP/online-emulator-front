import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmulator } from "@/context/EmulatorContext"

export function AuthDialog({ children }: { children: React.ReactNode }) {
  const { login, register } = useEmulator()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [pending, setPending] = useState(false)

  const submit = async (mode: "login" | "register") => {
    setPending(true)
    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(email, password, displayName || undefined)
      }
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Auth failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cloud sync</DialogTitle>
          <DialogDescription>Sign in to sync metadata and savefiles.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 pt-4">
            <AuthFields
              email={email}
              password={password}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
            />
            <Button className="w-full" disabled={pending} onClick={() => void submit("login")}>
              Login
            </Button>
          </TabsContent>
          <TabsContent value="register" className="space-y-4 pt-4">
            <AuthFields
              email={email}
              password={password}
              displayName={displayName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onDisplayNameChange={setDisplayName}
            />
            <Button className="w-full" disabled={pending} onClick={() => void submit("register")}>
              Register
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function AuthFields({
  email,
  password,
  displayName,
  onEmailChange,
  onPasswordChange,
  onDisplayNameChange,
}: {
  email: string
  password: string
  displayName?: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onDisplayNameChange?: (value: string) => void
}) {
  return (
    <div className="space-y-3">
      {onDisplayNameChange ? (
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Player"
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="player@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="Minimum 8 characters"
        />
      </div>
    </div>
  )
}
