import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Search, DollarSign, Users, CreditCard, TrendingUp } from 'lucide-react'

interface Deposit {
  id: string
  username: string
  email: string
  phone: string
  game_name: string | null
  amount: number | null
  status: string | null
  paidly_invoice_id: string | null
  created_at: string
  updated_at: string
}

interface WebhookLog {
  id: string
  event_type: string
  payload: any
  created_at: string
}

interface Stats {
  totalDeposits: number
  totalAmount: number
  completedPayments: number
  pendingPayments: number
}

export default function AdminPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDeposits: 0,
    totalAmount: 0,
    completedPayments: 0,
    pendingPayments: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .or('paidly_invoice_id.not.is.null,status.neq.pending') // Only show deposits that have been processed
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeposits(data || [])

      // Calculate stats only for processed deposits
      const totalDeposits = data?.length || 0
      const totalAmount = data?.reduce((sum, deposit) => sum + (deposit.amount || 0), 0) || 0
      const completedPayments = data?.filter(d => d.status === 'completed').length || 0
      const pendingPayments = data?.filter(d => d.status === 'pending_payment').length || 0

      setStats({
        totalDeposits,
        totalAmount,
        completedPayments,
        pendingPayments
      })
    } catch (error) {
      console.error('Error fetching deposits:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch deposits',
        variant: 'destructive'
      })
    }
  }

  const fetchWebhookLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setWebhookLogs(data || [])
    } catch (error) {
      console.error('Error fetching webhook logs:', error)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    await Promise.all([fetchDeposits(), fetchWebhookLogs()])
    setLoading(false)
  }

  useEffect(() => {
    refreshData()

    // Set up real-time subscriptions
    const depositsChannel = supabase
      .channel('deposits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposits'
        },
        () => {
          fetchDeposits()
        }
      )
      .subscribe()

    const webhookChannel = supabase
      .channel('webhook-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs'
        },
        () => {
          fetchWebhookLogs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(depositsChannel)
      supabase.removeChannel(webhookChannel)
    }
  }, [])

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'pending_payment':
        return <Badge variant="secondary" className="bg-yellow-500">Pending Payment</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredDeposits = deposits.filter(deposit =>
    deposit.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.game_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Payment Admin Dashboard</h1>
            <p className="text-slate-300">Monitor and track all payment transactions</p>
          </div>
          <Button onClick={refreshData} disabled={loading} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeposits}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deposits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Processed Deposits</CardTitle>
                <CardDescription>
                  View and track deposits that have been sent for payment processing
                </CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Search processed deposits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {deposits.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No processed deposits found. Deposits will appear here once payment processing begins.
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Invoice ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell className="font-medium">{deposit.username}</TableCell>
                        <TableCell>{deposit.email}</TableCell>
                        <TableCell>{deposit.game_name || 'N/A'}</TableCell>
                        <TableCell>${deposit.amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                        <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {deposit.paidly_invoice_id || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Logs</CardTitle>
                <CardDescription>
                  Monitor payment webhook events from Paidly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Payload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">{log.event_type}</Badge>
                        </TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <pre className="text-xs bg-slate-100 p-2 rounded max-w-md overflow-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}