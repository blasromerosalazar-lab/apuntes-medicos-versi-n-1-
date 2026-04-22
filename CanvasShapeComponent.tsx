import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';

interface CanvasShapeProps {
  id: string;
  type: 'square' | 'rectangle' | 'circle' | 'triangle' | 'cube' | 'pyramid' | 'hexagon' | 'star' | 'cylinder' | 'sphere';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  rotation: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
  isHandMode: boolean;
  onLongPress: () => void;
}

const CanvasShapeComponent: React.FC<CanvasShapeProps> = ({
  id,
  type,
  x,
  y,
  width,
  height,
  fillColor,
  borderColor,
  rotation,
  isSelected,
  isMultiSelected,
  isSelectionMode,
  isEditing,
  onSelect,
  onUpdate,
  onDelete,
  onToggleMultiSelect,
  onGroupDrag,
  onGroupDragEnd,
  canvasScale,
  isHandMode,
  onLongPress,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMoved = useRef(false);
  
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height);

  const lastSentValues = useRef({ x, y, width, height });

  const startLongPressTimer = () => {
    isMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!isMoved.current) {
        onLongPress();
      }
    }, 500); // 500ms for more responsive long press
  };

  const cancelLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => cancelLongPressTimer();
  }, []);

  useEffect(() => {
    if (Math.abs(x - lastSentValues.current.x) > 0.1) mvX.set(x);
    if (Math.abs(y - lastSentValues.current.y) > 0.1) mvY.set(y);
    if (Math.abs(width - lastSentValues.current.width) > 0.1) mvWidth.set(width);
    if (Math.abs(height - lastSentValues.current.height) > 0.1) mvHeight.set(height);
    lastSentValues.current = { x, y, width, height };
  }, [x, y, width, height, mvX, mvY, mvWidth, mvHeight]);

  const handleResize = (direction: string, info: any) => {
    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    
    let currentWidth = mvWidth.get();
    let currentHeight = mvHeight.get();
    let currentX = mvX.get();
    let currentY = mvY.get();

    if (direction.includes('e')) currentWidth += deltaX;
    if (direction.includes('w')) {
      const potentialWidth = currentWidth - deltaX;
      if (potentialWidth >= 20) {
        currentWidth = potentialWidth;
        currentX += deltaX;
      }
    }
    if (direction.includes('s')) currentHeight += deltaY;
    if (direction.includes('n')) {
      const potentialHeight = currentHeight - deltaY;
      if (potentialHeight >= 20) {
        currentHeight = potentialHeight;
        currentY += deltaY;
      }
    }

    mvWidth.set(Math.max(20, currentWidth));
    mvHeight.set(Math.max(20, currentHeight));
    mvX.set(currentX);
    mvY.set(currentY);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    const finalValues = {
      width: mvWidth.get(),
      height: mvHeight.get(),
      x: mvX.get(),
      y: mvY.get()
    };
    lastSentValues.current = finalValues;
    onUpdate(id, finalValues);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalX = mvX.get();
    const finalY = mvY.get();
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    onUpdate(id, { x: finalX, y: finalY });
  };

  // Group drag listeners
  useEffect(() => {
    const handleGroupDragEvent = (e: any) => {
      const { senderId, delta } = e.detail;
      if (isMultiSelected && senderId !== id) {
        mvX.set(mvX.get() + delta.x);
        mvY.set(mvY.get() + delta.y);
      }
    };
    window.addEventListener('group-drag', handleGroupDragEvent);
    return () => window.removeEventListener('group-drag', handleGroupDragEvent);
  }, [id, isMultiSelected, mvX, mvY]);

  useEffect(() => {
    const handleGroupDragEndEvent = () => {
      if (isMultiSelected) {
        handleDragEnd();
      }
    };
    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    return () => window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
  }, [isMultiSelected]);

  const renderShape = () => {
    const w = mvWidth.get();
    const h = mvHeight.get();
    
    switch (type) {
      case 'square':
      case 'rectangle':
        return <rect width="100%" height="100%" fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
      case 'circle':
      case 'sphere':
        return <ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
      case 'triangle':
        return <polygon points={`0,${h} ${w / 2},0 ${w},${h}`} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
      case 'hexagon':
        return <polygon points={`${w*0.25},0 ${w*0.75},0 ${w},${h*0.5} ${w*0.75},${h} ${w*0.25},${h} 0,${h*0.5}`} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
      case 'star':
        return <polygon points={`${w*0.5},0 ${w*0.63},${h*0.38} ${w},${h*0.38} ${w*0.69},${h*0.59} ${w*0.82},${h} ${w*0.5},${h*0.75} ${w*0.18},${h} ${w*0.31},${h*0.59} 0,${h*0.38} ${w*0.37},${h*0.38}`} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
      case 'cube':
        return (
          <g>
            <rect x={w*0.2} y={0} width={w*0.8} height={h*0.8} fill={fillColor} fillOpacity="0.1" stroke={borderColor} strokeWidth="1" />
            <rect x={0} y={h*0.2} width={w*0.8} height={h*0.8} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />
            <line x1="0" y1={h*0.2} x2={w*0.2} y2="0" stroke={borderColor} strokeWidth="1" />
            <line x1={w*0.8} y1={h*0.2} x2={w} y2="0" stroke={borderColor} strokeWidth="1" />
            <line x1={w*0.8} y1={h} x2={w} y2={h*0.8} stroke={borderColor} strokeWidth="1" />
            <line x1="0" y1={h} x2={w*0.2} y2={h*0.8} stroke={borderColor} strokeWidth="1" />
          </g>
        );
      case 'pyramid':
        return (
          <g>
            <polygon points={`${w*0.5},0 0,${h} ${w*0.8},${h}`} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />
            <polygon points={`${w*0.5},0 ${w*0.8},${h} ${w},${h*0.8}`} fill={fillColor} fillOpacity="0.1" stroke={borderColor} strokeWidth="1" />
            <line x1="0" y1={h} x2={w*0.2} y2={h*0.8} stroke={borderColor} strokeWidth="1" strokeDasharray="2,2" />
            <line x1={w*0.2} y1={h*0.8} x2={w} y2={h*0.8} stroke={borderColor} strokeWidth="1" strokeDasharray="2,2" />
            <line x1={w*0.2} y1={h*0.8} x2={w*0.5} y2="0" stroke={borderColor} strokeWidth="1" strokeDasharray="2,2" />
          </g>
        );
      case 'cylinder':
        return (
          <g>
            <ellipse cx="50%" cy={h*0.15} rx="50%" ry={h*0.15} fill={fillColor} fillOpacity="0.1" stroke={borderColor} strokeWidth="1" />
            <rect x="0" y={h*0.15} width="100%" height={h*0.7} fill={fillColor} fillOpacity="0.2" stroke="none" />
            <line x1="0" y1={h*0.15} x2="0" y2={h*0.85} stroke={borderColor} strokeWidth="2" />
            <line x1={w} y1={h*0.15} x2={w} y2={h*0.85} stroke={borderColor} strokeWidth="2" />
            <ellipse cx="50%" cy={h*0.85} rx="50%" ry={h*0.15} fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />
          </g>
        );
      default:
        return <rect width="100%" height="100%" fill={fillColor} fillOpacity="0.2" stroke={borderColor} strokeWidth="2" />;
    }
  };

  return (
    <MotionConfig transformPagePoint={(point) => ({ x: point.x / canvasScale, y: point.y / canvasScale })}>
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: mvX,
          y: mvY,
          width: mvWidth,
          height: mvHeight,
          zIndex: isEditing ? 10000 : (isSelected || isMultiSelected ? 1000 : 10),
          touchAction: 'none',
        }}
        drag={(isEditing || (isSelectionMode && isMultiSelected)) && !isResizing && !isHandMode}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          setIsDragging(true);
        }}
        onDrag={(e, info) => {
          if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
            isMoved.current = true;
            cancelLongPressTimer();
          }
          if (isMultiSelected) {
            onGroupDrag(id, info.delta);
          }
        }}
        onDragEnd={() => {
          handleDragEnd();
          if (isMultiSelected) {
            window.dispatchEvent(new CustomEvent('group-drag-end'));
            onGroupDragEnd();
          }
        }}
        onPointerDown={(e) => {
          if (isSelectionMode) {
            if (isMultiSelected) {
              dragControls.start(e);
            } else {
              onToggleMultiSelect(id);
            }
            return;
          }

          if (isEditing) {
            dragControls.start(e);
          } else {
            if (!isSelected) {
              onSelect();
            }
            startLongPressTimer();
          }
        }}
        onPointerUp={cancelLongPressTimer}
        onPointerLeave={cancelLongPressTimer}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {renderShape()}
        </svg>

        {isSelected && !isEditing && (
          <div className="absolute inset-0 border border-white/30 pointer-events-none" />
        )}

        {isMultiSelected && (
          <div className="absolute inset-0 border-2 border-[#FFD105]/50 border-dashed pointer-events-none" />
        )}

        {isEditing && (
          <>
            <div className="absolute inset-0 border-2 border-[#FFD105] pointer-events-none" />
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
              <div
                key={dir}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                }}
                className={`absolute w-3 h-3 bg-white border border-[#FFD105] rounded-full z-[1001]`}
                style={{
                  top: dir.includes('n') ? -6 : dir.includes('s') ? '100%' : '50%',
                  left: dir.includes('w') ? -6 : dir.includes('e') ? '100%' : '50%',
                  marginTop: dir === 'e' || dir === 'w' ? -6 : 0,
                  marginLeft: dir === 'n' || dir === 's' ? -6 : 0,
                  cursor: `${dir}-resize`,
                  touchAction: 'none',
                }}
              >
                <motion.div 
                  className="w-full h-full"
                  onPan={(e, info) => handleResize(dir, info)}
                  onPanEnd={handleResizeEnd}
                />
              </div>
            ))}
          </>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default CanvasShapeComponent;
