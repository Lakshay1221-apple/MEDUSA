export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  arcs: {
    all: ['arcs'] as const,
    detail: (id: string) => ['arcs', id] as const,
    days: (arcId: string) => ['arcs', arcId, 'days'] as const,
    day: (arcId: string, date: string) => ['arcs', arcId, 'days', date] as const,
  },
  tasks: {
    all: (filters?: Record<string, any>) => ['tasks', filters || {}] as const,
    detail: (id: string) => ['tasks', id] as const,
    revisions: (id: string) => ['tasks', id, 'revisions'] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  focus: {
    all: ['focus'] as const,
  },
  habits: {
    byArc: (arcId: string) => ['habits', arcId] as const,
  },
  documents: {
    byArc: (arcId: string) => ['documents', arcId] as const,
    detail: (id: string) => ['documents', id] as const,
  },
  scheduling: {
    latest: (arcId: string) => ['scheduling', arcId, 'latest'] as const,
  },
  analytics: {
    graph: (arcId?: string, mode?: string) => ['analytics', 'graph', arcId, mode] as const,
    warReport: (arcId: string) => ['analytics', 'war-report', arcId] as const,
  },
  github: {
    status: ['github', 'status'] as const,
  },
  accountability: {
    tags: ['accountability', 'tags'] as const,
    findings: (arcId: string) => ['accountability', 'findings', arcId] as const,
  },
  achievements: {
    all: ['achievements'] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    leaderboard: (id: string) => ['workspaces', id, 'leaderboard'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    preferences: ['notifications', 'preferences'] as const,
  },
};
