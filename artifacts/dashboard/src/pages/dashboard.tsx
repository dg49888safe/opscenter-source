import { useGetAgentStats, useListAgents, useListAllCommands } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Activity, TerminalSquare, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats } = useGetAgentStats({ query: { refetchInterval: 5000 } });
  const { data: agents } = useListAgents({ query: { refetchInterval: 5000 } });
  const { data: commands } = useListAllCommands({ query: { refetchInterval: 5000 } });

  const statCards = [
    { title: "\u7ec8\u7aef\u603b\u6570", value: stats?.total ?? "-", icon: Server, color: "text-blue-500" },
    { title: "\u5728\u7ebf\u7ec8\u7aef", value: stats?.online ?? "-", icon: Activity, color: "text-green-500" },
    { title: "\u79bb\u7ebf\u7ec8\u7aef", value: stats?.offline ?? "-", icon: AlertCircle, color: "text-muted-foreground" },
    { title: "\u4eca\u65e5\u547d\u4ee4", value: stats?.commandsToday ?? "-", icon: TerminalSquare, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">\u4eea\u8868\u76d8\u6982\u89c8</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <Card key={stat.title} className={`bg-card/50 backdrop-blur border-border/50 stagger-${i + 1}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-mono">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur border-border/50 col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm tracking-wider flex items-center justify-between">
              \u6d3b\u8dc3\u7ec8\u7aef
              <Badge variant="outline" className="text-primary border-primary/20">\u5b9e\u65f6</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents?.slice(0, 5).map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      {agent.status === 'online' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span>
                      )}
                    </div>
                    <div>
                      <Link href={`/agents/${agent.id}`} className="font-mono text-sm hover:underline font-medium">
                        {agent.hostname}
                      </Link>
                      <div className="text-xs text-muted-foreground">{agent.ip}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono text-right">
                    {agent.os}
                  </div>
                </div>
              ))}
              {!agents?.length && <div className="text-sm text-muted-foreground py-4 text-center">\u6682\u65e0\u6ce8\u518c\u7ec8\u7aef</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm tracking-wider">\u6700\u8fd1\u547d\u4ee4</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commands?.slice(0, 5).map(cmd => (
                <div key={cmd.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-primary truncate max-w-[200px]">$ {cmd.command}</span>
                    <Badge variant="outline" className={
                      cmd.status === 'completed' ? 'text-green-500 border-green-500/20' :
                      cmd.status === 'running' ? 'text-yellow-500 border-yellow-500/20 animate-pulse' :
                      cmd.status === 'failed' ? 'text-destructive border-destructive/20' :
                      'text-muted-foreground border-border'
                    }>
                      {cmd.status === 'completed' ? '\u5df2\u5b8c\u6210' : cmd.status === 'running' ? '\u6267\u884c\u4e2d' : cmd.status === 'failed' ? '\u5931\u8d25' : cmd.status === 'pending' ? '\u7b49\u5f85\u4e2d' : cmd.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{cmd.agentName}</span>
                    <span>{formatDistanceToNow(new Date(cmd.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
              {!commands?.length && <div className="text-sm text-muted-foreground py-4 text-center">\u6682\u65e0\u8fd1\u671f\u547d\u4ee4</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
