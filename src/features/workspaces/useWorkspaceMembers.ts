import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/useAuth";

export type WorkspaceMemberWithProfile = {
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  full_name: string | null;
};

type Row = {
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

export function useWorkspaceMembers(workspaceId: string | undefined) {
  const { user } = useAuth();
  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, user_id, role, created_at, profiles ( full_name )")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur de chargement des membres :", error);
      setError("Impossible de charger les membres de cet espace.");
      setLoading(false);
      return;
    }

    const mapped: WorkspaceMemberWithProfile[] = ((data ?? []) as Row[]).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        workspace_id: row.workspace_id,
        user_id: row.user_id,
        role: row.role,
        created_at: row.created_at,
        full_name: profile?.full_name ?? null,
      };
    });

    setMembers(mapped);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  /**
   * Invite un utilisateur déjà inscrit sur Kanbut, par e-mail, à rejoindre
   * l'espace de travail. La recherche par e-mail se fait côté base via la
   * fonction `invite_workspace_member` (SECURITY DEFINER) car `auth.users`
   * n'est pas accessible directement depuis le client.
   */
  async function inviteMember(email: string): Promise<{ error: string | null }> {
    if (!workspaceId) return { error: "Espace introuvable." };
    const trimmed = email.trim();
    if (!trimmed) return { error: "Merci de saisir une adresse e-mail." };

    const { data, error } = await supabase.rpc("invite_workspace_member", {
      p_workspace_id: workspaceId,
      p_email: trimmed,
      p_role: "member",
    });

    if (error) {
      console.error("Erreur d'invitation :", error);
      return { error: error.message || "L'invitation a échoué." };
    }

    const invited = Array.isArray(data) ? data[0] : data;
    if (invited) {
      setMembers((prev) => [
        ...prev,
        {
          workspace_id: workspaceId,
          user_id: invited.user_id,
          role: invited.role,
          created_at: new Date().toISOString(),
          full_name: invited.full_name ?? null,
        },
      ]);
    }
    return { error: null };
  }

  async function removeMember(userId: string): Promise<{ error: string | null }> {
    if (!workspaceId) return { error: "Espace introuvable." };
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) {
      console.error("Erreur de suppression du membre :", error);
      setMembers(previous);
      return { error: "La suppression du membre a échoué." };
    }
    return { error: null };
  }

  const isOwner = members.some((m) => m.user_id === user?.id && m.role === "owner");

  return { members, loading, error, isOwner, inviteMember, removeMember, refetch: fetchMembers };
}
