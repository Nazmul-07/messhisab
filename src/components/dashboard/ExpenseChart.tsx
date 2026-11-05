'use client';

import { useSyncExternalStore } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface ExpenseChartProps {
  data: Array<{
    day: string;
    bazar: number;   // paisa
    expenses: number; // paisa
  }>;
  totalBazarPaisa: number;
  totalExpensesPaisa: number;
}

interface TooltipEntry {
  name?: string | number;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-border rounded-xl shadow-2xl p-3 text-sm min-w-[170px] backdrop-blur-md">
      <p className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mt-1.5">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground text-xs font-medium">
              {entry.name === 'Bazar' ? 'Grocery' : 'Utilities'}
            </span>
          </div>
          <span className="font-mono font-semibold text-foreground text-xs">
            {CURRENCY_SYMBOL}{Number(entry.value ?? 0).toLocaleString('en-BD')}
          </span>
        </div>
      ))}
      <div className="border-t border-border mt-2.5 pt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">Total</span>
        <span className="font-mono font-bold text-foreground text-xs">
          {CURRENCY_SYMBOL}
          {payload.reduce((s, e) => s + Number(e.value ?? 0), 0).toLocaleString('en-BD')}
        </span>
      </div>
    </div>
  );
}

export function ExpenseChart({ data, totalBazarPaisa, totalExpensesPaisa }: ExpenseChartProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Convert paisa to taka for display
  const chartData = data.map((d) => ({
    day: d.day,
    Bazar: Math.round(d.bazar / 100),
    Expenses: Math.round(d.expenses / 100),
  }));

  const grandTotal = totalBazarPaisa + totalExpensesPaisa;

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Monthly Expenses</span>
              <span className="size-1.5 rounded-full bg-cyan-500" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Weekly grocery bazar vs shared bills
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">Grand Total</p>
            <p className="text-sm font-bold font-mono text-foreground">
              {CURRENCY_SYMBOL}{(grandTotal / 100).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-cyan-500 inline-block" />
            <span className="text-[11px] font-medium text-cyan-500 dark:text-cyan-400 font-mono">
              Bazar {CURRENCY_SYMBOL}{(totalBazarPaisa / 100).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-violet-500 inline-block" />
            <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400 font-mono">
              Bills {CURRENCY_SYMBOL}{(totalExpensesPaisa / 100).toLocaleString('en-BD', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="h-[230px] w-full min-h-[230px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `৳${v}`}
                  width={54}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload as unknown as readonly TooltipEntry[]}
                      label={label != null ? String(label) : undefined}
                    />
                  )}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)', radius: 4 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', top: -38 }}
                  iconType="circle"
                  iconSize={7}
                  formatter={(val) => (
                    <span className="text-[11px] font-medium text-muted-foreground mr-2">
                      {val === 'Bazar' ? 'Grocery Bazar' : 'Shared Bills'}
                    </span>
                  )}
                />
                <Bar dataKey="Bazar" fill="#06B6D4" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Expenses" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-lg bg-muted/10 animate-pulse flex items-center justify-center text-xs text-muted-foreground">
              Loading chart...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
