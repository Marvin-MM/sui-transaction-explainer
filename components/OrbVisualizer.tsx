import React, { useRef, useEffect } from 'react';

interface OrbVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Smooth volume transition
    let smoothVol = 0;

    const render = () => {
      // Resize logic: use parent dimensions
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Smoothing
      const targetVol = isActive ? Math.max(0.1, volume) : 0.05;
      smoothVol += (targetVol - smoothVol) * 0.1;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create Gradient
      // Adjust radius based on smaller container
      const minDim = Math.min(canvas.width, canvas.height);
      const baseRadius = minDim * 0.25; // Slightly larger relative to container
      const pulse = Math.sin(time * 2) * (minDim * 0.05);
      const radius = baseRadius + (smoothVol * (minDim * 0.4)) + pulse;

      // Glow effect
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.1, centerX, centerY, radius * 1.5);

      if (isActive) {
        // Active colors (Cyan/Blue/Purple)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, `rgba(56, 189, 248, ${0.4 + smoothVol})`); // Light Blue
        gradient.addColorStop(0.6, `rgba(124, 58, 237, ${0.2 + smoothVol * 0.5})`); // Violet
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Idle colors (Dim Gray/Blue)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.4, 'rgba(56, 189, 248, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Additional concentric rings for activity
      if (isActive && smoothVol > 0.1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${smoothVol * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(56, 189, 248, ${smoothVol * 0.3})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      time += 0.01;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, volume]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default OrbVisualizer;
