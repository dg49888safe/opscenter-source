import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, History } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  Table,
  Body,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AuditLogs() {
  const { data: logs, isLoading } = useListAuditLogs();
  const [search, setSearch] = useState("");

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.operator.toLowerCase().includes(search.toLowerCase()) ||
    log.target.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">\u5ba1\u8ba1\u65e5\u5fd7</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="\u641c\u7d22\u4e8b\u4ef6..."
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
              \u6b63\u5728\u68c0\u7d22\u5ba1\u8ba1\u8bb0\u5f55...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-mono border border-dashed border-border m-4 rounded-lg">
              \u672a\u627e\u5230\u65e5\u5fd7
            </div>
          ) : (
            <div className="rounded-md">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border/50">
                    <TableHead className="font-mono text-xs w-[180px]">\u65f6\u95f4\u6233</TableHead>
                    <TableHead className="font-mono text-xs">\u64cd\u4f5c\u4eba</TableHead>
                    <TableHead className="font-mono text-xs">\u64cd\u4f5c\u7c7b\u578b</TableHead>
                    <TableHead className="font-mono text-xs">\u76ee\u6807</TableHead>
                    <TableHead className="font-mono text-xs text-right">\u8be6\u60c5</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, i) => (
                    <TableRow key={log.id} className={`border-border/50 hover:bg-accent/5 stagger-${Math.min(i + 1, 5)}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.operator}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary bg-primary/5">
                          {log.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm truncate max-w-[200px]" title={log.target}>
                        {log.target}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground truncate max-w-[200px]" title={log.detail}>
                        {log.detail || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
