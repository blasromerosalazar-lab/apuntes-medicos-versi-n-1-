import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useDragControls } from 'motion/react';

interface TextBoxProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor?: string;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: any) => void;
  canvasScale: number;
}

const TextBoxComponent: React.FC<TextBoxProps> = ({
  id,
  text,
  x,
  y,
  width,
  height,
  fontSize,
  fontWeight,
  fontStyle,
  textDecoration,
  textAlign,
  backgroundColor = 'transparent',
  isSelected,
  canEdit,
  onSelect,
  onUpdate,
  canvasScale,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const handlesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();
  
  // Motion values for ultra-smooth updates - these are the source of truth for position and size
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height);

  // Sync motion values ONLY when props change from OUTSIDE (e.g. undo/redo or initial load)
  // We use a ref to track the last values we sent to the parent to avoid feedback loops
  const lastSentValues = useRef({ x, y, width, height });

  useEffect(() => {
    // Only update motion values if the props are different from what we last sent
    // This prevents the "jumping" when the parent state updates after a drag/resize
    if (Math.abs(x - lastSentValues.current.x) > 0.1) mvX.set(x);
    if (Math.abs(y - lastSentValues.current.y) > 0.1) mvY.set(y);
    if (Math.abs(width - lastSentValues.current.width) > 0.1) mvWidth.set(width);
    if (Math.abs(height - lastSentValues.current.height) > 0.1) mvHeight.set(height);
    
    lastSentValues.current = { x, y, width, height };
  }, [x, y, width, height, mvX, mvY, mvWidth, mvHeight]);

  const handleResize = (direction: string, info: any) => {
    const deltaX = info.delta.x / canvasScale;
    const deltaY = info.delta.y / canvasScale;
    
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
      if (potentialHeight >= 30) {
        currentHeight = potentialHeight;
        currentY += deltaY;
      }
    }

    mvWidth.set(Math.max(50, currentWidth));
    mvHeight.set(Math.max(30, currentHeight));
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

  const handleDragEnd = (e: any, info: any) => {
    setIsDragging(false);
    const finalValues = {
      x: mvX.get(),
      y: mvY.get()
    };
    lastSentValues.current = { ...lastSentValues.current, ...finalValues };
    onUpdate(id, finalValues);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;

    onSelect();
    
    if (canEdit) {
      // Mode: Insert Text Active (Edit Mode)
      // Immediate activation
      setIsActivated(true);
      // We don't need dragControls.start(e) here because 'drag' prop will handle it 
      // if we set dragListener={true} for this mode
    } else {
      // Mode: Navigation
      // Start long press timer (1 second)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      
      longPressTimerRef.current = setTimeout(() => {
        setIsActivated(true);
        // Start drag manually after 1s in navigation mode
        dragControls.start(e);
      }, 1000);
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // We don't reset isActivated here to allow handles to stay if they appeared
  };

  useEffect(() => {
    if (!isSelected) {
      setIsActivated(false);
      setShowHandles(false);
    }
  }, [isSelected]);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Delay handles appearance when activated (long pressed)
  useEffect(() => {
    if (isSelected && isActivated && !isEditing && !isResizing && !isDragging) {
      setShowHandles(true);
    } else if (!isActivated) {
      setShowHandles(false);
    }
  }, [isSelected, isActivated, isEditing, isResizing, isDragging]);

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
        zIndex: isSelected ? 1000 : 10,
      }}
      drag={isSelected && isActivated && !isEditing && !isResizing}
      dragListener={canEdit} // Allow immediate drag only in edit mode
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className={`w-full h-full p-2 border-2 transition-colors rounded-sm flex flex-col ${
          isSelected ? 'border-[#d9b000] cursor-move bg-white/5 shadow-sm' : 'border-transparent bg-transparent'
        }`}
        onDoubleClick={(e) => {
          if (canEdit) {
            e.stopPropagation();
            setIsEditing(true);
          }
        }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            placeholder="Escribe aquí..."
            className="w-full h-full bg-white outline-none resize-none cursor-text flex-1"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textDecoration,
              textAlign,
              color: 'black',
              backgroundColor,
            }}
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsEditing(false);
                onUpdate(id, { text: localText });
              }
            }}
            onBlur={() => {
              setIsEditing(false);
              onUpdate(id, { text: localText });
            }}
          />
        ) : (
          <div
            className="w-full h-full overflow-hidden"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textDecoration,
              textAlign,
              color: text === '' ? '#999' : 'black',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor,
            }}
          >
            {text === '' ? 'Escribe aquí...' : text}
          </div>
        )}
      </div>

      {isSelected && showHandles && !isEditing && (
        <>
          {/* Resize Handles */}
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
            <div
              key={dir}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsResizing(true);
              }}
              className={`absolute w-4 h-4 bg-white border-2 border-[#d9b000] rounded-full z-[1001] shadow-sm`}
              style={{
                top: dir.includes('n') ? -8 : dir.includes('s') ? '100%' : '50%',
                left: dir.includes('w') ? -8 : dir.includes('e') ? '100%' : '50%',
                marginTop: dir === 'e' || dir === 'w' ? -8 : 0,
                marginLeft: dir === 'n' || dir === 's' ? -8 : 0,
                cursor: `${dir}-resize`,
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
  );
};

export default TextBoxComponent;
