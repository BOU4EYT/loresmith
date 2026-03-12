"use client";
import { useState, useEffect } from "react";

export function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [hov, setHov] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const onOver = (e: MouseEvent) => {
      const el = e.target as Element;
      setHov(!!el.closest("button, a, input, select, .cstd, .ccmp, .sbi, .nl, .htag, .rcard"));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div className="cdot" style={{ left: pos.x, top: pos.y }} />
      <div className={`cring${hov ? " on" : ""}`} style={{ left: pos.x, top: pos.y }} />
    </>
  );
}
