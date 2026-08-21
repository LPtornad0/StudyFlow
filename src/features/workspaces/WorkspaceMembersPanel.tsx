import { FormEvent, useState } from "react";
import { useWorkspaceMembers } from "./useWorkspaceMembers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

export function WorkspaceMembersPanel({ workspaceId }: { workspaceId: string }) {
  const { members, loading, error, isOwner, inviteMember, removeMember } = useWorkspaceMembers(workspaceId);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const { error } = await inviteMember(email);
    setInviting(false);
    if (error) {
      setInviteError(error);
      return;
    }
    setEmail("");
  }

  async function handleRemove(userId: string) {
    const confirmed = window.confirm("Retirer cette personne de l'espace de travail ?");
    if (!confirmed) return;
    setRemoveError(null);
    const { error } = await removeMember(userId);
    if (error) setRemoveError(error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membres de l'espace</CardTitle>
        <CardDescription>
          Les membres invités ont accès à tous les projets et tableaux Kanban de cet espace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner && (
          <form onSubmit={handleInvite} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Inviter par e-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="prenom.nom@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={inviting || !email.trim()}>
              {inviting ? "Invitation…" : "Inviter"}
            </Button>
          </form>
        )}
        {inviteError && <ErrorState message={inviteError} />}
        {!isOwner && (
          <p className="text-xs text-muted-foreground">
            Seul le propriétaire de l'espace peut inviter de nouveaux membres.
          </p>
        )}

        {loading && <LoadingState label="Chargement des membres…" />}
        {error && <ErrorState message={error} />}
        {removeError && <ErrorState message={removeError} />}

        {!loading && !error && (
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{member.full_name ?? "Utilisateur"}</span>
                  <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                    {member.role === "owner" ? "Propriétaire" : "Membre"}
                  </Badge>
                </div>
                {isOwner && member.role !== "owner" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.user_id)}
                    className="text-xs text-destructive underline-offset-2 hover:underline"
                    aria-label={`Retirer ${member.full_name ?? "ce membre"} de l'espace`}
                  >
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
