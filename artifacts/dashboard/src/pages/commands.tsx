import { useState } from "react";
import { useListAllCommands } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Terminal, Filter } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Commands() {
  const { data: commands, isLoading } = useListAllCommands({ query: { refetchInterval: 5000 } });
  const [search, setSearch] = useState("");

  const filteredCommands = commands?.filter(cmd => 
    cmd.command.toLowerCase().includes(search.toLowerCase()) || 
    cmd.agentName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">\u547d\u4ee4\u5386\u53f2</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="\u641c\u7d22\u547d\u4ee4\u6216\u7ec8\u7aef..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono bg-background/50"
          />
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground font-mono animate-pulse">
              \u6b63\u5728\u52a0\u8f7d\u547d\u4ee4\u5386\u53f2...
            </div>
          ) : filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-mono">
              \u672a\u627e\u5230\u547d\u4ee4
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredCommands.map((cmd) => (
                <div key={cmd.id} className="p-4 hover:bg-accent/5 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-2 flex flex-col text-sm">
                    <span className="font-mono text-muted-foreground">{format(new Date(cmd.createdAt), 'MMM dd, HH:mm:ss')}</span>
                    <Link href={`/agents/${cmd.agentId}`} className="text-xs font-medium hover:underline text-foreground mt-1 truncate">
                      {cmd.agentName}
                    </Link>
                  </div>
                  
                  <div className="md:col-span-7 flex flex-col gap-1">
                    <div className="font-mono text-sm flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{cmd.command}</span>
                    </div>
                    {cmd.status === 'completed' && cmd.exitCode !== undefined && (
                      <span className="text-xs font-mono text-muted-foreground">\u9000\u51fa\u7801: {cmd.exitCode}</span>
                    )}
                  </div>
                  
                  <div className="md:col-span-3 flex items-center md:justify-end gap-3">
                    <Badge variant="outline" className={
                      cmd.status === 'completed' ? 'border-green-500/30 text-green-500 font-mono text-[10px]' :
                      cmd.status === 'running' ? 'border-yellow-500/30 text-yellow-500 font-mono text-[10px] animate-pulse' :
                      cmd.status === 'failed' || cmd.status === 'timeout' ? 'border-destructive/30 text-destructive font-mono text-[10px]' :
                      'border-border text-muted-foreground font-mono text-[10px]'
                    }>
                      {cmd.status === 'completed' ? '\u5df2\u5b8c\u6210' : cmd.status === 'running' ? '\u6267\u884c\u4e2d' : cmd.status === 'failed' ? '\u5931\u8d25' : cmd.status === 'pending' ? '\u7b49\u5f85\u4e2d' : cmd.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
