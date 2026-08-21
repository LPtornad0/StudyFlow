# Kanbut

L'outil de pilotage des projets et révisions pour les étudiants en BUT.

Kanbut combine gestion de projets, de tâches, de notes, de planning et de travail
collaboratif pour aider un étudiant à piloter ses SAE, devoirs, stages, projets
personnels et projets de groupe — avec un indicateur de charge de travail comme
fonctionnalité différenciante.

## Stack technique

- **Frontend** : React, TypeScript, Vite
- **Style** : Tailwind CSS, composants façon shadcn/ui (composables, dans `src/components/ui`)
- **Backend** : Supabase (authentification, base PostgreSQL, RLS, stockage, temps réel)
- **Graphiques** : Recharts (niveau intermédiaire/avancé)
- **Glisser-déposer** : @dnd-kit (tableau Kanban)
- **Déploiement cible** : Vercel
- **Domaine** : kanbut.app

## Installation

```bash
npm install
cp .env.example .env.local
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local
npm run dev
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon/publishable) du projet Supabase |

Ces valeurs se trouvent dans Supabase > Project Settings > API. Ne jamais commiter
`.env.local` ni la clé `service_role`.

## Schéma de données (MVP)

Tables principales, toutes protégées par Row Level Security :

- `profiles` : profil applicatif lié à `auth.users`, créé automatiquement à l'inscription.
- `workspaces` : espaces de travail (SAE, stage, révisions, projet perso…).
- `workspace_members` : appartenance à un espace avec rôle `owner` ou `member`.
- `projects` : projets rattachés à un espace.
- `board_columns` : listes personnalisables du tableau Kanban de chaque projet.
- `tasks` : tâches avec liste (`column_id`), priorité, échéance, temps estimé
  (en minutes), position pour le Kanban, couleur.
- `labels` / `task_labels` : catégories personnalisables par espace.
- `comments` : commentaires collaboratifs sur les tâches.

Voir les migrations SQL appliquées sur le projet Supabase `Kanbut` pour le détail
des contraintes, index et politiques RLS (fonctions `is_workspace_member`,
`is_workspace_owner`, `is_project_member`, `is_task_member`).

## Droits d'accès (résumé RLS)

- Un utilisateur ne voit un espace, ses projets, tâches et labels que s'il est membre
  de cet espace (accès direct ou indirect via projet → espace).
- Seul un `owner` peut gérer les membres (y compris inviter par e-mail), modifier ou
  supprimer l'espace, ou supprimer un projet.
- Un `member` peut créer/modifier projets, tâches, listes et labels de son espace.

## Fonctionnalité différenciante : charge de travail

Le calcul (`src/features/workload/computeWorkload.ts`) :

- ne prend en compte que les tâches **non terminées avec une échéance et une
  estimation** ;
- applique un ordonnancement par échéance (au plus tôt) : les tâches dues bientôt
  sont servies en priorité sur la capacité quotidienne, avant les tâches à échéance
  lointaine ;
- signale les jours où la charge dépasse un seuil quotidien réaliste configurable ;
- affiche toujours les hypothèses (jours inclus/exclus, tâches sans estimation ou
  sans échéance) et présente le résultat comme une estimation, jamais une certitude.

## Structure du code

```
src/
  app/            # providers et routeur
  components/     # ui/ (composants réutilisables), layout/, shared/
  features/       # auth, workspaces, projects, tasks, kanban, workload, comments…
  lib/            # client Supabase centralisé, utilitaires
  types/          # types générés Supabase + types domaine
```

## Roadmap

- [x] MVP : auth, espaces, projets, tâches CRUD, Kanban drag & drop, RLS
- [x] Listes de tableau personnalisables (ajout, titre, couleur, réordonnancement)
- [x] Commentaires collaboratifs sur les tâches
- [x] Invitation de membres par e-mail dans un espace de travail
- [ ] Calendrier hebdomadaire, recherche globale, notes Markdown avancées, pièces jointes
- [ ] Collaboration temps réel, notifications
- [ ] Rôles avancés, dashboard analytique, mode sombre, PWA/Capacitor

## Démo

_À compléter après le déploiement sur kanbut.app._
