import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Alert } from '@/types'
import { extractDomain, formatDuration } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Clock, User, Globe, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface AlertsTableProps {
  alerts: Alert[]
}

const ITEMS_PER_PAGE = 10

export function AlertsTable({ alerts }: AlertsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentAlerts = alerts.slice(startIndex, endIndex)

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auth': return '🔐'
      case 'admin': return '⚠️'
      case 'financial': return '💳'
      case 'suspicious': return '🤖'
      case 'timing': return '🌙'
      default: return '📝'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="glass-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Security Alerts</CardTitle>
          <Badge variant="outline" className="text-sm">
            {alerts.length} total alerts
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[200px]">Domain</TableHead>
                  <TableHead className="w-[150px]">User</TableHead>
                  <TableHead className="w-[120px]">Time</TableHead>
                  <TableHead className="w-[100px]">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No alerts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAlerts.map((alert, index) => (
                    <TableRow 
                      key={`${alert.sessionId}-${index}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <Badge variant={getSeverityVariant(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xl" title={alert.type}>
                          {getTypeIcon(alert.type)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {alert.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Globe className="w-3 h-3" />
                          {extractDomain(alert.url)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {alert.userId.substring(0, 12)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {formatDuration(Math.round(alert.keystrokesCount * 0.5))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, alerts.length)} of {alerts.length} alerts
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground px-3">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
