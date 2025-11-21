import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { StatsCards } from './components/StatsCards'
import { SeverityChart } from './components/SeverityChart'
import { AlertsTable } from './components/AlertsTable'
import { UsersList } from './components/UsersList'
import { UserProfile } from './components/UserProfile'
import type { Stats, SecurityAlertsResponse, Alert } from './types'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from './components/ui/button'
import { Users, Shield } from 'lucide-react'

const API_BASE_URL = '/api'

type View = 'overview' | 'users' | 'user-profile'

function App() {
  const [currentView, setCurrentView] = useState<View>('overview')
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSessions: 0,
    totalKeystrokes: 0,
    activeToday: 0
  })
  
  const [alertsData, setAlertsData] = useState<SecurityAlertsResponse>({
    alerts: [],
    stats: {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      byType: {
        auth: 0,
        admin: 0,
        financial: 0,
        suspicious: 0,
        timing: 0
      }
    },
    timestamp: new Date().toISOString()
  })
  
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/ai/security-alerts`)
      ])

      if (!statsRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const statsData = await statsRes.json()
      const alertsData = await alertsRes.json()

      setStats(statsData)
      setAlertsData(alertsData)
      setFilteredAlerts(alertsData.alerts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredAlerts(alertsData.alerts)
      return
    }

    const lowercaseQuery = query.toLowerCase()
    const filtered = alertsData.alerts.filter(alert =>
      alert.description.toLowerCase().includes(lowercaseQuery) ||
      alert.userId.toLowerCase().includes(lowercaseQuery) ||
      alert.url.toLowerCase().includes(lowercaseQuery) ||
      alert.type.toLowerCase().includes(lowercaseQuery)
    )
    setFilteredAlerts(filtered)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(alertsData.alerts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `security-alerts-${new Date().toISOString()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId)
    setCurrentView('user-profile')
  }

  const handleBackToUsers = () => {
    setCurrentView('users')
    setSelectedUserId(undefined)
  }

  if (loading && alertsData.alerts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && alertsData.alerts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header onSearch={handleSearch} onExport={handleExport} />
      
      {/* Navigation Tabs */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-[73px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            <Button
              variant={currentView === 'overview' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('overview')}
              className="gap-2 rounded-t-lg rounded-b-none"
            >
              <Shield className="w-4 h-4" />
              Security Overview
            </Button>
            <Button
              variant={currentView === 'users' || currentView === 'user-profile' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('users')}
              className="gap-2 rounded-t-lg rounded-b-none"
            >
              <Users className="w-4 h-4" />
              Users Analysis
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Overview View */}
        {currentView === 'overview' && (
          <>
            <StatsCards stats={stats} alertStats={alertsData.stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AlertsTable alerts={filteredAlerts} />
              </div>
              
              <div className="lg:col-span-1">
                <SeverityChart stats={alertsData.stats} />
              </div>
            </div>
          </>
        )}

        {/* Users List View */}
        {currentView === 'users' && (
          <UsersList 
            onSelectUser={handleSelectUser}
            selectedUserId={selectedUserId}
          />
        )}

        {/* User Profile View */}
        {currentView === 'user-profile' && selectedUserId && (
          <UserProfile 
            userId={selectedUserId}
            onBack={handleBackToUsers}
          />
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-6 text-sm text-muted-foreground"
        >
          <p>Last updated: {new Date(alertsData.timestamp).toLocaleString()}</p>
          <p className="mt-2">
            Monitoring {stats.totalUsers} users · {stats.totalSessions} sessions · {alertsData.stats.total} alerts
          </p>
        </motion.footer>
      </main>
    </div>
  )
}

export default App
