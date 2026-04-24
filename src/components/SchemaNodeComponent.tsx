import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';
import { Plus, Edit2, Palette, Trash2, X, PlusCircle, MoreHorizontal } from 'lucide-react';

interface SchemaNodeProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isTracing?: boolean;
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  isSchemaMode: boolean;
  canvasScale: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  onSelect: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onStartEdit: (id: string) => void;
  onInteraction: (e: React.PointerEvent) => void;
  onCancelInteraction?: () => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  schemaId?: string;
}

const SchemaNodeComponent: React.FC<SchemaNodeProps> = memo(({
  id,
  text,
  x,
  y,
  width,
  height,
  color,
  isTracing,
  isSelected,
  isMultiSelected,
  isSelectionMode,
  isSchemaMode,
  canvasScale,
  bold,
  italic,
  underline,
  strikethrough,
  align = 'center',
  onSelect,
  onToggleMultiSelect,
  onUpdate,
  onDelete,
  onAddChild,
  onStartEdit,
  onInteraction,
  onCancelInteraction,
  onGroupDrag,
  onGroupDragEnd,
  schemaId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const isMultiSelectedRef = useRef(isMultiSelected);
  const pointerDownTimeRef = useRef(0);
  const downPosRef = useRef({ x: 0, y: 0 });

  const wasSelectedAtPointerDown = useRef(false);

  useEffect(() => {
    isMultiSelectedRef.current = isMultiSelected;
  }, [isMultiSelected]);
  
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);

  useEffect(() => {
    mvX.set(x);
    mvY.set(y);
  }, [x, y, mvX, mvY]);

  const handleDragEnd = () => {
    onUpdate(id, { x: mvX.get(), y: mvY.get() });
  };

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
        handleDragEnd();
      }
    };

    window.addEventListener('group-drag', handleGroupDragEvent);
    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    return () => {
      window.removeEventListener('group-drag', handleGroupDragEvent);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
    };
  }, [id, mvX, mvY]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isEditing]);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate(id, { text: editorRef.current.innerText });
    }
  };

  // Listen for global "stop-editing" event
  useEffect(() => {
    const handleStopEditing = () => setIsEditing(false);
    window.addEventListener('stop-schema-editing', handleStopEditing);
    return () => window.removeEventListener('stop-schema-editing', handleStopEditing);
  }, []);

  useEffect(() => {
    if (!isSelected) {
      setShowMenu(false);
      setShowColorPalette(false);
      setIsEditing(false);
    }
  }, [isSelected]);

  return (
    <MotionConfig transformPagePoint={(point) => ({ x: point.x / canvasScale, y: point.y / canvasScale })}>
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: mvX,
          y: mvY,
          width,
          height,
          zIndex: isSelected ? 1001 : 100,
          touchAction: 'none',
        }}
        drag={isSchemaMode || isSelectionMode}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => {
          onCancelInteraction?.();
          if (isSelectionMode && !isMultiSelectedRef.current) {
            onToggleMultiSelect(id);
          }
        }}
        onDrag={(event, info) => {
          // Siempre notificamos el arrastre para que las líneas conectoras se actualicen suavemente
          onGroupDrag(id, info.delta);
        }}
        onDragEnd={() => {
          handleDragEnd();
          if (isMultiSelectedRef.current) {
            window.dispatchEvent(new CustomEvent('group-drag-end'));
            onGroupDragEnd();
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownTimeRef.current = Date.now();
          downPosRef.current = { x: e.clientX, y: e.clientY };
          wasSelectedAtPointerDown.current = isMultiSelected;
          
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          
          if (!isEditing) {
            longPressTimerRef.current = setTimeout(() => {
              setIsEditing(true);
              onStartEdit(id);
              setShowMenu(false);
              if (window.navigator?.vibrate) window.navigator.vibrate(50);
            }, 500);
            
            const clearLongPress = () => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };
            window.addEventListener('pointerup', clearLongPress, { once: true });
            window.addEventListener('pointercancel', clearLongPress, { once: true });
          }
          
          if (isSelectionMode) {
            if (!isMultiSelected) {
              onToggleMultiSelect(id);
            }
            dragControls.start(e);
            onInteraction(e);
            return;
          }

          if (!isSelected && !isMultiSelected) {
            onSelect(id);
          }
          if (isSchemaMode && (isMultiSelected || !isEditing)) {
            dragControls.start(e);
          }
        }}
        onPointerMove={(e) => {
          if (longPressTimerRef.current) {
            const dx = Math.abs(e.clientX - downPosRef.current.x);
            const dy = Math.abs(e.clientY - downPosRef.current.y);
            if (dx > 10 || dy > 10) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }
        }}
        onPointerUp={() => {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          onCancelInteraction?.();
        }}
        onPointerLeave={() => {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          onCancelInteraction?.();
        }}
        onPointerCancel={() => {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          onCancelInteraction?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          const isLongPress = Date.now() - pointerDownTimeRef.current > 800;
          
          if (isSelectionMode) {
            // If it was already selected at pointer down, toggle it OFF on click
            if (!isLongPress && wasSelectedAtPointerDown.current) {
              onToggleMultiSelect(id);
            }
            return;
          }
          if (!isSchemaMode) return;
          // onSelect() and menu are handled by the interaction logic if needed
          // but we keep consistent behavior
          onSelect(id);
          if (!isSelected) {
            setShowMenu(true);
          } else {
            setShowMenu(!showMenu);
          }
          setShowColorPalette(false);
        }}
      >
        <div
          className={`w-full h-full rounded-2xl border-2 flex items-center justify-center p-3 transition-all shadow-lg ${
            isSelected || isMultiSelected ? 'border-white ring-4 ring-[#8e44ad]/30 cuadro-seleccionado' : 'border-transparent'
          }`}
          style={{ 
            backgroundColor: color,
            opacity: isTracing ? 0.5 : 1
          }}
        >
          <div
            ref={editorRef}
            contentEditable={isEditing}
            onInput={handleInput}
            suppressContentEditableWarning={true}
            className={`text-white outline-none w-full break-words ${
              isEditing ? 'cursor-text' : 'cursor-pointer'
            }`}
            style={{ 
              fontSize: '14px',
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: `${underline ? 'underline' : ''} ${strikethrough ? 'line-through' : ''}`.trim() || 'none',
              textAlign: align
            }}
            onBlur={() => {
              // We don't auto-stop editing on blur if we want to use the bottom bar
              // But we need some way to stop. The bottom bar "Check" will do it.
            }}
          >
            {text}
          </div>
        </div>

        {/* Submenú inferior */}
        {isSelected && showMenu && !isEditing && isSchemaMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center gap-2 z-[1002]"
            onClick={(e) => e.stopPropagation()}
          >
            {showColorPalette && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#232323] border border-white/10 p-2 rounded-xl shadow-2xl flex gap-2 mb-1"
              >
                {['#8e44ad', '#2980b9', '#27ae60', '#f1c40f', '#e67e22', '#e74c3c'].map(c => (
                  <div 
                    key={c}
                    className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      onUpdate(id, { color: c });
                      setShowColorPalette(false);
                    }}
                  />
                ))}
              </motion.div>
            )}

            <div className="flex items-center gap-1 bg-[#232323] border border-white/10 p-1 rounded-xl shadow-2xl">
              <div className="flex flex-col items-center px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => { setIsEditing(true); onStartEdit(id); setShowMenu(false); }}>
                <Edit2 size={18} className="text-white" />
                <span className="text-[10px] text-white/60 mt-0.5">Editar</span>
              </div>
              
              <div className="flex flex-col items-center px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => setShowColorPalette(!showColorPalette)}>
                <Palette size={18} className="text-white" />
                <span className="text-[10px] text-white/60 mt-0.5">Color</span>
              </div>

              <div className="flex flex-col items-center px-2 py-1 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => onAddChild(id)}>
                <PlusCircle size={18} className="text-white" />
                <span className="text-[10px] text-white/60 mt-0.5">Nodo Hijo</span>
              </div>

              <div className="w-px h-8 bg-white/10 mx-1" />

              <div className="flex flex-col items-center px-2 py-1 hover:bg-red-500/20 rounded-lg cursor-pointer group" onClick={() => onDelete(id)}>
                <Trash2 size={18} className="text-red-500" />
                <span className="text-[10px] text-red-500/60 mt-0.5">Eliminar</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </MotionConfig>
  );
});

export default SchemaNodeComponent;
