// Decorative background overlay
const WaterBackground = () => (
  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    background: [
      'radial-gradient(ellipse 60% 50% at 25% 25%, rgba(245,197,66,0.06), transparent)',
      'radial-gradient(ellipse 50% 40% at 75% 75%, rgba(224,64,160,0.05), transparent)',
      'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(155,89,182,0.04), transparent)',
    ].join(','),
  }} />
);

export default WaterBackground;
