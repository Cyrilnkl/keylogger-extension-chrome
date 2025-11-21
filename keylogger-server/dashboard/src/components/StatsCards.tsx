import { Activity, AlertTriangle, Users, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { formatNumber } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

interface StatsCardsProps {
  stats: {
    totalUsers: number
    totalSessions: number
    totalKeystrokes: number
    activeToday: number
  }
  alertStats: {
    total: number
    high: number
    medium: number
    low: number
  }
}

function generateTrendData(value: number, points: number = 12) {
  return Array.from({ length: points }, (_, i) => ({
    value: value * (0.7 + Math.random() * 0.6) * (i / points + 0.5)
  }))
}

export function StatsCards({ stats, alertStats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      gradientId: 'gradient-green',
      strokeColor: '#10b981',
      data: generateTrendData(stats.totalSessions)
    },
    {
      title: 'Monitored Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      gradientId: 'gradient-blue',
      strokeColor: '#3b82f6',
      data: generateTrendData(stats.totalUsers)
    },
    {
      title: 'Security Alerts',
      value: alertStats.total,
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      gradientId: 'gradient-orange',
      strokeColor: '#f97316',
      data: generateTrendData(alertStats.total)
    },
    {
      title: 'Active Today',
      value: stats.activeToday,
      icon: CheckCircle,
      color: 'from-purple-500 to-pink-500',
      gradientId: 'gradient-purple',
      strokeColor: '#a855f7',
      data: generateTrendData(stats.activeToday)
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:glow-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {formatNumber(card.value)}
                </div>
                <div className="h-16 -mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={card.data}>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={card.strokeColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
