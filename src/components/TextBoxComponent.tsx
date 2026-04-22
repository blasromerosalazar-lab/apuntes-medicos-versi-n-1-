import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';

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
  rotation?: number;
  zIndex?: number;
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  canvasScale: number;
  isHandMode: boolean;
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
  onEditingChange,
  canvasScale,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(text);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const handlesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();
  
  // Motion values for ultra-smooth updates - these are the source of truth for position and size
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);
  const mvWidth = useMotionValue(width);
  const mvHeight = useMotionValue(height);
  const mvRotate = useMotionValue(rotation);

  // Sync motion values ONLY when props change from OUTSIDE (e.g. undo/redo or initial load)
  // We use a ref to track the last values we sent to the parent to avoid feedback loops
  const lastSentValues = useRef({ x, y, width, height });

  useEffect(() => {
    // Only update motion values if the props are different from what we last sent or received
    // This prevents the "jumping" when the parent state updates after a drag/resize
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
  }, [x, y, width, height, mvX, mvY, mvWidth, mvHeight]);

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
      y: mvY.get(),
      rotation: mvRotate.get()
    };
    lastSentValues.current = { x: finalValues.x, y: finalValues.y, width: finalValues.width, height: finalValues.height };
    onUpdate(id, finalValues);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isResizing) return;

    if (isSelectionMode) {
      // If it's already selected, we might want to drag it instead of toggling
      // But the request says click toggles. To allow dragging, we should only toggle if it's a "clean" click.
      // However, Framer Motion dragControls.start(e) needs to be called.
      if (isMultiSelected) {
        // If already selected, allow dragging
        dragControls.start(e);
      } else {
        // If not selected, toggle it
        onToggleMultiSelect(id);
      }
      return;
    }

    // Always select on pointer down if not already selected
    if (!isSelected && !isMultiSelected) {
      onSelect();
    }
    
    // Start dragging state
    setIsActivated(true);
    
    // Trigger manual drag only if the text tool is active (canEdit)
    if (canEdit) {
      dragControls.start(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Don't stop propagation here to allow other interactions if needed, 
    // but we can if we want to be safe.
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsActivated(false);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalX = mvX.get();
    const finalY = mvY.get();
    
    // Crucial: Update the ref BEFORE calling onUpdate to prevent the incoming props 
    // from triggering the sync useEffect and snapping the box back
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    
    onUpdate(id, { x: finalX, y: finalY });
  };

  useEffect(() => {
    if (!isSelected && !isMultiSelected) {
      setIsActivated(false);
      setIsEditing(false);
    }
  }, [isSelected, isMultiSelected]);

  const lastEditingValue = useRef(isEditing);
  useEffect(() => {
    if (lastEditingValue.current !== isEditing) {
      onEditingChange?.(isEditing);
      lastEditingValue.current = isEditing;
    }
    
    if (isEditing && editorRef.current) {
      // Focus and move cursor to end if it's empty or just starting
      if (editorRef.current.innerHTML === 'Escribe aquí...') {
        editorRef.current.innerHTML = '';
      }
      editorRef.current.focus();
    }
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    const handleInsertIcon = (e: any) => {
      if (isSelected && editorRef.current) {
        const iconHtml = e.detail.html;
        
        const insertAtCursor = () => {
          if (!editorRef.current) return;
          
          // Ensure focus
          editorRef.current.focus();
          
          const selection = window.getSelection();
          if (!selection) return;

          let range: Range;
          // Try to get current range if it's inside the editor
          if (selection.rangeCount > 0 && editorRef.current.contains(selection.getRangeAt(0).commonAncestorContainer)) {
            range = selection.getRangeAt(0);
          } else {
            // Otherwise, put it at the end
            range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // Use execCommand if possible for better undo/redo support
          let success = false;
          try {
            success = document.execCommand('insertHTML', false, iconHtml);
          } catch (err) {
            console.error('execCommand failed', err);
          }

          if (!success) {
            // Fallback to manual Range insertion
            range.deleteContents();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = iconHtml;
            const frag = document.createDocumentFragment();
            let node, lastNode;
            while ((node = tempDiv.firstChild)) {
              lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            if (lastNode) {
              range.setStartAfter(lastNode);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
          
          // Sync back to parent
          onUpdate(id, { text: editorRef.current.innerHTML });
          
          // Signal success to the toolbar
          window.dispatchEvent(new CustomEvent('insert-icon-success'));
        };

        if (!isEditing) {
          setIsEditing(true);
          // Wait for contentEditable to be active
          setTimeout(insertAtCursor, 50);
        } else {
          insertAtCursor();
        }
      }
    };
    window.addEventListener('insert-icon', handleInsertIcon as any);
    return () => window.removeEventListener('insert-icon', handleInsertIcon as any);
  }, [isSelected, isEditing, id, onUpdate]);

  // High-performance group drag listener
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

  // Sync state at the end of a group drag
  useEffect(() => {
    const handleGroupDragEndEvent = () => {
      if (isMultiSelected) {
        handleDragEnd();
      }
    };

    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    return () => window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
  }, [isMultiSelected]);

  useEffect(() => {
    if (editorRef.current && !isEditing) {
      const content = text === '' ? 'Escribe aquí...' : text;
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [text, isEditing]);

  const handleInput = () => {
    if (editorRef.current) {
      const newText = editorRef.current.innerHTML;
      // Update parent state immediately on input to prevent data loss
      onUpdate(id, { text: newText === 'Escribe aquí...' ? '' : newText });
    }
  };

  useEffect(() => {
    if (isEditing && editorRef.current) {
      if (editorRef.current.innerHTML === 'Escribe aquí...') {
        editorRef.current.innerHTML = '';
      }
      editorRef.current.focus();
    }
  }, [isEditing]);

  const showHandles = isSelected && canEdit && !isDragging;

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
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={(e) => {
          e.stopPropagation();
          // If the text tool is active (canEdit), enter edit mode on single click
          if (canEdit && !isDragging && !isEditing) {
            setIsEditing(true);
          }
        }}
      >
        <div
          className={`w-full h-full p-2 border-2 transition-colors rounded-sm flex flex-col ${
            isSelected ? 'border-[#FFD105] bg-white/5 shadow-sm' : 'border-transparent bg-transparent'
          } ${isSelected && canEdit ? 'cursor-move' : ''} ${isMultiSelected ? 'cuadro-seleccionado' : ''} ${isDragging && isMultiSelected ? 'grabbed' : ''}`}
          onDoubleClick={(e) => {
            if (isSelectionMode) return;
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div
            ref={editorRef}
            contentEditable={isEditing && !isMultiSelected}
            onInput={handleInput}
            onPointerDown={(e) => {
              if (isEditing) {
                // Stop propagation to allow text selection inside the editor
                e.stopPropagation();
              }
            }}
            suppressContentEditableWarning={true}
            className={`w-full h-full p-2 outline-none cursor-text flex-1 overflow-y-auto ${
              isEditing ? 'bg-white pointer-events-auto' : 'bg-transparent pointer-events-none'
            }`}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              fontStyle,
              textDecoration,
              textAlign,
              color: text === '' && !isEditing ? '#999' : 'black',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: backgroundColor || 'transparent',
            }}
            onBlur={() => {
              setIsEditing(false);
              if (editorRef.current) {
                const newText = editorRef.current.innerHTML;
                // Only update if changed to avoid unnecessary re-renders
                if (newText !== text) {
                  onUpdate(id, { text: newText === 'Escribe aquí...' ? '' : newText });
                }
              }
            }}
          />
        </div>

        {showHandles && (
          <>
            {/* Resize Handles */}
            {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((dir) => (
              <div
                key={dir}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsResizing(true);
                  // Ensure we don't start a drag on the parent
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
                  const rect = editorRef.current?.parentElement?.parentElement?.getBoundingClientRect();
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

export default TextBoxComponent;
