import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useWorkspace } from "./useWorkspace";
import { useProjects } from "@/features/projects/useProjects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

export function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspace, loading: loadingWorkspace, error: workspaceError } = useWorkspace(workspaceId);
  const { projects, loading: loadingProjects, error: projectsError, createProject } =
    useProjects(workspaceId);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError(null);
    const { error } = await createProject(name.trim());
    setCreating(false);
    if (error) {
      setCreateError(error);
      return;
    }
    setName("");
  }

  if (loadingWorkspace) return <LoadingState label="Chargement de l'espace…" />;
  if (workspaceError) return <ErrorState message={workspaceError} />;
  if (!workspace) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">Projets de cet espace de travail.</p>
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="project-name">Nouveau projet</Label>
          <Input
            id="project-name"
            placeholder="Ex : SAE 4.01"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating || !name.trim()}>
          {creating ? "Création…" : "Créer"}
        </Button>
      </form>

      {createError && <ErrorState message={createError} />}
      {loadingProjects && <LoadingState label="Chargement des projets…" />}
      {projectsError && <ErrorState message={projectsError} />}

      {!loadingProjects && !projectsError && projects.length === 0 && (
        <EmptyState
          title="Aucun projet dans cet espace"
          description="Crée un premier projet pour commencer à ajouter des tâches."
        />
      )}

      {!loadingProjects && !projectsError && projects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} to={`/espaces/${workspaceId}/projets/${project.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
