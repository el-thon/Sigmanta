"use client";

import { useEffect, useRef } from "react";

type EarthGlobe3DProps = {
  className?: string;
};

export function EarthGlobe3D({ className = "" }: EarthGlobe3DProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    offset: 0,
    tiltX: 0,
    tiltY: 0,
    frame: 0,
  });

  useEffect(() => {
    const interaction = interactionRef.current;
    const animate = () => {
      if (!interaction.dragging) {
        interaction.offset -= 0.18;
        interaction.tiltX *= 0.94;
        interaction.tiltY *= 0.94;
      }

      const globe = globeRef.current;
      if (globe) {
        globe.style.setProperty("--earth-offset", `${interaction.offset}px`);
        globe.style.setProperty("--earth-tilt-x", `${interaction.tiltX}deg`);
        globe.style.setProperty("--earth-tilt-y", `${interaction.tiltY}deg`);
      }

      interaction.frame = window.requestAnimationFrame(animate);
    };

    interaction.frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(interaction.frame);
  }, []);

  function moveGlobe(clientX: number, clientY: number, rect: DOMRect) {
    const interaction = interactionRef.current;
    const xRatio = (clientX - rect.left) / rect.width - 0.5;
    const yRatio = (clientY - rect.top) / rect.height - 0.5;
    interaction.tiltX = Math.max(-9, Math.min(9, -yRatio * 18));
    interaction.tiltY = Math.max(-13, Math.min(13, xRatio * 26));
  }

  return (
    <div
      ref={globeRef}
      className={`earth-globe-3d ${className}`}
      aria-hidden="true"
      onPointerDown={(event) => {
        const interaction = interactionRef.current;
        interaction.dragging = true;
        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const interaction = interactionRef.current;
        const rect = event.currentTarget.getBoundingClientRect();
        moveGlobe(event.clientX, event.clientY, rect);

        if (!interaction.dragging) return;
        interaction.offset += (event.clientX - interaction.lastX) * 1.45;
        interaction.tiltX += (event.clientY - interaction.lastY) * -0.04;
        interaction.lastX = event.clientX;
        interaction.lastY = event.clientY;
      }}
      onPointerUp={(event) => {
        interactionRef.current.dragging = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        interactionRef.current.dragging = false;
      }}
      onPointerLeave={() => {
        interactionRef.current.dragging = false;
      }}
    >
      <div className="earth-globe-3d__map" />
      <div className="earth-globe-3d__shade" />
    </div>
  );
}
