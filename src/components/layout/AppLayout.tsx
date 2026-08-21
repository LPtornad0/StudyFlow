import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const { signOut, profile } = useAuth();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-none items-center justify-between border-b px-4 py-3">
        <NavLink to="/espaces" className="text-lg font-semibold">
          Kanbut
        </NavLink>
        <div className="flex items-center gap-3">
          {profile?.full_name && (
            <span className="text-sm text-muted-foreground">{profile.full_name}</span>
          )}
          <Button variant="outline" size="sm" onClick={signOut} aria-label="Se déconnecter">
            Déconnexion
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
