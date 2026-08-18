import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "./useWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

export function WorkspacesPage() {
  const { workspaces, loading, error, createWorkspace } = useWorkspaces();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await createWorkspace(name.trim());
    setCreating(false);
    if (error) {
      setCreateError(error);
      return;
    }
    setName("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes espaces de travail</h1>
        <p className="text-sm text-muted-foreground">
          Un espace regroupe tes SAE, stages, révisions et projets personnels.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="workspace-name">Nouvel espace</Label>
          <Input
            id="workspace-name"
            placeholder="Ex : Semestre 4"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>
          {creating ? "Création…" : "Créer"}
        </Button>
      </form>

      {createError && <ErrorState message={createError} />}

      {loading && <LoadingState label="Chargement des espaces…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && workspaces.length === 0 && (
        <EmptyState
          title="Aucun espace pour le moment"
          description="Crée ton premier espace pour commencer à organiser tes SAE, stages ou révisions."
        />
      )}

      {!loading && !error && workspaces.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <Card
              key={workspace.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/espaces/${workspace.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/espaces/${workspace.id}`);
              }}
            >
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Créé le {new Date(workspace.created_at).toLocaleDateString("fr-FR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
