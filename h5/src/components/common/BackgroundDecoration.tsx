export function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-sage/10 rounded-full blur-3xl"></div>
    </div>
  );
}
