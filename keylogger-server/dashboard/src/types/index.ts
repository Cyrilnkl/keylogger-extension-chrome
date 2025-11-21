export interface Alert {
  userId: string
  sessionId: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
  type: 'auth' | 'admin' | 'financial' | 'suspicious' | 'timing' | 'info'
  description: string
  url: string
  keystrokesCount: number
}

export interface AlertStats {
  total: number
  high: number
  medium: number
  low: number
  byType: {
    auth: number
    admin: number
    financial: number
    suspicious: number
    timing: number
  }
}

export interface SecurityAlertsResponse {
  alerts: Alert[]
  stats: AlertStats
  timestamp: string
}

export interface Stats {
  totalUsers: number
  totalSessions: number
  totalKeystrokes: number
  activeToday: number
}

export interface UserPersona {
  persona: {
    nom: string
    description: string
    traits: string[]
  }
  comportement: {
    typeUtilisateur: string
    activitéPrincipale: string
    heuresActivité: string
  }
  intérêts: string[]
  insights: string[]
  résumé: string
}

export interface Trend {
  tendances: string[]
  catégoriesPrincipales: string[]
  insights: string[]
  recommandations: string[]
}
