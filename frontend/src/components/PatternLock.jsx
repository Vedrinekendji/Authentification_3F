import { useState, useRef, useEffect } from 'react';

export default function PatternLock({ onComplete }) {
  const [nodes, setNodes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const containerRef = useRef(null);

  const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const getPointerPos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (id, e) => {
    e.preventDefault();
    setIsDrawing(true);
    setNodes([id]);
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    setCurrentLine(pos);

    const points = containerRef.current.querySelectorAll('[data-id]');
    points.forEach((point) => {
      const rect = point.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2 - containerRect.left;
      const cy = rect.top + rect.height / 2 - containerRect.top;

      const dist = Math.sqrt((pos.x - cx) ** 2 + (pos.y - cy) ** 2);
      const id = parseInt(point.getAttribute('data-id'));

      if (dist < 20 && !nodes.includes(id)) {
        setNodes((prev) => [...prev, id]);
      }
    });
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentLine(null);
    if (nodes.length > 2) {
      onComplete(nodes.join(''));
    } else {
      setNodes([]);
    }
  };

  const getNodePos = (id) => {
    const point = containerRef.current.querySelector(`[data-id="${id}"]`);
    if (!point) return { x: 0, y: 0 };
    const rect = point.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-72 h-72 mx-auto bg-slate-50 rounded-3xl touch-none select-none flex items-center justify-center border border-slate-100 shadow-inner"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map((node, i) => {
          if (i === 0) return null;
          const pos1 = getNodePos(nodes[i - 1]);
          const pos2 = getNodePos(node);
          return (
            <line
              key={i}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke="#1e3a8a"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-fade-in"
            />
          );
        })}
        {isDrawing && currentLine && nodes.length > 0 && (
          <line
            x1={getNodePos(nodes[nodes.length - 1]).x}
            y1={getNodePos(nodes[nodes.length - 1]).y}
            x2={currentLine.x}
            y2={currentLine.y}
            stroke="#1e3a8a"
            strokeWidth="3"
            opacity="0.4"
          />
        )}
      </svg>

      <div className="grid grid-cols-3 gap-12 relative z-10">
        {grid.map((id) => (
          <div
            key={id}
            data-id={id}
            onMouseDown={(e) => handleStart(id, e)}
            onTouchStart={(e) => handleStart(id, e)}
            className="group relative cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded-full transition-all duration-300 ${nodes.includes(id) ? 'bg-[#1e3a8a] scale-125' : 'bg-slate-300 group-hover:bg-slate-400'
                }`}
            />
            {nodes.includes(id) && (
              <div className="absolute inset-0 -m-2 bg-[#1e3a8a]/20 rounded-full animate-ping pointer-events-none" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
