import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, useMotionValue, useDragControls, MotionConfig } from 'motion/react';
import { GripVertical } from 'lucide-react';

interface Hotspot {
  id: string;
  position: string;
  normal: string;
  title: string;
}

interface Model3DProps {
  id: string;
  x: number;
  y: number;
  scale: number;
  src: string;
  hotspots?: Hotspot[];
  isSelected: boolean;
  isMultiSelected: boolean;
  isSelectionMode: boolean;
  isHandMode: boolean;
  onSelect: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onGroupDrag: (id: string, delta: { x: number, y: number }) => void;
  onGroupDragEnd: () => void;
  canvasScale: number;
}

const Model3DComponent: React.FC<Model3DProps> = memo(({
  id,
  x,
  y,
  scale,
  src,
  hotspots = [],
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
  const [isDefined, setIsDefined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const modelViewerRef = useRef<any>(null);

  const handleModelClick = (event: any) => {
    if (!isSelected || isHandMode || isSelectionMode) return;
    
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const rect = viewer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const hit = viewer.positionAndNormalFromPoint(x, y);
    if (hit) {
      const newHotspot: Hotspot = {
        id: `hs-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        position: `${hit.position.x} ${hit.position.y} ${hit.position.z}`,
        normal: `${hit.normal.x} ${hit.normal.y} ${hit.normal.z}`,
        title: 'Nueva nota'
      };
      
      const updatedHotspots = [...hotspots, newHotspot];
      onUpdate(id, { hotspots: updatedHotspots });
      setActiveHotspotId(newHotspot.id);
    }
  };

  const updateHotspotTitle = (hsId: string, newTitle: string) => {
    const updatedHotspots = hotspots.map(hs => 
      hs.id === hsId ? { ...hs, title: newTitle } : hs
    );
    onUpdate(id, { hotspots: updatedHotspots });
  };

  const removeHotspot = (hsId: string) => {
    const updatedHotspots = hotspots.filter(hs => hs.id !== hsId);
    onUpdate(id, { hotspots: updatedHotspots });
    if (activeHotspotId === hsId) setActiveHotspotId(null);
  };

  useEffect(() => {
    console.log("Model3DComponent mounted with src:", src);
    
    const checkDefined = () => {
      if (customElements.get('model-viewer')) {
        setIsDefined(true);
      } else {
        // Try to wait a bit more
        const timer = setTimeout(() => {
          if (customElements.get('model-viewer')) {
            setIsDefined(true);
          } else {
            console.warn("model-viewer still not defined after timeout");
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    };
    checkDefined();
  }, [src]);

  const ModelViewer = 'model-viewer' as any;
  const dragControls = useDragControls();
  const [isResizing, setIsResizing] = useState(false);
  
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

  const handleDragEnd = () => {
    const finalX = mvX.get();
    const finalY = mvY.get();
    lastSentValues.current = { ...lastSentValues.current, x: finalX, y: finalY };
    onUpdate(id, { x: finalX, y: finalY });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isResizing || isHandMode) return;

    if (isSelectionMode) {
      if (isMultiSelected) {
        dragControls.start(e);
      } else {
        onToggleMultiSelect(id);
      }
      return;
    }

    if (!isSelected && !isMultiSelected) {
      onSelect(id);
    }
    
    // We only start drag if clicking the handle or if in selection mode
    // But the user requested a specific handle for movement to avoid conflict with rotation
    // In selection mode, we might want to allow dragging the whole thing? 
    // The prompt says: "Para mover el modelo... debe arrastrar desde un pequeño 'controlador de agarre' (handle)"
  };

  const handleResize = (e: any, info: any) => {
    const deltaX = info.delta.x;
    const currentScale = mvScale.get();
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
        className={`contenedor-3d-medico ${isSelected || isMultiSelected ? 'cuadro-seleccionado' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x: mvX,
          y: mvY,
          scale: mvScale,
          zIndex: isSelected ? 1000 : 60,
          touchAction: 'none',
          pointerEvents: isHandMode ? 'none' : 'auto',
          border: isSelected ? '2px solid #FFD105' : '1px dashed rgba(0,0,0,0.1)',
          borderRadius: '12px',
          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.02)',
          width: '300px',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        drag={(isSelectionMode || isSelected) && !isHandMode}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0}
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
      >
        {/* Drag Handle */}
        <div 
          onPointerDown={(e) => {
            e.stopPropagation();
            if (!isSelected && !isMultiSelected) onSelect(id);
            dragControls.start(e);
          }}
          className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full flex items-center justify-center cursor-move z-[60] shadow-sm hover:bg-white transition-colors"
          title="Arrastrar modelo"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>

        <div 
          className="w-full h-full overflow-hidden rounded-lg relative bg-gray-50 flex items-center justify-center"
          onPointerDown={(e) => e.stopPropagation()} // Let model-viewer handle rotation
        >
          {!isDefined ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="w-8 h-8 border-4 border-[#FFD105] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500 font-medium">Iniciando Motor 3D...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <span className="text-xs text-red-500 font-medium">Error al cargar modelo</span>
              <button 
                onClick={() => setError(null)}
                className="text-[10px] bg-gray-200 px-2 py-1 rounded"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <ModelViewer
              ref={modelViewerRef}
              src={src}
              camera-controls
              auto-rotate
              touch-action="pan-y"
              shadow-intensity="1"
              loading="eager"
              reveal="auto"
              alt="Modelo Médico 3D"
              onClick={handleModelClick}
              onError={() => {
                console.error("Model viewer error for src:", src);
                setError("No se pudo cargar el archivo 3D");
              }}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                backgroundColor: 'transparent',
                '--poster-color': 'transparent',
              }}
            >
              {hotspots.map((hs) => (
                <button
                  key={hs.id}
                  slot={`hotspot-${hs.id}`}
                  data-position={hs.position}
                  data-normal={hs.normal}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspotId(activeHotspotId === hs.id ? null : hs.id);
                  }}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#FFD105',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'transform 0.2s'
                  }}
                >
                  {activeHotspotId === hs.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'white',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        width: '160px',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <input
                        autoFocus
                        value={hs.title}
                        onChange={(e) => updateHotspotTitle(hs.id, e.target.value)}
                        placeholder="Título de la nota..."
                        style={{
                          border: 'none',
                          outline: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          width: '100%',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      />
                      <button 
                        onClick={() => removeHotspot(hs.id)}
                        style={{
                          alignSelf: 'flex-end',
                          fontSize: '10px',
                          color: '#ff4444',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </button>
              ))}
              <div slot="poster" className="absolute inset-0 flex items-center justify-center bg-gray-100/50 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#FFD105] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-500 font-medium">Cargando Modelo...</span>
                </div>
              </div>
            </ModelViewer>
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

export default Model3DComponent;
