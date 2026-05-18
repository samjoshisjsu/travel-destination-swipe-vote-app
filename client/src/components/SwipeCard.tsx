import React, { useState, useRef } from 'react';
import { Item } from '../api';

interface Props {
  item: Item;
  onVote: (choice: 'yes' | 'no') => void;
}

const THRESHOLD = 80;

export default function SwipeCard({ item, onVote }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<'yes' | 'no' | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const exitingRef = useRef(false);

  function triggerVote(choice: 'yes' | 'no') {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(choice);
    setTimeout(() => {
      exitingRef.current = false;
      onVote(choice);
    }, 320);
  }

  function onStart(x: number, y: number) {
    if (exitingRef.current) return;
    setDragging(true);
    startPos.current = { x, y };
  }

  function onMove(x: number, y: number) {
    if (!dragging || exitingRef.current) return;
    setOffset({ x: x - startPos.current.x, y: (y - startPos.current.y) * 0.25 });
  }

  function onEnd() {
    if (!dragging) return;
    setDragging(false);
    if      (offset.x >  THRESHOLD) triggerVote('yes');
    else if (offset.x < -THRESHOLD) triggerVote('no');
    else setOffset({ x: 0, y: 0 });
  }

  const rotation   = offset.x * 0.07;
  const yesOpacity = exiting === 'yes' ? 1 : Math.max(0, Math.min(offset.x / THRESHOLD, 1));
  const noOpacity  = exiting === 'no'  ? 1 : Math.max(0, Math.min(-offset.x / THRESHOLD, 1));

  let transform: string;
  let transition: string;
  if (exiting === 'yes') {
    transform  = 'translateX(160%) rotate(28deg)';
    transition = 'transform 0.32s ease-out';
  } else if (exiting === 'no') {
    transform  = 'translateX(-160%) rotate(-28deg)';
    transition = 'transform 0.32s ease-out';
  } else {
    transform  = `translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg)`;
    transition = dragging ? 'none' : 'transform 0.3s ease';
  }

  return (
    <div
      className="swipe-card"
      style={{ transform, transition }}
      onMouseDown={e => { e.preventDefault(); onStart(e.clientX, e.clientY); }}
      onMouseMove={e => onMove(e.clientX, e.clientY)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => onMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={onEnd}
    >
      {/* Yes hint */}
      <div className="card-hint yes-hint" style={{ opacity: yesOpacity }}>
        YES ✓
      </div>

      {/* No hint */}
      <div className="card-hint no-hint" style={{ opacity: noOpacity }}>
        NO ✗
      </div>

      <img
        src={item.imageUrl}
        alt={item.name}
        className="card-image"
        draggable={false}
        onError={e => {
          const img = e.currentTarget;
          img.onerror = null;
          img.src = `https://picsum.photos/seed/fallback${item.id}/400/500`;
        }}
      />

      <div className="card-info">
        <h2 className="card-name">{item.name}</h2>
        <p className="card-desc">{item.description}</p>
      </div>
    </div>
  );
}
