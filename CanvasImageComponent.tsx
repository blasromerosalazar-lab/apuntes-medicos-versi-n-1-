import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig, AnimatePresence, useMotionTemplate, useMotionValueEvent } from 'motion/react';
import { Trash2, Tag, Plus, Check, X, MousePointer2 } from 'lucide-react';

interface CanvasImageLabel {
  id: string;
  text: string;
  type: 'fixed' | 'interactive';
  color: string;
  anchorX: number; // 0-1 relative to image
  anchorY: number; // 0-1 relative to image
  labelX: number; // Absolute canvas X
  labelY: number; // Absolute canvas Y
  lineWidth?: number;
  isOpen?: boolean;
  lineStyle?: 'solid' | 'dashed';
}

interface CanvasImageProps {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
  sourcePage?: number;
  labels?: CanvasImageLabel[];
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

const EMPTY_ARRAY: any[] = [];

const ImageLabelItem: React.FC<{
  label: CanvasImageLabel;
  imageWidth: any;
  imageHeight: any;
  imageX: any;
  imageY: any;
  isEditing: boolean;
  updateLabel: (labelId: string, updates: Partial<CanvasImageLabel>, isFinal?: boolean) => void;
  isDraggingLabelRef: React.MutableRefObject<boolean>;
  canvasScale: number;
}> = ({ label, imageWidth, imageHeight, imageX, imageY, isEditing, updateLabel, isDraggingLabelRef, canvasScale }) => {
  const labelBoxRef = useRef<HTMLDivElement>(null);
  
  // Anchor remains relative (0-1) to the image as it's an "attachment point"
  const mvAnchorX = useMotionValue(label.anchorX * 100);
  const mvAnchorY = useMotionValue(label.anchorY * 100);
  
  // Label position is now ABSOLUTE on the canvas
  const mvLabelX = useMotionValue(label.labelX);
  const mvLabelY = useMotionValue(label.labelY);

  // Calculate local coordinates relative to image top-left for rendering
  // Since this component is a child of the image container (which is already at imageX, imageY),
  // we need to subtract the image's current position to get the local offset.
  const localX = useMotionValue(label.labelX - (imageX.get() as number));
  const localY = useMotionValue(label.labelY - (imageY.get() as number));

  // Update local offsets whenever label position or image position changes
  useMotionValueEvent(mvLabelX, "change", (latest: number) => localX.set(latest - (imageX.get() as number)));
  useMotionValueEvent(mvLabelY, "change", (latest: number) => localY.set(latest - (imageY.get() as number)));
  useMotionValueEvent(imageX, "change", (latest: number) => localX.set((mvLabelX.get() as number) - latest));
  useMotionValueEvent(imageY, "change", (latest: number) => localY.set((mvLabelY.get() as number) - latest));

  // Visual template for CSS positioning
  const leftAnchor = useMotionTemplate`${mvAnchorX}%`;
  const topAnchor = useMotionTemplate`${mvAnchorY}%`;
  const leftLabel = useMotionTemplate`${localX}px`;
  const topLabel = useMotionTemplate`${localY}px`;

  // For the connector path, we need to convert anchor percentage to pixels
  const anchorPxX = useMotionValue((label.anchorX * (imageWidth.get() as number)));
  const anchorPxY = useMotionValue((label.anchorY * (imageHeight.get() as number)));
  
  useMotionValueEvent(imageWidth, "change", (latest: number) => anchorPxX.set((mvAnchorX.get() as number) / 100 * latest));
  useMotionValueEvent(imageHeight, "change", (latest: number) => anchorPxY.set((mvAnchorY.get() as number) / 100 * latest));
  useMotionValueEvent(mvAnchorX, "change", (latest: number) => anchorPxX.set(latest / 100 * (imageWidth.get() as number)));
  useMotionValueEvent(mvAnchorY, "change", (latest: number) => anchorPxY.set(latest / 100 * (imageHeight.get() as number)));

  const path = useMotionTemplate`M ${anchorPxX} ${anchorPxY} L ${localX} ${localY}`;

  // Sync with props
  useEffect(() => {
    if (!isDraggingLabelRef.current) {
      mvAnchorX.set(label.anchorX * 100);
      mvAnchorY.set(label.anchorY * 100);
      mvLabelX.set(label.labelX);
      mvLabelY.set(label.labelY);
    }
  }, [label.anchorX, label.anchorY, label.labelX, label.labelY]);

  const toggleOpen = (e: any) => {
    // Prevent default and stop propagation to ensure only this handler runs
    if (e.cancelable) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();

    // Directly allow toggle - Framer Motion's onTap won't fire if a true pan happened
    if (label.type === 'interactive') {
      updateLabel(label.id, { isOpen: !label.isOpen }, true);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10000 }}>
      {/* Connector Line SVG using viewBox 0-100 to map to percentages */}
      <svg 
        className="absolute inset-0 pointer-events-none overflow-visible w-full h-full"
        style={{ zIndex: 1 }}
      >
        <motion.path
          d={path}
          stroke={label.color}
          strokeWidth={label.lineWidth || 1.5}
          strokeDasharray={label.lineStyle === 'dashed' ? "4,4" : "none"}
          fill="none"
          initial={false}
          animate={{ opacity: label.type === 'fixed' || label.isOpen || isEditing ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </svg>

      {/* Anchor / Interactive Trigger Button */}
      {(isEditing || label.type === 'interactive') && (
        <motion.div
          onPointerDown={(e) => {
            e.stopPropagation();
            // We set dragging ref ONLY in the parent if needed, 
            // but for coordinates sync we wait for onPan
          }}
          onTap={(e) => {
            toggleOpen(e);
          }}
          onPanStart={() => {
            if (isEditing) isDraggingLabelRef.current = true;
          }}
          onPan={(e, info) => {
            if (!isEditing) return;
            isDraggingLabelRef.current = true;
            
            const curW = imageWidth.get();
            const curH = imageHeight.get();
            if (!curW || !curH) return;

            const deltaPctX = (info.delta.x / curW) * 100;
            const deltaPctY = (info.delta.y / curH) * 100;
            
            // Dot limits (1% padding)
            const nextX = Math.max(1, Math.min(99, mvAnchorX.get() + deltaPctX));
            const nextY = Math.max(1, Math.min(99, mvAnchorY.get() + deltaPctY));
            
            mvAnchorX.set(nextX);
            mvAnchorY.set(nextY);

            updateLabel(label.id, { 
              anchorX: nextX / 100, 
              anchorY: nextY / 100 
            });
          }}
          onPanEnd={() => {
            if (isEditing) {
              updateLabel(label.id, {}, true);
            }
            // Add a small delay for resetting drag ref so onTap doesn't catch the end of a pan
            setTimeout(() => {
              isDraggingLabelRef.current = false;
            }, 50);
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          initial={{ x: '-50%', y: '-50%', scale: 0 }}
          animate={{ x: '-50%', y: '-50%', scale: 1 }}
          style={{
            position: 'absolute',
            left: leftAnchor,
            top: topAnchor,
            width: 56, // Robust hit area
            height: 56,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            cursor: isEditing ? 'move' : (label.type === 'interactive' ? 'pointer' : 'default'),
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Animated Pulse Ring for View Mode */}
          {label.type === 'interactive' && !isEditing && (
            <motion.div
              animate={label.isOpen ? { scale: 0, opacity: 0 } : { scale: [1, 2.4, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: label.color,
              }}
            />
          )}

          {/* Visual Dot - The actual "button" face */}
          <motion.div
            style={{
              width: 16,
              height: 16,
              backgroundColor: label.color,
              borderRadius: '50%',
              border: '2.5px solid white',
              boxShadow: `0 0 15px ${label.color}`,
              position: 'relative',
              zIndex: 2
            }}
          />
        </motion.div>
      )}

      {/* Label Box */}
      <AnimatePresence>
        {(label.type === 'fixed' || label.isOpen || isEditing) && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
            animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
            exit={{ scale: 0, opacity: 0, x: '-50%', y: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (isEditing) isDraggingLabelRef.current = true;
            }}
            onTap={(e) => {
              if (label.type === 'interactive') {
                e.stopPropagation();
                // Close if not in editing mode or if specifically clicking X (handled by event order usually)
                updateLabel(label.id, { isOpen: false }, true);
              }
            }}
            onPanStart={() => {
              if (isEditing) isDraggingLabelRef.current = true;
            }}
            onPan={(e, info) => {
              if (!isEditing) return;
              isDraggingLabelRef.current = true;
              
              // No clamping - allow labels to move anywhere globally
              const nextX = mvLabelX.get() + info.delta.x;
              const nextY = mvLabelY.get() + info.delta.y;
              
              mvLabelX.set(nextX);
              mvLabelY.set(nextY);

              updateLabel(label.id, { 
                labelX: nextX, 
                labelY: nextY 
              });
            }}
            onPanEnd={() => {
              if (isEditing) {
                updateLabel(label.id, {}, true);
                isDraggingLabelRef.current = false;
              }
            }}
            whileHover={label.type === 'interactive' ? { scale: 1.05 } : {}}
            ref={labelBoxRef}
            style={{
              position: 'absolute',
              left: leftLabel,
              top: topLabel,
              backgroundColor: label.color,
              padding: '10px 20px',
              borderRadius: '16px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '800',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              zIndex: 200,
              cursor: isEditing ? 'move' : (label.type === 'interactive' ? 'pointer' : 'default'),
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              whiteSpace: 'nowrap',
              touchAction: 'none',
              pointerEvents: 'auto',
              border: '3px solid rgba(255,255,255,0.4)',
            }}
          >
            {label.text}
            {label.type === 'interactive' && (
              <X size={16} className="opacity-80" strokeWidth={3} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CanvasImageComponent: React.FC<CanvasImageProps> = memo(({
  id,
  src,
  x,
  y,
  width,
  height,
  rotation,
  zIndex = 10,
  sourcePage,
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
  labels: initialLabels = EMPTY_ARRAY,
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [localLabels, setLocalLabels] = useState<CanvasImageLabel[]>(initialLabels);
  
  const dragControls = useDragControls();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMoved = useRef(false);
  const isDraggingLabel = useRef(false);

  // Synchronize local labels with props when not dragging
  useEffect(() => {
    if (!isDraggingLabel.current) {
      setLocalLabels(initialLabels);
    }
  }, [initialLabels]);
  
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
    }, 500);
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
  }, [x, y, width, height]);

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
    const finalX = mvX.get();
    const finalY = mvY.get();
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    onUpdate(id, { x: finalX, y: finalY });
  };

  const updateLabel = (labelId: string, updates: Partial<CanvasImageLabel>, isFinal = false) => {
    const updatedLabels = localLabels.map(l => l.id === labelId ? { ...l, ...updates } : l);
    setLocalLabels(updatedLabels);
    
    if (updates.id || updates.anchorX !== undefined || updates.labelX !== undefined) {
      isDraggingLabel.current = true;
    }

    if (isFinal) {
      onUpdate(id, { labels: updatedLabels });
      // Clear drag flag after parent update
      setTimeout(() => {
        isDraggingLabel.current = false;
      }, 60);
    }
  };

  const deleteLabel = (labelId: string) => {
    const updatedLabels = localLabels.filter(l => l.id !== labelId);
    setLocalLabels(updatedLabels);
    onUpdate(id, { labels: updatedLabels });
  };

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
          rotate: rotation,
          zIndex: isEditing ? 10000 : (isSelected || isMultiSelected ? 1000 : zIndex),
          touchAction: 'none',
        }}
        drag={(isEditing || (isSelectionMode && isMultiSelected)) && !isResizing && !isHandMode}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
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
      >
        <div className={`w-full h-full relative group overflow-visible`}>
          <img 
            src={src} 
            alt="Canvas" 
            className="w-full h-full object-contain pointer-events-none rounded-lg shadow-lg overflow-visible"
            style={{ 
              imageRendering: 'auto',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
            }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Labels Layer - Moved OUTSIDE the absolute relative image group but within the root div 
            to ensure absolute top-level layering while maintaining relative positioning */}
        <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 9999 }}>
          {localLabels.map((label) => (
            <ImageLabelItem 
              key={label.id}
              label={label}
              imageWidth={mvWidth}
              imageHeight={mvHeight}
              imageX={mvX}
              imageY={mvY}
              isEditing={isEditing}
              updateLabel={updateLabel}
              isDraggingLabelRef={isDraggingLabel}
              canvasScale={canvasScale}
            />
          ))}
        </div>

        {isEditing && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-[#FFD105] pointer-events-none" />
            {/* Resize Handles */}
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
              <div
                key={dir}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                }}
                className={`absolute w-3 h-3 bg-white border border-[#FFD105] rounded-full z-[10001] pointer-events-auto`}
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
          </div>
        )}

        {isSelected && !isEditing && (
          <div className="absolute inset-0 border border-white/30 pointer-events-none" />
        )}

        {isMultiSelected && (
          <div className="absolute inset-0 border-2 border-[#FFD105]/50 border-dashed pointer-events-none" />
        )}
      </motion.div>
    </MotionConfig>
  );
});

export default CanvasImageComponent;
