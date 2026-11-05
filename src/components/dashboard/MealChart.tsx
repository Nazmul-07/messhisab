'use client';

import { useSyncExternalStore } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CURRENCY_SYMBOL } from '@/lib/constants';

interface MealChartProps {
  data: Array<{
    day: string;
    meals: number;
  }>;
  totalMeals: number;
  mealRatePaisa: number;
}

interface TooltipEntry {
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const meals = Number(payload[0]?.value ?? 0);
  return (
    <div className="bg-card/95 border border-border rounded-xl shadow-2xl p-3 text-sm min-w-[150px] backdrop-blur-md">
      <p className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wider">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-cyan-500 inline-block shrink-0" />
          <span className="text-muted-foreground text-xs font-medium">Meals Consumed</span>
        </div>
        <span className="font-mono font-semibold text-foreground text-xs">{meals.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function MealChart({ data, totalMeals, mealRatePaisa }: MealChartProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const totalPoints = data.length || 1;
  const avgMealsPerDay = (totalMeals / totalPoints).toFixed(1);

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Meal Consumption Trend</span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Daily meal units consumed across all members
            </CardDescription>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted-foreground">Current Rate</p>
            <p className="text-sm font-bold font-mono text-cyan-500 dark:text-cyan-400">
              {CURRENCY_SYMBOL}{(mealRatePaisa / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-cyan-500 inline-block" />
            <span className="text-[11px] font-medium text-cyan-500 dark:text-cyan-400 font-mono">
              Total {totalMeals.toFixed(1)} meals
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400 font-mono">
              ~{avgMealsPerDay} meals / day
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="h-[230px] w-full min-h-[230px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="mealCyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
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
                  width={38}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload as unknown as readonly TooltipEntry[]}
                      label={label != null ? String(label) : undefined}
                    />
                  )}
                  cursor={{ stroke: '#06B6D4', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="meals"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fill="url(#mealCyanGradient)"
                  activeDot={{
                    r: 5,
                    stroke: '#06B6D4',
                    strokeWidth: 2,
                    fill: '#0B1120',
                  }}
                  dot={{
                    r: 2.5,
                    fill: '#06B6D4',
                    strokeWidth: 0,
                  }}
                />
              </AreaChart>
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
