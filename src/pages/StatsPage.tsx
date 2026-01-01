import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp, Calendar, Flame, Target } from 'lucide-react';
import { Header } from '../components/ui/Header';
import { Card, CardHeader } from '../components/ui/Card';
import { useLogEntriesInRange, useHabits } from '../hooks/useHabits';
import { formatDateKey } from '../db';
import { formatPercentage } from '../utils';

type TimeRange = '7d' | '30d' | '90d';

export function StatsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  const habits = useHabits();
  
  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const start = subDays(end, days - 1);
    return {
      startDate: formatDateKey(start),
      endDate: formatDateKey(end),
    };
  }, [timeRange]);
  
  const logEntries = useLogEntriesInRange(startDate, endDate);
  
  // Calculate daily completion data
  const dailyData = useMemo(() => {
    if (!logEntries || !habits) return [];
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dates = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });
    
    return dates.map(date => {
      const dateKey = formatDateKey(date);
      const dayLogs = logEntries.filter(l => l.date === dateKey);
      const completed = dayLogs.filter(l => {
        if (l.skippedReason) return false;
        if (typeof l.value === 'boolean') return l.value;
        return true;
      }).length;
      
      return {
        date: dateKey,
        label: format(date, timeRange === '7d' ? 'EEE' : 'd'),
        completed,
        total: habits.length,
        rate: habits.length > 0 ? (completed / habits.length) * 100 : 0,
      };
    });
  }, [logEntries, habits, timeRange]);
  
  // Calculate summary stats
  const stats = useMemo(() => {
    if (!dailyData.length || !habits) return null;
    
    const totalCompleted = dailyData.reduce((sum, d) => sum + d.completed, 0);
    const totalPossible = dailyData.reduce((sum, d) => sum + d.total, 0);
    const avgRate = totalPossible > 0 ? totalCompleted / totalPossible : 0;
    
    // Calculate current streak
    let streak = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].rate >= 100) {
        streak++;
      } else if (dailyData[i].rate > 0 && i === dailyData.length - 1) {
        // Partial completion today doesn't break streak
        continue;
      } else {
        break;
      }
    }
    
    // Best day
    const bestDay = dailyData.reduce((best, d) => 
      d.rate > (best?.rate || 0) ? d : best, dailyData[0]
    );
    
    return {
      avgRate,
      streak,
      totalCompleted,
      bestDay,
    };
  }, [dailyData, habits]);
  
  const isLoading = !habits || !logEntries;

  return (
    <div className="min-h-screen pb-24">
      <Header 
        title="Statistics" 
        subtitle="Track your progress"
      />

      <main className="px-4 py-4 space-y-4">
        {/* Time range selector */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-card">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-saffron-600 text-white'
                  : 'text-ink-light hover:bg-saffron-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="text-center">
                  <div className="w-10 h-10 rounded-full bg-saffron-100 mx-auto mb-2 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-saffron-600" />
                  </div>
                  <p className="text-2xl font-bold text-ink font-display">
                    {formatPercentage(stats.avgRate)}
                  </p>
                  <p className="text-sm text-ink-light">Avg Completion</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="text-center">
                  <div className="w-10 h-10 rounded-full bg-forest-100 mx-auto mb-2 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-forest-600" />
                  </div>
                  <p className="text-2xl font-bold text-ink font-display">
                    {stats.streak}
                  </p>
                  <p className="text-sm text-ink-light">Day Streak</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gold-100 mx-auto mb-2 flex items-center justify-center">
                    <Target className="w-5 h-5 text-gold-600" />
                  </div>
                  <p className="text-2xl font-bold text-ink font-display">
                    {stats.totalCompleted}
                  </p>
                  <p className="text-sm text-ink-light">Total Completed</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="text-center">
                  <div className="w-10 h-10 rounded-full bg-saffron-100 mx-auto mb-2 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-saffron-600" />
                  </div>
                  <p className="text-2xl font-bold text-ink font-display">
                    {stats.bestDay ? formatPercentage(stats.bestDay.rate / 100) : '—'}
                  </p>
                  <p className="text-sm text-ink-light">Best Day</p>
                </Card>
              </motion.div>
            </div>

            {/* Completion chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader title="Daily Completion Rate" />
                <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} barCategoryGap="20%">
                      <XAxis 
                        dataKey="label" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#5C534D' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#5C534D' }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white rounded-lg shadow-lg p-2 text-sm">
                                <p className="font-medium">{data.date}</p>
                                <p className="text-ink-light">
                                  {data.completed}/{data.total} completed
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="rate" 
                        radius={[4, 4, 0, 0]}
                      >
                        {dailyData.map((entry, index) => (
                          <Cell 
                            key={index}
                            fill={entry.rate >= 100 ? '#3A9173' : 
                                  entry.rate >= 50 ? '#E8762F' : 
                                  '#FADCC5'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Trend line */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader title="Completion Trend" />
                <div className="h-40 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <XAxis 
                        dataKey="label" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#5C534D' }}
                      />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-white rounded-lg shadow-lg p-2 text-sm">
                                <p>{formatPercentage(payload[0].value as number / 100)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#C45D35"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#C45D35' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          <Card className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-saffron-300 mx-auto mb-4" />
            <h3 className="font-semibold text-ink mb-1">No data yet</h3>
            <p className="text-ink-light text-sm">
              Start logging habits to see your statistics
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

