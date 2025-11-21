import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'

interface SeverityChartProps {
  stats: {
    high: number
    medium: number
    low: number
  }
}

export function SeverityChart({ stats }: SeverityChartProps) {
  const total = stats.high + stats.medium + stats.low || 1
  
  const data = [
    { name: 'High Risk', value: stats.high, color: '#ef4444', percentage: Math.round((stats.high / total) * 100) },
    { name: 'Medium Risk', value: stats.medium, color: '#f59e0b', percentage: Math.round((stats.medium / total) * 100) },
    { name: 'Low Risk', value: stats.low, color: '#10b981', percentage: Math.round((stats.low / total) * 100) },
  ].filter(item => item.value > 0) // Only show non-zero values

  const COLORS = data.map(d => d.color)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Risk Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => `${Math.round((entry.percent || 0) * 100)}%`}
                    >
                      {data.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 space-y-3">
                {data.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{item.value} alerts</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No alerts to display
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
