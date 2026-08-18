import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorkspacesPage } from "@/features/workspaces/WorkspacesPage";
import { WorkspaceDetailPage } from "@/features/workspaces/WorkspaceDetailPage";
import { ProjectBoardPage } from "@/features/kanban/ProjectBoardPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<SignupPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/espaces" replace />} />
          <Route path="/espaces" element={<WorkspacesPage />} />
          <Route path="/espaces/:workspaceId" element={<WorkspaceDetailPage />} />
          <Route
            path="/espaces/:workspaceId/projets/:projectId"
            element={<ProjectBoardPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
