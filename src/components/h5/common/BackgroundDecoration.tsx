export function BackgroundDecoration() {
  return (
    <div className='pointer-events-none fixed inset-0'>
      <div className='bg-primary/10 absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'></div>
      <div className='bg-accent/10 absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full blur-3xl'></div>
      <div className='bg-sage/10 absolute top-1/2 left-1/4 h-64 w-64 rounded-full blur-3xl'></div>
    </div>
  );
}
