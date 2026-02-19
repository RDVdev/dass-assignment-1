import { useEffect, useRef } from 'react';

/**
 * Interactive water / viscous fluid simulation background.
 * Uses a WebGL-like approach with 2D canvas for a metaball-based fluid effect
 * that reacts to mouse movement.
 */
const WaterBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let mouseX = width / 2;
    let mouseY = height / 2;
    let animationId;

    // Fluid blobs
    const blobs = [];
    const BLOB_COUNT = 14;

    for (let i = 0; i < BLOB_COUNT; i++) {
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 120 + Math.random() * 200,
        color: i % 3 === 0
          ? { r: 245, g: 197, b: 66 }   // gold
          : i % 3 === 1
          ? { r: 224, g: 64, b: 160 }    // magenta
          : { r: 155, g: 89, b: 182 },   // violet
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.005,
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouse = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleTouch = (e) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch, { passive: true });

    const animate = (time) => {
      ctx.clearRect(0, 0, width, height);

      // Update blob positions
      for (const blob of blobs) {
        blob.phase += blob.speed;

        // Gentle orbital motion
        blob.x += blob.vx + Math.sin(blob.phase) * 0.3;
        blob.y += blob.vy + Math.cos(blob.phase * 0.7) * 0.3;

        // Mouse attraction — viscous pull
        const dx = mouseX - blob.x;
        const dy = mouseY - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 400) {
          const force = (400 - dist) / 400 * 0.015;
          blob.x += dx * force;
          blob.y += dy * force;
        }

        // Bounce off edges
        if (blob.x < -blob.radius) blob.x = width + blob.radius;
        if (blob.x > width + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = height + blob.radius;
        if (blob.y > height + blob.radius) blob.y = -blob.radius;
      }

      // Draw each blob as a radial gradient
      for (const blob of blobs) {
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        const { r, g, b } = blob.color;
        const pulse = 0.5 + 0.3 * Math.sin(blob.phase * 2);
        gradient.addColorStop(0, `rgba(${r},${g},${b},${0.18 * pulse})`);
        gradient.addColorStop(0.4, `rgba(${r},${g},${b},${0.09 * pulse})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw connecting lines between nearby blobs (viscous strings)
      ctx.lineWidth = 1;
      for (let i = 0; i < blobs.length; i++) {
        for (let j = i + 1; j < blobs.length; j++) {
          const a = blobs[i];
          const b = blobs[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = a.radius + b.radius;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            ctx.strokeStyle = `rgba(245,197,66,${alpha})`;
            ctx.beginPath();
            // Curved viscous line through midpoint pulled toward mouse
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const mDx = mouseX - midX;
            const mDy = mouseY - midY;
            const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
            const pull = Math.max(0, 1 - mDist / 500) * 30;
            const cpX = midX + (mDx / (mDist || 1)) * pull;
            const cpY = midY + (mDy / (mDist || 1)) * pull;
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo(cpX, cpY, b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Mouse ripple
      const rippleRadius = 60 + 20 * Math.sin(time * 0.003);
      const rippleGrad = ctx.createRadialGradient(
        mouseX, mouseY, 0,
        mouseX, mouseY, rippleRadius
      );
      rippleGrad.addColorStop(0, 'rgba(245,197,66,0.14)');
      rippleGrad.addColorStop(0.5, 'rgba(224,64,160,0.07)');
      rippleGrad.addColorStop(1, 'rgba(155,89,182,0)');
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, rippleRadius, 0, Math.PI * 2);
      ctx.fillStyle = rippleGrad;
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default WaterBackground;
