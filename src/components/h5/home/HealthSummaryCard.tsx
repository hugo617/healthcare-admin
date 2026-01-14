'use client';

interface HealthMetric {
  value: string | number;
  label: string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: number;
}

export function HealthSummaryCard() {
  // 模拟数据
  const steps = 6820;
  const stepsGoal = 10000;
  const stepsProgress = Math.round((steps / stepsGoal) * 100);

  const metrics: HealthMetric[] = [
    {
      value: steps.toLocaleString(),
      label: '今日步数',
      progress: stepsProgress,
      icon: (
        <svg
          className='h-5 w-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M13 10V3L4 14h7v7l9-11h-7z'
          />
        </svg>
      ),
      gradient: 'from-primary to-secondary',
      trend: { value: '+12%', isUp: true }
    },
    {
      value: '72',
      label: '心率',
      unit: 'bpm',
      icon: (
        <svg
          className='h-5 w-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
          />
        </svg>
      ),
      gradient: 'from-rose-400 to-pink-500',
      trend: { value: '-3%', isUp: false }
    },
    {
      value: '120/80',
      label: '血压',
      unit: 'mmHg',
      icon: (
        <svg
          className='h-5 w-5 text-white'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
      gradient: 'from-violet-400 to-purple-500',
      trend: { value: '正常', isUp: true }
    }
  ];

  return (
    <div className='mx-4 mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='font-heading text-base text-slate-800'>今日健康</h3>
        <span className='text-xs text-slate-400'>实时更新</span>
      </div>

      <div className='grid grid-cols-3 gap-3'>
        {metrics.map((metric, index) => (
          <div key={index} className='text-center'>
            {/* 图标 */}
            <div
              className={`mx-auto mb-2 h-12 w-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg`}
            >
              {metric.icon}
            </div>

            {/* 数值 */}
            <p className='font-heading text-lg font-semibold text-slate-800'>
              {metric.value}
            </p>

            {/* 进度条（仅步数） */}
            {metric.progress !== undefined && (
              <div className='mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
                <div
                  className={`h-full bg-gradient-to-r ${metric.gradient} rounded-full transition-all duration-500`}
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            )}

            {/* 趋势指示器 */}
            {metric.trend && (
              <div
                className={`mt-1 flex items-center justify-center gap-0.5 ${
                  metric.trend.isUp ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {metric.trend.isUp ? (
                  <svg
                    className='h-3 w-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M5 10l7-7m0 0l7 7m-7-7v18'
                    />
                  </svg>
                ) : (
                  <svg
                    className='h-3 w-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 14l-7 7m0 0l-7-7m7 7V3'
                    />
                  </svg>
                )}
                <span className='text-[10px]'>{metric.trend.value}</span>
              </div>
            )}

            {/* 标签 */}
            <p className='mt-1 text-xs text-slate-500'>{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
