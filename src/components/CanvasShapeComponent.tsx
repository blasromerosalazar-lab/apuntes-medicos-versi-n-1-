import React, { useRef, useEffect, memo } from 'react';
import { motion, useMotionValue, useDragControls } from 'motion/react';

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
  isHandMode: boolean;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onStartEdit?: () => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
}

const CanvasShapeComponent: React.FC<CanvasShapeProps> = memo(({
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
  isHandMode,
  isEditing,
  onSelect,
  onStartEdit,
  onToggleMultiSelect,
  onUpdate,
  onGroupDrag,
  onGroupDragEnd,
  canvasScale,
}) => {
  const [isResizing, setIsResizing] = React.useState(false);
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height);
  const mvRotate = useMotionValue(rotation);
  const dragControls = useDragControls();

  const lastSentValues = useRef({ x, y, width, height });

  const isMultiSelectedRef = useRef(isMultiSelected);

  useEffect(() => {
    isMultiSelectedRef.current = isMultiSelected;
  }, [isMultiSelected]);

  useEffect(() => {
    if (Math.abs(x - lastSentValues.current.x) > 0.1) mvX.set(x);
    if (Math.abs(y - lastSentValues.current.y) > 0.1) mvY.set(y);
    if (Math.abs(width - lastSentValues.current.width) > 0.1) mvWidth.set(width);
    if (Math.abs(height - lastSentValues.current.height) > 0.1) mvHeight.set(height);
    mvRotate.set(rotation);
    lastSentValues.current = { x, y, width, height };
  }, [x, y, width, height, rotation, mvX, mvY, mvWidth, mvHeight, mvRotate]);

  // High-performance group drag listener
  useEffect(() => {
    const handleGroupDragEvent = (e: any) => {
      const { senderId, delta } = e.detail;
      if (isMultiSelectedRef.current && senderId !== id) {
        mvX.set(mvX.get() + delta.x);
        mvY.set(mvY.get() + delta.y);
      }
    };

    const handleGroupDragEndEvent = () => {
      if (isMultiSelectedRef.current) {
        onUpdate(id, { x: mvX.get(), y: mvY.get() });
      }
    };

    window.addEventListener('group-drag', handleGroupDragEvent);
    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    return () => {
      window.removeEventListener('group-drag', handleGroupDragEvent);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
    };
  }, [id, mvX, mvY, onUpdate]);

  const renderShape = () => {
    const commonProps = {
      width: "100%",
      height: "100%",
      viewBox: "0 0 100 100",
      preserveAspectRatio: "none",
    };

    switch (type) {
      case 'circle':
      case 'sphere':
        return (
          <svg {...commonProps}>
            <circle cx="50" cy="50" r="48" fill={fillColor} stroke={borderColor} strokeWidth="2" />
          </svg>
        );
      case 'triangle':
      case 'pyramid':
        return (
          <svg {...commonProps}>
            <polygon points="50,2 98,98 2,98" fill={fillColor} stroke={borderColor} strokeWidth="2" />
          </svg>
        );
      case 'square':
      case 'rectangle':
      case 'cube':
        return (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              backgroundColor: fillColor, 
              border: `2px solid ${borderColor}`,
              borderRadius: type === 'square' || type === 'rectangle' ? '4px' : '0'
            }} 
          />
        );
      case 'hexagon':
        return (
          <svg {...commonProps}>
            <polygon points="25,5 75,5 100,50 75,95 25,95 0,50" fill={fillColor} stroke={borderColor} strokeWidth="2" />
          </svg>
        );
      case 'star':
        return (
          <svg {...commonProps}>
            <polygon points="50,0 63,38 100,38 69,59 82,100 50,75 18,100 31,59 0,38 37,38" fill={fillColor} stroke={borderColor} strokeWidth="2" />
          </svg>
        );
      case 'cylinder':
        return (
          <svg {...commonProps}>
            <ellipse cx="50" cy="20" rx="48" ry="18" fill={fillColor} stroke={borderColor} strokeWidth="2" />
            <rect x="2" y="20" width="96" height="60" fill={fillColor} stroke={borderColor} strokeWidth="0" />
            <line x1="2" y1="20" x2="2" y2="80" stroke={borderColor} strokeWidth="2" />
            <line x1="98" y1="20" x2="98" y2="80" stroke={borderColor} strokeWidth="2" />
            <ellipse cx="50" cy="80" rx="48" ry="18" fill={fillColor} stroke={borderColor} strokeWidth="2" />
          </svg>
        );
      default:
        return (
          <div style={{ width: '100%', height: '100%', backgroundColor: fillColor, border: `2px solid ${borderColor}` }} />
        );
    }
  };

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Timer para activar edición vía Long Press (1200ms)
    longPressTimerRef.current = setTimeout(() => {
      if (onStartEdit) onStartEdit();
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
      if (!isHandMode) dragControls.start(e);
    }, 1200);

    if (isSelectionMode) {
      if (!isMultiSelected) {
        onToggleMultiSelect(id);
      }
      if (!isHandMode) {
        dragControls.start(e);
      }
      return;
    }

    // Asegurar selección antes de arrastrar (para feedback visual)
    if (!isSelected && !isMultiSelected) {
      onSelect(id);
    }
    
    // Solo permitir movimiento si ya está en modo edición (colores) o selección múltiple real
    if (isEditing || isMultiSelected) {
      if (!isHandMode) {
        dragControls.start(e);
      }
    }
  };

  const onPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        x: mvX,
        y: mvY,
        width: mvWidth,
        height: mvHeight,
        rotate: mvRotate,
        zIndex: isEditing ? 1000 : 10,
        cursor: isSelectionMode ? 'move' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transformOrigin: 'center center',
        touchAction: (isEditing || isSelectionMode || isMultiSelected) ? 'none' : 'auto'
      }}
      drag={!isResizing && (isEditing || isMultiSelected || isSelectionMode)}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      onDragStart={() => {
        // Redundant with pointerDown for mobile touch, but safe to keep if it doesn't double-call state
        // Actually onSelect(id) in onPointerDown handles it.
        // Clear long press if we start dragging before it fires
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }}
      onDrag={(e, info) => {
        // Siempre notificamos el arrastre para que elementos dependientes (como líneas de esquema) se sincronicen
        onGroupDrag(id, info.delta);
      }}
      onDragEnd={() => {
        onUpdate(id, { x: mvX.get(), y: mvY.get() });
        onGroupDragEnd();
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onStartEdit) onStartEdit();
      }}
      className="relative"
    >
      <div 
        className={`w-full h-full rounded-md ${
          isSelected || isMultiSelected ? 'cuadro-seleccionado' : ''
        }`}
      >
        {renderShape()}
      </div>

      {isSelected && (
        <>
          {/* Resize handles */}
          <div 
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD105] rounded-full cursor-nwse-resize z-50 shadow-md border-2 border-white"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              e.currentTarget.setPointerCapture(e.pointerId);
              const target = e.currentTarget;

              const startX = mvX.get();
              const startY = mvY.get();
              const startWidth = mvWidth.get();
              const startHeight = mvHeight.get();
              const startPointerX = e.clientX;
              const startPointerY = e.clientY;
              const angleInRadians = (mvRotate.get() * Math.PI) / 180;
              const cos = Math.cos(angleInRadians);
              const sin = Math.sin(angleInRadians);

              const onPointerMove = (moveEvent: any) => {
                const deltaXTotal = (moveEvent.clientX - startPointerX) / canvasScale;
                const deltaYTotal = (moveEvent.clientY - startPointerY) / canvasScale;
                
                // Rotate deltas back to local coordinate system
                const dW = deltaXTotal * Math.cos(-angleInRadians) - deltaYTotal * Math.sin(-angleInRadians);
                const dH = deltaXTotal * Math.sin(-angleInRadians) + deltaYTotal * Math.cos(-angleInRadians);

                const newWidth = Math.max(20, startWidth + dW);
                const newHeight = Math.max(20, startHeight + dH);
                
                const actualDW = newWidth - startWidth;
                const actualDH = newHeight - startHeight;

                // Adjust X and Y to compensate for center shift during rotation to keep top-left fixed
                const dx = (actualDW / 2) * cos - (actualDH / 2) * sin - (actualDW / 2);
                const dy = (actualDW / 2) * sin + (actualDH / 2) * cos - (actualDH / 2);

                mvWidth.set(newWidth);
                mvHeight.set(newHeight);
                mvX.set(startX + dx);
                mvY.set(startY + dy);
              };

              const onPointerUp = (upEvent: any) => {
                try { target.releasePointerCapture(upEvent.pointerId); } catch (err) {}
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                setIsResizing(false);
                onUpdate(id, { 
                  width: mvWidth.get(), 
                  height: mvHeight.get(),
                  x: mvX.get(),
                  y: mvY.get()
                });
              };

              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
            }}
          />
          
          {/* Rotation handle */}
          {!isSelectionMode && (
            <div 
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full cursor-pointer z-50 shadow-md border-2 border-[#FFD105] flex items-center justify-center hover:scale-110 transition-transform"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                const target = e.currentTarget;

                const rect = target.parentElement?.getBoundingClientRect();
                if (!rect) return;
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const onPointerMove = (moveEvent: any) => {
                  const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                  const degree = (angle * 180) / Math.PI + 90;
                  mvRotate.set(degree);
                };

                const onPointerUp = (upEvent: any) => {
                  try { target.releasePointerCapture(upEvent.pointerId); } catch (err) {}
                  window.removeEventListener('pointermove', onPointerMove);
                  window.removeEventListener('pointerup', onPointerUp);
                  onUpdate(id, { rotation: mvRotate.get() });
                };

                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
              }}
            >
              <div className="w-1 h-3 bg-[#FFD105] rounded-full" />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
});

export default CanvasShapeComponent;
