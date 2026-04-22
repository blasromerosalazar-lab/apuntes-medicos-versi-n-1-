import React, { useState, useRef, useEffect } from 'react';
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
  isSchemaMode: boolean;
  canvasScale: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  onSelect: () => void;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onStartEdit: (id: string) => void;
}

const SchemaNodeComponent: React.FC<SchemaNodeProps> = ({
  id,
  text,
  x,
  y,
  width,
  height,
  color,
  isTracing,
  isSelected,
  isSchemaMode,
  canvasScale,
  bold,
  italic,
  underline,
  strikethrough,
  align = 'center',
  onSelect,
  onUpdate,
  onDelete,
  onAddChild,
  onStartEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  
  const mvX = useMotionValue(x);
  const mvY = useMotionValue(y);

  useEffect(() => {
    mvX.set(x);
    mvY.set(y);
  }, [x, y, mvX, mvY]);

  const handleDragEnd = () => {
    onUpdate(id, { x: mvX.get(), y: mvY.get() });
  };

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
        drag={isSchemaMode}
        dragControls={dragControls}
        dragListener={!isEditing && isSchemaMode}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          if (!isSchemaMode) return;
          onSelect();
          setShowMenu(!showMenu);
          setShowColorPalette(false);
        }}
      >
        <div
          className={`w-full h-full rounded-2xl border-2 flex items-center justify-center p-3 transition-all shadow-lg ${
            isSelected ? 'border-white ring-4 ring-[#8e44ad]/30' : 'border-transparent'
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
};

export default SchemaNodeComponent;
