import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';
import Lottie from "lottie-react";

interface LottieProps {
  id: string;
  x: number;
  y: number;
  scale: number;
  data: any;
  isPlaying: boolean;
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
  isHandMode: boolean;
}

const LottieComponent: React.FC<LottieProps> = ({
  id,
  x,
  y,
  scale,
  data,
  isPlaying,
  isSelected,
  isMultiSelected,
  isSelectionMode,
  isHandMode,
  onSelect,
  onToggleMultiSelect,
  onUpdate,
  onGroupDrag,
  onGroupDragEnd,
  canvasScale,
}) => {
  const lottieRef = useRef<any>(null);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvScale = useMotionValue(scale);

  const lastSentValues = useRef({ x, y, scale });

  useEffect(() => {
    if (Math.abs(x - lastSentValues.current.x) > 0.1) mvX.set(x);
    if (Math.abs(y - lastSentValues.current.y) > 0.1) mvY.set(y);
    if (Math.abs(scale - lastSentValues.current.scale) > 0.01) mvScale.set(scale);
    
    lastSentValues.current = { x, y, scale };
  }, [x, y, scale, mvX, mvY, mvScale]);

  useEffect(() => {
    if (isPlaying) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.pause();
    }
  }, [isPlaying]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalX = mvX.get();
    const finalY = mvY.get();
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    onUpdate(id, { x: finalX, y: finalY });
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
    
    dragControls.start(e);

    // Long press to restart
    longPressTimerRef.current = setTimeout(() => {
      lottieRef.current?.goToAndPlay(0, true);
      if (!isPlaying) {
        onUpdate(id, { isPlaying: true });
      }
    }, 800);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelectionMode || isDragging) return;
    onUpdate(id, { isPlaying: !isPlaying });
  };

  const handleResize = (e: any, info: any) => {
    const deltaX = info.delta.x;
    const currentScale = mvScale.get();
    // Simple scaling based on horizontal movement
    const newScale = Math.max(0.1, currentScale + deltaX / 100);
    mvScale.set(newScale);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    const finalScale = mvScale.get();
    lastSentValues.current = { ...lastSentValues.current, scale: finalScale };
    onUpdate(id, { scale: finalScale });
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

    const handleGroupDragEndEvent = () => {
      if (isMultiSelected) {
        handleDragEnd();
      }
    };

    window.addEventListener('group-drag', handleGroupDragEvent);
    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    return () => {
      window.removeEventListener('group-drag', handleGroupDragEvent);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
    };
  }, [id, isMultiSelected, mvX, mvY]);

  return (
    <MotionConfig transformPagePoint={(point) => ({ x: point.x / canvasScale, y: point.y / canvasScale })}>
      <motion.div
        className={`contenedor-lottie ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'cuadro-seleccionado' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: mvX,
          y: mvY,
          scale: mvScale,
          zIndex: isSelected ? 1000 : 50,
          touchAction: 'none',
          pointerEvents: isHandMode ? 'none' : 'auto',
          cursor: isSelectionMode ? 'move' : (isHandMode ? 'grab' : 'pointer'),
          border: !isPlaying ? '2px dashed rgba(255, 209, 5, 0.4)' : '2px solid transparent',
          borderRadius: '8px',
          padding: '4px',
          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        }}
        drag={(isSelectionMode || isSelected) && !isHandMode}
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
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleTogglePlay}
      >
        <div style={{ width: 150, height: 150, pointerEvents: 'none' }}>
          <Lottie 
            lottieRef={lottieRef}
            animationData={data} 
            loop={true} 
            autoplay={false}
          />
        </div>

        {isSelected && !isMultiSelected && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
            }}
            className="absolute bottom-[-8px] right-[-8px] w-5 h-5 bg-white border-2 border-[#FFD105] rounded-full z-[1001] shadow-sm cursor-nwse-resize"
          >
            <motion.div 
              className="w-full h-full"
              onPan={handleResize}
              onPanEnd={handleResizeEnd}
            />
          </div>
        )}
      </motion.div>
    </MotionConfig>
  );
};

export default LottieComponent;
