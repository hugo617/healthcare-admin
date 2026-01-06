'use client';

export function HealthSummaryCard() {
  // 模拟数据
  const steps = 6820;
  const stepsGoal = 10000;
  const heartRate = 72;
  const bloodPressureHigh = 120;
  const bloodPressureLow = 80;

  return (
    <div className="bg-white rounded-3xl shadow-neumorphic p-5 mx-4 mb-4">
      <h3 className="font-heading text-base text-slate-800 mb-4">今日健康</h3>
      <div className="grid grid-cols-3 gap-3">
        {/* 今日步数 */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neumorphic-soft">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <p className="text-lg font-heading text-slate-800">{steps.toLocaleString()}</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${(steps / stepsGoal) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-1">今日步数</p>
        </div>
        {/* 心率 */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center shadow-neumorphic-soft">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <p className="text-lg font-heading text-slate-800">{heartRate}</p>
          <p className="text-xs text-slate-500 mt-1">bpm</p>
        </div>
        {/* 血压 */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center shadow-neumorphic-soft">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <p className="text-lg font-heading text-slate-800">{bloodPressureHigh}/{bloodPressureLow}</p>
          <p className="text-xs text-slate-500 mt-1">mmHg</p>
        </div>
      </div>
    </div>
  );
}
