'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface ScorePieChartProps {
  score: number
  label: string
  size?: number
}

export function ScorePieChart({ score, label, size = 120 }: ScorePieChartProps) {
  const remaining = Math.max(0, 100 - score)
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: remaining },
  ]

  // Color based on score
  const scoreColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const remainingColor = '#e2e5ed'

  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.3}
              outerRadius={size * 0.44}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={scoreColor} />
              <Cell fill={remainingColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

interface CourseScoreCardProps {
  courseTitle: string
  overallScore: number
  quizScore: number
  labScore: number
  completedDays: number
  totalDays: number
}

export function CourseScoreCard({ courseTitle, overallScore, quizScore, labScore, completedDays, totalDays }: CourseScoreCardProps) {
  const completionPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
  const data = [
    { name: 'Quiz (40%)', value: quizScore * 0.4, color: '#0d9488' },
    { name: 'Lab (60%)', value: labScore * 0.6, color: '#f59e0b' },
    { name: 'Remaining', value: Math.max(0, 100 - (quizScore * 0.4 + labScore * 0.6)), color: '#e2e5ed' },
  ]

  return (
    <div className="bg-card/80 border border-border rounded-xl p-4">
      <h3 className="text-sm font-bold text-foreground mb-3 truncate">{courseTitle}</h3>
      <div className="flex items-center gap-4">
        {/* Main pie */}
        <div className="relative" style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={44}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-bold text-foreground">{overallScore}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#00d4ff' }} />
            <span className="text-xs text-muted-foreground">Quiz avg:</span>
            <span className="text-xs font-bold text-foreground ml-auto">{quizScore}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
            <span className="text-xs text-muted-foreground">Lab avg:</span>
            <span className="text-xs font-bold text-foreground ml-auto">{labScore}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
            <span className="text-xs text-muted-foreground">Progress:</span>
            <span className="text-xs font-bold text-foreground ml-auto">{completedDays}/{totalDays} days ({completionPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
