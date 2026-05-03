import { useState, useRef, useEffect } from "react";
import { useGetAgent, useExecuteCommand, useListAgentCommands, useDeleteAgent } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, Activity, ArrowLeft, Trash2, Cpu, Globe, Hash, Clock, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

export default function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: agent, isLoading: isAgentLoading } = useGetAgent(agentId, { query: { enabled: !!agentId, refetchInterval: 5000 } });
  const { data: commands, refetch: refetchCommands } = useListAgentCommands(agentId, { query: { enabled: !!agentId, refetchInterval: 2000 } });
  const executeCommand = useExecuteCommand();
  const deleteAgent = useDeleteAgent();

  const [cmdInput, setCmdInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commands]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    
    try {
      await executeCommand.mutateAsync({ agentId, data: { command: cmdInput } });
      setCmdInput("");
      refetchCommands();
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error?.message || "Failed to dispatch command",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("\u786e\u5b9a\u8981\u6ce8\u9500\u6b64\u7ec8\u7aef\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002")) {
      try {
        await deleteAgent.mutateAsync({ agentId });
        toast({ title: "\u7ec8\u7aef\u5df2\u6ce8\u9500" });
        setLocation("/agents");
      } catch (error: any) {
        toast({ title: "\u5220\u9664\u5931\u8d25", description: error?.message, variant: "destructive" });
      }
    }
  };

  if (isAgentLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center font-mono text-muted-foreground">
        <Activity className="w-6 h-6 animate-spin text-primary mr-3" />
        \u6b63\u5728\u5efa\u7acb\u8fde\u63a5...
      </div>
    );
  }

  if (!agent) {
    return <div className="text-destructive font-mono py-12 text-center border border-destructive/20 rounded-lg bg-destructive/5">\u672a\u627e\u5230\u7ec8\u7aef</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/agents")} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight font-mono flex items-center gap-3">
            {agent.hostname}
            <Badge variant="outline" className={agent.status === 'online' ? 'border-green-500/30 text-green-500' : 'border-border text-muted-foreground'}>
              {agent.status.toUpperCase()}
            </Badge>
          </h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} className="font-mono">
          <Trash2 className="w-4 h-4 mr-2" /> \u6ce8\u9500\u7ec8\u7aef
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground">\u7cfb\u7edf\u4fe1\u606f</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 font-mono text-sm">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Hash className="w-3.5 h-3.5" /> \u7f16\u53f7</div>
              <div className="truncate text-xs">{agent.id}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Globe className="w-3.5 h-3.5" /> IP \u5730\u5740</div>
              <div>{agent.ip}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Cpu className="w-3.5 h-3.5" /> \u64cd\u4f5c\u7cfb\u7edf</div>
              <div>{agent.os} {agent.version ? `v${agent.version}` : ''}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" /> \u6700\u540e\u5728\u7ebf</div>
              <div>{formatDistanceToNow(new Date(agent.lastSeen))}\u524d</div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-4">
          <Card className="bg-black border-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.1)] h-[500px] flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-primary/20 bg-primary/5 flex flex-row items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-mono text-primary tracking-widest">\u8fdc\u7a0b\u7ec8\u7aef</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 flex flex-col font-mono text-sm overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-muted-foreground text-xs mb-4">
                  \u6b22\u8fce\u4f7f\u7528\u8fd0\u7ef4\u4e2d\u5fc3\u5b89\u5168\u8fdc\u7a0b\u7ec8\u7aef\u3002<br/>
                  \u5df2\u8fde\u63a5\u5230 {agent.hostname} ({agent.ip})\u3002\u4f1a\u8bdd\u5df2\u8bb0\u5f55\u3002<br/>
                  ---
                </div>

                {commands?.map((cmd) => (
                  <div key={cmd.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-muted-foreground">operator@{agent.hostname}:~$</span>
                      <span>{cmd.command}</span>
                      {cmd.status === 'running' && <span className="animate-pulse w-2 h-4 bg-primary inline-block ml-1" />}
                    </div>
                    {cmd.status === 'pending' && <div className="text-muted-foreground/50 text-xs italic">[\u7b49\u5f85\u5206\u53d1...]</div>}
                    {cmd.status !== 'pending' && cmd.status !== 'running' && (
                      <div className={`whitespace-pre-wrap p-3 rounded-md border ${cmd.exitCode === 0 ? 'border-primary/20 bg-primary/5 text-gray-300' : 'border-destructive/30 bg-destructive/10 text-red-400'}`}>
                        {cmd.output || <span className="italic opacity-50">\u65e0\u8f93\u51fa</span>}
                        <div className="mt-2 text-xs opacity-50 flex items-center justify-between border-t border-border/50 pt-2">
                          <span>\u9000\u51fa\u7801: {cmd.exitCode ?? '\u65e0'}</span>
                          <span>{cmd.completedAt ? formatDistanceToNow(new Date(cmd.completedAt), { addSuffix: true }) : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              <div className="p-4 border-t border-primary/20 bg-primary/5">
                <form onSubmit={handleExecute} className="flex items-center gap-2 relative">
                  <span className="absolute left-3 text-primary font-mono text-sm">$&gt;</span>
                  <Input
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    placeholder="\u8f93\u5165\u547d\u4ee4..."
                    className="pl-8 font-mono bg-black border-primary/30 focus-visible:ring-primary/50 text-primary placeholder:text-primary/30 rounded-none h-10"
                    disabled={agent.status === 'offline' || executeCommand.isPending}
                    autoComplete="off"
                  />
                  <Button 
                    type="submit" 
                    disabled={agent.status === 'offline' || !cmdInput.trim() || executeCommand.isPending}
                    className="rounded-none font-mono tracking-widest h-10"
                  >
                    \u6267\u884c
                  </Button>
                </form>
                {agent.status === 'offline' && (
                  <p className="text-xs text-destructive mt-2 text-center animate-pulse">\u7ec8\u7aef\u5df2\u7981\u7528\uff1a\u7ec8\u7aef\u5df2\u79bb\u7ebf</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
