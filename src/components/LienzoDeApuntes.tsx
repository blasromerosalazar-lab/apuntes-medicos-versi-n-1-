import React, { useState, useEffect, useRef } from 'react';
import TextBoxComponent from './TextBoxComponent';
import { 
  Type, 
  Trash2, 
  ChevronLeft, 
  Image, 
  Crop, 
  ArrowUpRight, 
  Target, 
  Eraser, 
  Diamond, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Clipboard,
  BookText,
  Highlighter,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Hexagon,
  MessageSquare,
  MessageCircle,
  Calendar,
  CalendarCheck,
  Brain,
  BrainCircuit,
  User,
  Crown,
  Ghost,
  Castle,
  CircleUser,
  GraduationCap,
  Cherry,
  ArrowLeftCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  Clock,
  Star,
  FlaskConicalOff,
  Heart,
  HeartCrack,
  Box,
  Zap,
  Columns,
  AlertOctagon,
  Circle,
  Octagon,
  Leaf,
  Triangle,
  Radiation,
  Skull,
  Sword,
  TestTube
} from 'lucide-react';

interface LienzoDeApuntesProps {
  title: string;
  color: string;
  gradient: string;
  onBack: () => void;
}

interface TextBox {
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
}

const LienzoDeApuntes: React.FC<LienzoDeApuntesProps> = ({ title, color, gradient, onBack }) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showIconsPanel, setShowIconsPanel] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>('T');
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [currentFontSize, setCurrentFontSize] = useState(18);
  const [showFontSizePanel, setShowFontSizePanel] = useState(false);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  
  // Infinite Canvas State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction Refs
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number, y: number } | null>(null);
  const wasDragging = useRef(false);

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setScale(1);
  };

  const addTextBox = (clickX?: number, clickY?: number) => {
    const newBox: TextBox = {
      id: Date.now().toString(),
      text: '',
      // Adjust coordinates based on current pan and scale
      x: clickX !== undefined ? (clickX - pan.x) / scale - 100 : (window.innerWidth / 2 - pan.x) / scale - 100,
      y: clickY !== undefined ? (clickY - pan.y) / scale - 50 : (window.innerHeight / 2 - pan.y) / scale - 50,
      width: 200,
      height: 100,
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      backgroundColor: 'transparent',
    };
    setTextBoxes(prev => [...prev, newBox]);
    setSelectedBoxId(newBox.id);
  };

  const updateTextBox = (id: string, updates: any) => {
    setTextBoxes(prev => prev.map(box => box.id === id ? { ...box, ...updates } : box));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (wasDragging.current) return;
    
    if (showTextMenu) {
      // Get coordinates relative to the canvas container
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addTextBox(x, y);
      }
    } else {
      setSelectedBoxId(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // If clicking on the background (container itself) or using middle mouse button
    const isBackground = e.target === e.currentTarget;
    const isMiddleButton = e.button === 1;
    const isNavigationMode = !showTextMenu && !selectedBoxId;

    if (activePointers.current.size === 1) {
      wasDragging.current = false;
      if (isBackground || isMiddleButton || isNavigationMode) {
        setIsPanning(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    } else if (activePointers.current.size === 2) {
      setIsPanning(true);
      wasDragging.current = true;
      const points = Array.from(activePointers.current.values()) as { x: number, y: number }[];
      lastPinchDist.current = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      lastPinchMid.current = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;

    const prevPos = activePointers.current.get(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && prevPos) {
      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        wasDragging.current = true;
      }

      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    } else if (activePointers.current.size === 2 && lastPinchDist.current && lastPinchMid.current) {
      const points = Array.from(activePointers.current.values()) as { x: number, y: number }[];
      const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const midX = (points[0].x + points[1].x) / 2;
      const midY = (points[0].y + points[1].y) / 2;

      const currentDist = lastPinchDist.current;
      const currentMid = lastPinchMid.current;

      if (currentDist && currentMid) {
        const factor = dist / currentDist;
        const newScale = Math.min(Math.max(scale * factor, 0.1), 5);

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const mx = midX - rect.left;
          const my = midY - rect.top;

          setPan(prev => ({
            x: mx - (mx - prev.x) * (newScale / scale) + (midX - currentMid.x),
            y: my - (my - prev.y) * (newScale / scale) + (midY - currentMid.y)
          }));
          setScale(newScale);
        }
      }

      lastPinchDist.current = dist;
      lastPinchMid.current = { x: midX, y: midY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      lastPinchDist.current = null;
      lastPinchMid.current = null;
    }
    if (activePointers.current.size === 0) {
      setIsPanning(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore capture errors
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomSpeed = 0.001;
      const factor = Math.exp(-e.deltaY * zoomSpeed);
      const newScale = Math.min(Math.max(scale * factor, 0.1), 5);
      
      setPan(prev => ({
        x: mx - (mx - prev.x) * (newScale / scale),
        y: my - (my - prev.y) * (newScale / scale)
      }));
      setScale(newScale);
    } else {
      // Pan with wheel
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const applyPropertyToSelected = (prop: string, value: any) => {
    if (selectedBoxId) {
      updateTextBox(selectedBoxId, { [prop]: value });
    }
  };

  const toggleProperty = (prop: string, valueOn: any, valueOff: any) => {
    if (selectedBoxId) {
      const box = textBoxes.find(b => b.id === selectedBoxId);
      if (box) {
        const currentValue = (box as any)[prop];
        const newValue = currentValue === valueOn ? valueOff : valueOn;
        updateTextBox(selectedBoxId, { [prop]: newValue });
        
        // Update textStyle state
        if (prop === 'fontWeight') {
          setTextStyle(prev => ({ ...prev, bold: newValue === 'bold' }));
        } else if (prop === 'fontStyle') {
          setTextStyle(prev => ({ ...prev, italic: newValue === 'italic' }));
        } else if (prop === 'textDecoration') {
          setTextStyle(prev => ({ ...prev, underline: newValue === 'underline' }));
        }
      }
    }
  };

  // Update textStyle when selected box changes
  useEffect(() => {
    if (selectedBoxId) {
      const box = textBoxes.find(b => b.id === selectedBoxId);
      if (box) {
        setTextStyle({
          bold: box.fontWeight === 'bold',
          italic: box.fontStyle === 'italic',
          underline: box.textDecoration === 'underline'
        });
        setCurrentFontSize(box.fontSize);
      }
    } else {
      setTextStyle({ bold: false, italic: false, underline: false });
    }
  }, [selectedBoxId, textBoxes]);

  const FONT_SIZES = Array.from({ length: 35 }, (_, i) => 12 + i * 2);

  const fontSizePanelRef = useRef<HTMLDivElement>(null);
  const isDraggingFontSize = useRef(false);
  const startXFontSize = useRef(0);
  const scrollLeftFontSize = useRef(0);

  const handleFontSizeMouseDown = (e: React.MouseEvent) => {
    if (!fontSizePanelRef.current) return;
    isDraggingFontSize.current = true;
    startXFontSize.current = e.pageX - fontSizePanelRef.current.offsetLeft;
    scrollLeftFontSize.current = fontSizePanelRef.current.scrollLeft;
  };

  const handleFontSizeMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFontSize.current || !fontSizePanelRef.current) return;
    e.preventDefault();
    const x = e.pageX - fontSizePanelRef.current.offsetLeft;
    const walk = (x - startXFontSize.current) * 2;
    fontSizePanelRef.current.scrollLeft = scrollLeftFontSize.current - walk;
  };

  const handleFontSizeMouseUp = () => {
    isDraggingFontSize.current = false;
  };

  const handleFontSizeKeyDown = (e: React.KeyboardEvent) => {
    if (!fontSizePanelRef.current) return;
    if (e.key === 'ArrowRight') {
      fontSizePanelRef.current.scrollLeft += 40;
    } else if (e.key === 'ArrowLeft') {
      fontSizePanelRef.current.scrollLeft -= 40;
    }
  };

  const handleAction = (action: string) => {
    console.log(`${action} clicado`);
    if (action === 'Texto') {
      const nextShowTextMenu = !showTextMenu;
      setShowTextMenu(nextShowTextMenu);
      
      if (nextShowTextMenu) {
        // We don't add a box immediately anymore, the user clicks to place it
        setShowStylePanel(false);
        setShowIconsPanel(false);
        setShowFontSizePanel(false);
      } else {
        setIsHighlighterActive(false);
      }
    } else if (action === 'Forma') {
      setShowIconsPanel(!showIconsPanel);
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowFontSizePanel(false);
    } else {
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
    }
  };

  return (
    <div className="lienzo-de-med" style={{ 
      '--subject-color': color,
      '--subject-color-light': `${color}cc`
    } as React.CSSProperties}>
      {/* Barra Superior (Rectangle con borde degradado) */}
      <div className="rectangle"></div>
      
      {/* Badge de Título (Segmento superior izquierdo) */}
      <div className="div" style={{ background: gradient }}>
        <div 
          className="relative flex items-center justify-center p-2 rounded-xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] mr-1 group cursor-pointer border border-white/50" 
          onClick={onBack}
        >
          <Diamond 
            className="group-hover:scale-110 transition-transform relative z-10" 
            style={{ 
              color: color, 
              fill: color,
              filter: `drop-shadow(0 0 12px ${color}) brightness(1.4)`
            }}
            size={22} 
          />
        </div>
        <div className="carbohidratos ml-2" style={{ color: 'white' }}>
          {title}
        </div>
      </div>

      {/* Contenido del Lienzo (Área de trabajo) */}
      <div 
        ref={containerRef}
        className="lienzo-content" 
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isPanning ? 'grabbing' : isHighlighterActive ? 'crosshair' : showTextMenu ? 'text' : 'default',
          overflow: 'hidden',
          touchAction: 'none',
          backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundColor: '#ffffff'
        }}
      >
        <div 
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'relative',
            pointerEvents: isPanning ? 'none' : 'auto',
            willChange: 'transform'
          }}
        >
          {textBoxes.map((box) => (
            <TextBoxComponent
              key={box.id}
              {...box}
              isSelected={selectedBoxId === box.id}
              canEdit={showTextMenu}
              onSelect={() => setSelectedBoxId(box.id)}
              onUpdate={updateTextBox}
              canvasScale={scale}
            />
          ))}
        </div>

        {/* Zoom & Reset Controls */}
        <div className="absolute top-24 right-6 flex flex-col gap-2 z-50">
          <button 
            onClick={resetView}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
            title="Resetear vista"
          >
            <Target className="w-5 h-5 text-gray-600" />
          </button>
          <div className="bg-white px-3 py-1 border border-gray-200 rounded-full shadow-md text-xs font-medium text-gray-500">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>

      {/* Barra de Herramientas (Segmento inferior con botones negros) */}
      <div className="frame">
        {showIconsPanel && (
          <div className="div-4" style={{ marginBottom: '20px' }}>
            <div className="icons-grid" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
              {[
                { id: 'vector-4', icon: <Activity size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-5', icon: <ArrowUp size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-6', icon: <ArrowDown size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-7', icon: <ArrowRight size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-8', icon: <ArrowLeft size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-9', icon: <Hexagon size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-10', icon: <MessageSquare size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-11', icon: <MessageCircle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-12', icon: <Calendar size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-13', icon: <CalendarCheck size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-14', icon: <Brain size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-15', icon: <BrainCircuit size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-16', icon: <User size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-17', icon: <Crown size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-18', icon: <Ghost size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-19', icon: <Castle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-20', icon: <CircleUser size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-21', icon: <GraduationCap size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-22', icon: <Cherry size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-23', icon: <ArrowLeftCircle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-24', icon: <ArrowUpCircle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-25', icon: <ArrowDownCircle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-26', icon: <ArrowRightCircle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-27', icon: <Clock size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-28', icon: <Star size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-29', icon: <FlaskConicalOff size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-30', icon: <Heart size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-31', icon: <HeartCrack size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-32', icon: <Box size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-33', icon: <Zap size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-34', icon: <Columns size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-35', icon: <AlertOctagon size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-36', icon: <Circle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-37', icon: <Octagon size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-38', icon: <Leaf size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-39', icon: <Triangle size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-40', icon: <Radiation size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-41', icon: <Skull size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-42', icon: <Sword size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-43', icon: <TestTube size={18} color="white" strokeWidth={1.5} /> },
                { id: 'vector-44', icon: <Zap size={14} color="white" strokeWidth={1.5} /> },
              ].map((item) => (
                <span 
                  key={item.id} 
                  className={`${item.id} ${activeShape === item.id ? 'propiedad-activada' : ''}`}
                  style={activeShape === item.id ? { border: '1px solid #fce00b' } : {}}
                  onClick={() => {
                    setActiveShape(item.id);
                    setShowIconsPanel(false);
                    console.log(`Forma seleccionada: ${item.id}`);
                  }}
                >
                  {item.icon}
                </span>
              ))}
            </div>
          </div>
        )}
        {showStylePanel && (
          <div className="div-2">
            <button className="ellipse-yellow" title="Amarillo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#fce00b')}></button>
            <button className="ellipse-green" title="Verde" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#00ff00')}></button>
            <button className="ellipse-2-instance" title="Morado" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#7500c9')}></button>
            <button className="ellipse-3" title="Rosa" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#fe19fa')}></button>
            <button className="ellipse-4" title="Cian" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#0bf5e6')}></button>
            <button className="ellipse-5" title="Rojo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#ff2c2c')}></button>
            <div className="style-panel-tail"></div>
          </div>
        )}
        {showFontSizePanel && (
          <div 
            ref={fontSizePanelRef}
            className="div-2" 
            tabIndex={0}
            style={{ 
              minWidth: '320px', 
              maxWidth: '420px',
              overflowX: 'auto', 
              whiteSpace: 'nowrap', 
              padding: '0 120px', // Slightly reduced padding for better density
              scrollbarWidth: 'none',
              cursor: isDraggingFontSize.current ? 'grabbing' : 'grab',
              outline: 'none',
              scrollSnapType: 'x mandatory',
              display: 'flex',
              alignItems: 'center',
              left: '50%',
              transform: 'translateX(-197px)'
            }}
            onMouseDown={handleFontSizeMouseDown}
            onMouseMove={handleFontSizeMouseMove}
            onMouseUp={handleFontSizeMouseUp}
            onMouseLeave={handleFontSizeMouseUp}
            onKeyDown={handleFontSizeKeyDown}
          >
            <div className="flex items-center gap-4 h-full">
              {FONT_SIZES.map((size) => (
                <button 
                  key={size}
                  className="boton-de-elegir-tamano"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    minWidth: '44px', 
                    height: '44px',
                    scrollSnapAlign: 'center'
                  }}
                  onClick={() => {
                    setCurrentFontSize(size);
                    applyPropertyToSelected('fontSize', size);
                    // Center the clicked item
                    if (fontSizePanelRef.current) {
                      const button = fontSizePanelRef.current.querySelector(`button:nth-child(${FONT_SIZES.indexOf(size) + 1})`) as HTMLElement;
                      if (button) {
                        fontSizePanelRef.current.scrollTo({
                          left: button.offsetLeft - fontSizePanelRef.current.offsetWidth / 2 + button.offsetWidth / 2,
                          behavior: 'smooth'
                        });
                      }
                    }
                  }}
                >
                  <span className={currentFontSize === size ? 'text-wrapper text-2xl scale-125 transition-transform' : 'text-white font-poppins text-base opacity-40 hover:opacity-100 transition-opacity'}>
                    {size}
                  </span>
                </button>
              ))}
            </div>
            {/* Center Indicator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#fce00b]/20 -translate-x-1/2 pointer-events-none"></div>
            <div className="style-panel-tail" style={{ left: '23px', transform: 'translateX(-50%)' }}></div>
          </div>
        )}
        {showTextMenu ? (
          <div className="div-4" style={{ marginBottom: '-19px' }}>
            <button 
              className={activeProperty === 'T' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('T');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <span className="text-wrapper">T</span>
            </button>
            <button className="propiedad" onClick={() => setShowTextMenu(false)}>
              <span className="text-wrapper">&lt;</span>
            </button>
            <button 
              className={textStyle.underline ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                toggleProperty('textDecoration', 'underline', 'none');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <span className="text-wrapper" style={{ textDecoration: 'underline' }}>A</span>
            </button>
            <button 
              className={showFontSizePanel ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setShowFontSizePanel(!showFontSizePanel);
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <span className="text-wrapper" style={{ fontSize: '16px', letterSpacing: '-1px', fontWeight: 700 }}>AA</span>
            </button>
            <button 
              className={textStyle.bold ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                toggleProperty('fontWeight', 'bold', 'normal');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <Bold size={20} color={textStyle.bold ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={textStyle.italic ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                toggleProperty('fontStyle', 'italic', 'normal');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <Italic size={20} color={textStyle.italic ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={activeProperty === 'Book' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('Book');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <div className="relative flex items-center justify-center">
                <BookText 
                  size={20} 
                  color={activeProperty === 'Book' ? '#fce00b' : 'white'} 
                  fill={activeProperty === 'Book' ? '#fce00b' : 'none'}
                  fillOpacity={activeProperty === 'Book' ? 0.3 : 0}
                  strokeWidth={1.5} 
                />
                <span className={`absolute text-[8px] font-bold top-[5px] ${activeProperty === 'Book' ? 'text-[#fce00b]' : 'text-white'}`}>A</span>
              </div>
            </button>
            <button 
              className={`boton-de-marcador-2 ${isHighlighterActive ? 'propiedad-activado' : 'propiedad'}`}
              onClick={() => {
                const nextState = !isHighlighterActive;
                setIsHighlighterActive(nextState);
                setShowStylePanel(nextState);
                setShowIconsPanel(false);
                setShowFontSizePanel(false);
              }}
            >
              <Highlighter 
                size={20} 
                color={isHighlighterActive ? '#fce00b' : 'white'} 
                fill={isHighlighterActive ? '#fce00b' : 'none'}
                fillOpacity={isHighlighterActive ? 0.3 : 0}
                strokeWidth={1.5} 
              />
            </button>
            <button 
              className={activeProperty === 'Diamond' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('Diamond');
                setShowIconsPanel(!showIconsPanel);
                setShowStylePanel(false);
              }}
            >
              <Diamond 
                size={20} 
                color={activeProperty === 'Diamond' ? '#fce00b' : 'white'} 
                fill={activeProperty === 'Diamond' ? '#fce00b' : 'none'}
                fillOpacity={activeProperty === 'Diamond' ? 0.3 : 0}
                strokeWidth={1.5} 
              />
            </button>
            <button 
              className={activeProperty === 'AlignLeft' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('AlignLeft');
                applyPropertyToSelected('textAlign', 'left');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <AlignLeft size={20} color={activeProperty === 'AlignLeft' ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={activeProperty === 'AlignCenter' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('AlignCenter');
                applyPropertyToSelected('textAlign', 'center');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <AlignCenter size={20} color={activeProperty === 'AlignCenter' ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={activeProperty === 'AlignRight' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('AlignRight');
                applyPropertyToSelected('textAlign', 'right');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <AlignRight size={20} color={activeProperty === 'AlignRight' ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={activeProperty === 'Clipboard' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('Clipboard');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <Clipboard 
                size={20} 
                color={activeProperty === 'Clipboard' ? '#fce00b' : 'white'} 
                fill={activeProperty === 'Clipboard' ? '#fce00b' : 'none'}
                fillOpacity={activeProperty === 'Clipboard' ? 0.3 : 0}
                strokeWidth={1.5} 
              />
            </button>
          </div>
        ) : (
          <div className="barra-de-botones" style={{ marginLeft: '0px' }}>
            <button 
              className={`BOTON-DE-INSERTAR ${showTextMenu ? 'bg-[#d9b000]/20 border-[#d9b000]' : ''}`} 
              onClick={() => handleAction('Texto')} 
              title="Texto"
              style={showTextMenu ? { borderColor: '#d9b000', borderWidth: '1px' } : {}}
            >
              <span className="icon-instance-node">
                <Type size={20} color={showTextMenu ? '#d9b000' : 'currentColor'} />
              </span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Selección')} title="Selección">
              <span className="icon-instance-node"><Crop size={20} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Flecha')} title="Flecha">
              <span className="icon-instance-node"><ArrowUpRight size={20} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Imagen')} title="Imagen">
              <span className="icon-instance-node"><Image size={20} /></span>
            </button>
            <button className="boton-de-eliminar" onClick={() => handleAction('Eliminar')} title="Eliminar">
              <span className="icon-instance-node"><Trash2 size={20} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Objetivo')} title="Objetivo">
              <span className="icon-instance-node"><Target size={20} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Borrador')} title="Borrador">
              <span className="icon-instance-node"><Eraser size={20} /></span>
            </button>
            <button className={`BOTON-DE-INSERTAR anadir-formas-2 ${showIconsPanel ? 'bg-[#d9b000]/20 border-[#d9b000]' : ''}`} onClick={() => handleAction('Forma')} title="Forma">
              <span className="icon-instance-node"><Diamond size={20} color={showIconsPanel ? '#d9b000' : 'currentColor'} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Deshacer')} title="Deshacer">
              <span className="icon-instance-node"><Undo size={20} /></span>
            </button>
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Rehacer')} title="Rehacer">
              <span className="icon-instance-node"><Redo size={20} /></span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LienzoDeApuntes;
