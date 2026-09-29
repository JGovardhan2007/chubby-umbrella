import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripHorizontal, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

interface DraggableWidgetProps {
  id: string;
  title: string;
  defaultPosition: { x: number; y: number };
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  children: React.ReactNode;
  collapsible?: boolean;
  isCollapsedDefault?: boolean;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  id,
  title,
  defaultPosition,
  defaultWidth = 260,
  minWidth = 200,
  maxWidth = 480,
  children,
  collapsible = true,
  isCollapsedDefault = false,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [width, setWidth] = useState(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(isCollapsedDefault);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: defaultPosition.x,
    posY: defaultPosition.y,
  });

  const resizeStartRef = useRef<{ startX: number; startWidth: number }>({
    startX: 0,
    startWidth: defaultWidth,
  });

  // Handle Drag Start
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    // Only drag on left click and not on buttons
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select')) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    e.preventDefault();
  };

  // Handle Resize Start
  const handleMouseDownResize = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startWidth: width,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  // Global mousemove and mouseup listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.startX;
        const deltaY = e.clientY - dragStartRef.current.startY;

        const newX = Math.max(10, dragStartRef.current.posX + deltaX);
        const newY = Math.max(10, dragStartRef.current.posY + deltaY);

        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartRef.current.startX;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, resizeStartRef.current.startWidth + deltaX));
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, minWidth, maxWidth]);

  return (
    <div
      ref={cardRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: `${width}px`,
      }}
      className={`absolute top-0 left-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg select-none transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-amber-500/40 cursor-grabbing' : 'hover:shadow-xl'
      }`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDownDrag}
        className="flex items-center justify-between p-3 border-b border-slate-100 cursor-grab active:cursor-grabbing group bg-slate-50/50 rounded-t-xl"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <GripHorizontal className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate font-sans">
            {title}
          </span>
        </div>

        {collapsible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 text-xs overflow-hidden">
          {children}
        </div>
      )}

      {/* Resize Grip Handle at Bottom-Right */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors"
          title="Drag to resize width"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="7" cy="12" r="1.5" />
            <circle cx="12" cy="7" r="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
};
