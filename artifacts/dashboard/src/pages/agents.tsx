import { useState } from "react";
import { useListAgents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Server, Monitor, Activity, Globe, Trash2, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Agents() {
  const { data: agents, isLoading } = useListAgents({ query: { refetchInterval: 5000 } });
  const [search, setSearch] = useState("");

  const filteredAgents = agents?.filter(agent => 
    agent.hostname.toLowerCase().includes(search.toLowerCase()) || 
    agent.ip.includes(search)
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">\u7ec8\u7aef\u7ba1\u7406</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="\u641c\u7d22\u4e3b\u673a\u540d\u6216 IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono bg-background/50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground font-mono">
            <Activity className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            \u6b63\u5728\u626b\u63cf\u7f51\u7edc...
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground font-mono border border-dashed border-border rounded-lg">
            \u672a\u627e\u5230\u5339\u914d\u7684\u7ec8\u7aef
          </div>
        ) : (
          filteredAgents.map((agent, i) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className={`bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors cursor-pointer stagger-${Math.min(i + 1, 5)}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-primary" />
                      <span className="font-mono text-base truncate" title={agent.hostname}>{agent.hostname}</span>
                    </div>
                    <div className="relative flex h-3 w-3 mt-1">
                      {agent.status === 'online' ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground font-mono">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      {agent.ip}
                    </div>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5" />
                      {agent.os} {agent.version ? `v${agent.version}` : ''}
                    </div>
                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span>{formatDistanceToNow(new Date(agent.lastSeen))}\u524d\u5728\u7ebf</span>
                      <Badge variant="outline" className={agent.status === 'online' ? 'border-green-500/30 text-green-500' : 'border-border text-muted-foreground'}>
                        {agent.status === 'online' ? '\u5728\u7ebf' : '\u79bb\u7ebf'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
