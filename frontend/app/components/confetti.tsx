"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
};

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const colors = [
        "#f59e0b", // amber
        "#ef4444", // red
        "#10b981", // emerald
        "#3b82f6", // blue
        "#8b5cf6", // purple
        "#ec4899", // pink
      ];

      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          y: -10,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: Math.random() * 0.5,
        });
      }
      setPieces(newPieces);

      // Clear after animation
      const timer = setTimeout(() => setPieces([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute h-3 w-3"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            borderRadius: "50%",
          }}
          initial={{
            y: piece.y,
            opacity: 1,
            rotate: piece.rotation,
          }}
          animate={{
            y: window.innerHeight + 100,
            x: piece.x + (Math.random() - 0.5) * 200,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

