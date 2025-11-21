import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { Users, Activity, Clock, Search, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface User {
  userId: string
  firstSeen: string
  lastSeen: string
  totalSessions: number
  totalKeystrokes: number
  sessionsCount: number
}

interface UsersListProps {
  onSelectUser: (userId: string) => void
  selectedUserId?: string
}

export function UsersList({ onSelectUser, selectedUserId }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user =>
        user.userId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users || [])
      setFilteredUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (keystrokes: number, sessions: number) => {
    const avgKeystrokesPerSession = keystrokes / sessions
    if (avgKeystrokesPerSession > 500) return { level: 'high', color: 'danger' }
    if (avgKeystrokesPerSession > 200) return { level: 'medium', color: 'warning' }
    return { level: 'low', color: 'success' }
  }

  const getActivityStatus = (lastSeen: string) => {
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60)

    if (diffHours < 1) return { status: 'active', color: 'bg-green-500' }
    if (diffHours < 24) return { status: 'recent', color: 'bg-yellow-500' }
    return { status: 'idle', color: 'bg-gray-500' }
  }

  const getInitials = (userId: string) => {
    return userId.substring(0, 2).toUpperCase()
  }

  const getGradient = (index: number) => {
    const gradients = [
      'from-cyan-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    return gradients[index % gradients.length]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Users Directory</h2>
          <p className="text-muted-foreground">{users.length} total users</p>
        </div>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user ID..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user, index) => {
          const risk = getRiskLevel(user.totalKeystrokes, user.totalSessions)
          const activity = getActivityStatus(user.lastSeen)
          const isSelected = selectedUserId === user.userId

          return (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`glass-card cursor-pointer transition-all duration-300 hover:scale-105 hover:glow-primary ${
                  isSelected ? 'border-primary ring-2 ring-primary' : 'border-border/50'
                }`}
                onClick={() => onSelectUser(user.userId)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradient(index)} flex items-center justify-center font-bold text-white text-lg shadow-lg`}>
                        {getInitials(user.userId)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${activity.color} rounded-full border-2 border-card`} 
                           title={activity.status} />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm truncate" title={user.userId}>
                          {user.userId.substring(0, 20)}...
                        </h3>
                        <Badge variant={risk.color as any} className="text-xs">
                          {risk.level}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="w-3 h-3" />
                          <span>{user.totalSessions} sessions</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatNumber(user.totalKeystrokes)} keystrokes</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(user.lastSeen).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <button className="w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                      View Full Profile →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No users found</p>
        </div>
      )}
    </div>
  )
}
