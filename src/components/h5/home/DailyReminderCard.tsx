'use client';

export function DailyReminderCard() {
  // 模拟数据
  const reminder = {
    title: '每日提醒',
    time: '上午 9:00',
    content: '记得按时测量血压，保持健康生活习惯。每天坚持锻炼，让身体更健康！'
  };

  const handleReminderClick = () => {
    // 模拟GET请求回应效果
    fetch('/api/reminders')
      .then((response) => response.json())
      .then((data) => {
        console.log('提醒数据:', data);
      })
      .catch((error) => {
        console.error('获取提醒数据失败:', error);
      });
  };

  const handleLaterClick = () => {
    // 稍后提醒逻辑
    console.log('稍后提醒');
  };

  return (
    <div className='from-primary-50 to-sage-light/20 shadow-neumorphic-soft border-primary-100/30 mx-4 mb-4 rounded-3xl border bg-gradient-to-br p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <div className='bg-accent/20 absolute inset-0 animate-ping rounded-full'></div>
            <div className='from-accent shadow-elevation-sm relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br to-orange-400'>
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
                  d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                />
              </svg>
            </div>
          </div>
          <div>
            <h3 className='font-heading text-base text-slate-800'>
              {reminder.title}
            </h3>
            <p className='text-xs text-slate-400'>{reminder.time}</p>
          </div>
        </div>
        <button
          onClick={handleLaterClick}
          className='text-primary hover:text-accent cursor-pointer text-xs font-medium transition-colors active:scale-95'
        >
          稍后提醒
        </button>
      </div>
      <p
        className='active:text-primary-600 cursor-pointer text-sm leading-relaxed text-slate-600 transition-colors hover:text-slate-800'
        onClick={handleReminderClick}
      >
        {reminder.content}
      </p>
    </div>
  );
}
