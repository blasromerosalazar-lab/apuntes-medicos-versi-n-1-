import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';

interface CanvasImageProps {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  canEdit: boolean;
  isHandMode: boolean;
  onSelect: () => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
}

const CanvasImageComponent: React.FC<CanvasImageProps> = ({
  id,
  src,
  x,
  y,
  width,
  height,
  rotation = 0,
  zIndex = 10,
  isSelected,
  isMultiSelected,
  isSelectionMode,
  canEdit,
  isHandMode,
  onSelect,
  onToggleMultiSelect,
  onUpdate,
  onGroupDrag,
  onGroupDragEnd,
  canvasScale,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for ultra-smooth updates
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height);
  const mvRotate = useMotionValue(rotation);

  const lastSentValues = useRef({ x, y, width, height });

  useEffect(() => {
    const xDiff = Math.abs(x - lastSentValues.current.x);
    const yDiff = Math.abs(y - lastSentValues.current.y);
    const widthDiff = Math.abs(width - lastSentValues.current.width);
    const heightDiff = Math.abs(height - lastSentValues.current.height);

    if (xDiff > 0.1) mvX.set(x);
    if (yDiff > 0.1) mvY.set(y);
    if (widthDiff > 0.1) mvWidth.set(width);
    if (heightDiff > 0.1) mvHeight.set(height);
    mvRotate.set(rotation);
    
    lastSentValues.current = { x, y, width, height };
  }, [x, y, width, height]);

  const handleResize = (direction: string, info: any) => {
    const deltaX = info.delta.x;
    const deltaY = info.delta.y;
    
    let currentWidth = mvWidth.get();
    let currentHeight = mvHeight.get();
    let currentX = mvX.get();
    let currentY = mvY.get();

    if (direction.includes('e')) {
      currentWidth += deltaX;
    }
    if (direction.includes('w')) {
      const potentialWidth = currentWidth - deltaX;
      if (potentialWidth >= 50) {
        currentWidth = potentialWidth;
        currentX += deltaX;
      }
    }
    if (direction.includes('s')) {
      currentHeight += deltaY;
    }
    if (direction.includes('n')) {
      const potentialHeight = currentHeight - deltaY;
      if (potentialHeight >= 50) {
        currentHeight = potentialHeight;
        currentY += deltaY;
      }
    }

    mvWidth.set(Math.max(50, currentWidth));
    mvHeight.set(Math.max(50, currentHeight));
    mvX.set(currentX);
    mvY.set(currentY);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    const finalValues = {
      width: mvWidth.get(),
      height: mvHeight.get(),
      x: mvX.get(),
      y: mvY.get(),
      rotation: mvRotate.get()
    };
    lastSentValues.current = { x: finalValues.x, y: finalValues.y, width: finalValues.width, height: finalValues.height };
    onUpdate(id, finalValues);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isResizing) return;
    if (isSelectionMode) {
      if (isMultiSelected) {
        dragControls.start(e);
      } else {
        onToggleMultiSelect(id);
      }
      return;
    }
    if (!isSelected && !isMultiSelected) {
      onSelect();
    }
    if (canEdit) {
      dragControls.start(e);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalX = mvX.get();
    const finalY = mvY.get();
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    onUpdate(id, { x: finalX, y: finalY });
  };

  return (
    <MotionConfig transformPagePoint={(point) => ({ x: point.x / canvasScale, y: point.y / canvasScale })}>
      <motion.div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: mvX,
          y: mvY,
          width: mvWidth,
          height: mvHeight,
          rotate: mvRotate,
          zIndex: isSelected ? 1000 : zIndex,
          touchAction: 'none',
          pointerEvents: isHandMode ? 'none' : 'auto',
        }}
        drag={canEdit && !isResizing && !isHandMode}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDrag={(event, info) => {
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
        onPointerDown={handlePointerDown}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-full h-full border-2 transition-colors overflow-hidden rounded-md flex flex-col ${
            isSelected ? 'border-[#FFD105] shadow-lg' : 'border-transparent'
          } ${isMultiSelected ? 'cuadro-seleccionado ring-4 ring-[#FFD105]' : ''}`}
        >
          <img 
            src={src} 
            className="w-full h-full object-contain pointer-events-none" 
            referrerPolicy="no-referrer"
            alt="Canvas Content"
          />
        </div>

        {isSelected && canEdit && !isDragging && (
          <>
            {/* Resize Handles */}
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
              <div
                key={dir}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                  if (e.currentTarget.setPointerCapture) {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
                }}
                onPointerUp={(e) => {
                  if (e.currentTarget.releasePointerCapture) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                }}
                className={`absolute w-6 h-6 -m-3 bg-white border-2 border-[#FFD105] rounded-full z-[1001] shadow-md flex items-center justify-center`}
                style={{
                  top: dir.includes('n') ? 0 : dir.includes('s') ? '100%' : '50%',
                  left: dir.includes('w') ? 0 : dir.includes('e') ? '100%' : '50%',
                  cursor: `${dir}-resize`,
                  touchAction: 'none',
                }}
              >
                <div className="w-2 h-2 bg-[#FFD105] rounded-full pointer-events-none" />
                <motion.div 
                  className="absolute inset-[-10px]"
                  onPan={(e, info) => handleResize(dir, info)}
                  onPanEnd={handleResizeEnd}
                />
              </div>
            ))}

            {/* Rotation Handle */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
                if (e.currentTarget.setPointerCapture) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerUp={(e) => {
                if (e.currentTarget.releasePointerCapture) {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
                handleResizeEnd();
              }}
              className="absolute w-8 h-8 -top-12 left-1/2 -ml-4 bg-white border-2 border-[#8e44ad] rounded-full z-[1001] shadow-lg flex items-center justify-center cursor-alias"
            >
              <div className="w-1 h-3 bg-[#8e44ad] rounded-full absolute -bottom-3 left-1/2 -ml-[0.5px]" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e44ad" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <polyline points="21 3 21 8 16 8" />
              </svg>
              <motion.div 
                className="absolute inset-[-10px]"
                onPan={(e, info) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const angle = Math.atan2(info.point.y - centerY, info.point.x - centerX) * (180 / Math.PI) + 90;
                    mvRotate.set(angle);
                  }
                }}
              />
            </div>
          </>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default CanvasImageComponent;
