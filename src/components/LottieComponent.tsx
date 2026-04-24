import React, { useState, useRef, useEffect, memo } from 'react';
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
  onSelect: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
  isHandMode: boolean;
  labels?: { start: number, end: number, text: string }[];
}

const LottieComponent: React.FC<LottieProps> = memo(({
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
  labels = [
    { start: 0, end: 2, text: 'Reactivos' },
    { start: 3, end: 5, text: 'Transición' },
    { start: 6, end: 100, text: 'Producto' }
  ]
}) => {
  const lottieRef = useRef<any>(null);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentLabel = labels.find(l => currentTime >= l.start && currentTime <= l.end)?.text || '';

  const handleEnterFrame = (e: any) => {
    // Lottie provides frame, we convert to seconds roughly (assuming 30fps if not specified)
    const frame = e.currentTime;
    const totalFrames = lottieRef.current?.animationItem?.totalFrames || 1;
    const duration = lottieRef.current?.animationItem?.getDuration() || 1;
    const time = (frame / totalFrames) * duration;
    setCurrentTime(time);
  };
  
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
    e.stopPropagation();
    if (isResizing) return;

    if (isSelectionMode) {
      if (!isMultiSelected) {
        onToggleMultiSelect(id);
      }
      dragControls.start(e);
      return;
    }

    if (!isSelected && !isMultiSelected) {
      onSelect(id);
    }
    
    if (!isHandMode) {
      dragControls.start(e);
    }

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
        className={`contenedor-lottie ${isSelected || isMultiSelected ? 'cuadro-seleccionado' : ''}`}
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
          // Siempre notificamos el arrastre para sincronizar otros elementos o líneas conectoras
          onGroupDrag(id, info.delta);
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
        <div style={{ position: 'relative', width: 150, height: 150 }}>
          {/* Dynamic Title Outside */}
          <div 
            style={{
              position: 'absolute',
              top: '-30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: '#FFD105',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              opacity: currentLabel ? 1 : 0,
              transition: 'opacity 0.3s'
            }}
          >
            {currentLabel}
          </div>

          <Lottie 
            lottieRef={lottieRef}
            animationData={data} 
            loop={true} 
            autoplay={false}
            onEnterFrame={handleEnterFrame}
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          />

          {/* Overlay de Etiquetas (Solo cuando está pausado) */}
          {!isPlaying && (
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(1px)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto',
                cursor: 'pointer'
              }}
              onClick={handleTogglePlay}
            >
              <div style={{
                backgroundColor: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#666',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #eee'
              }}>
                MODO ETIQUETADO ACTIVO
              </div>
            </div>
          )}
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
});

export default LottieComponent;
