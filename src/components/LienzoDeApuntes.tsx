import React, { useState } from 'react';
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

const LienzoDeApuntes: React.FC<LienzoDeApuntesProps> = ({ title, color, gradient, onBack }) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showIconsPanel, setShowIconsPanel] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>('T');

  const handleAction = (action: string) => {
    console.log(`${action} clicado`);
    if (action === 'Texto') {
      setShowTextMenu(!showTextMenu);
      if (showTextMenu) {
        setShowStylePanel(false);
        setShowIconsPanel(false);
      }
    } else {
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
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
      <div className="lienzo-content">
        {/* Aquí se integraría la lógica de dibujo */}
      </div>

      {/* Barra de Herramientas (Segmento inferior con botones negros) */}
      <div className="frame">
        {showIconsPanel && (
          <div className="div-3">
            <div className="icons-grid">
              <span className="vector-4"><Activity size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-5"><ArrowUp size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-6"><ArrowDown size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-7"><ArrowRight size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-8"><ArrowLeft size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-9"><Hexagon size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-10"><MessageSquare size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-11"><MessageCircle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-12"><Calendar size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-13"><CalendarCheck size={18} color="white" strokeWidth={1.5} /></span>

              <span className="vector-14"><Brain size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-15"><BrainCircuit size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-16"><User size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-17"><Crown size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-18"><Ghost size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-19"><Castle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-20"><CircleUser size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-21"><GraduationCap size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-22"><Cherry size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-23"><ArrowLeftCircle size={18} color="white" strokeWidth={1.5} /></span>

              <span className="vector-24"><ArrowUpCircle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-25"><ArrowDownCircle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-26"><ArrowRightCircle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-27"><Clock size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-28"><Star size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-29"><FlaskConicalOff size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-30"><Heart size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-31"><HeartCrack size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-32"><Box size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-33"><Zap size={18} color="white" strokeWidth={1.5} /></span>

              <span className="vector-34"><Columns size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-35"><AlertOctagon size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-36"><Circle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-37"><Octagon size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-38"><Leaf size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-39"><Triangle size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-40"><Radiation size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-41"><Skull size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-42"><Sword size={18} color="white" strokeWidth={1.5} /></span>
              <span className="vector-43"><TestTube size={18} color="white" strokeWidth={1.5} /></span>

              <span className="vector-44"><Zap size={14} color="white" strokeWidth={1.5} /></span>
            </div>
          </div>
        )}
        {showStylePanel && (
          <div className="div-2">
            <button className="ellipse-yellow" title="Amarillo"></button>
            <button className="ellipse-green" title="Verde"></button>
            <button className="ellipse-2-instance" title="Morado"></button>
            <button className="ellipse-3" title="Rosa"></button>
            <button className="ellipse-4" title="Cian"></button>
            <button className="ellipse-5" title="Rojo"></button>
            <div className="style-panel-tail"></div>
          </div>
        )}
        {showTextMenu ? (
          <div className="div-4">
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
              className={activeProperty === 'A_under' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('A_under');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <span className="text-wrapper" style={{ textDecoration: 'underline' }}>A</span>
            </button>
            <button 
              className={activeProperty === 'AA' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('AA');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <span className="text-wrapper" style={{ fontSize: '16px', letterSpacing: '-1px', fontWeight: 700 }}>AA</span>
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
              className={activeProperty === 'Marker' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('Marker');
                setShowStylePanel(!showStylePanel);
                setShowIconsPanel(false);
              }}
            >
              <Highlighter 
                size={20} 
                color={activeProperty === 'Marker' ? '#fce00b' : 'white'} 
                fill={activeProperty === 'Marker' ? '#fce00b' : 'none'}
                fillOpacity={activeProperty === 'Marker' ? 0.3 : 0}
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
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <AlignLeft size={20} color={activeProperty === 'AlignLeft' ? '#fce00b' : 'white'} strokeWidth={1.5} />
            </button>
            <button 
              className={activeProperty === 'AlignJustify' ? 'propiedad-activada' : 'propiedad'}
              onClick={() => {
                setActiveProperty('AlignJustify');
                setShowStylePanel(false);
                setShowIconsPanel(false);
              }}
            >
              <div className="flex flex-col gap-[2px] items-center">
                <div className={`w-4 h-[1.5px] ${activeProperty === 'AlignJustify' ? 'bg-[#fce00b]' : 'bg-white'}`}></div>
                <div className={`w-3 h-[1.5px] ${activeProperty === 'AlignJustify' ? 'bg-[#fce00b]' : 'bg-white'}`}></div>
                <div className={`w-4 h-[1.5px] ${activeProperty === 'AlignJustify' ? 'bg-[#fce00b]' : 'bg-white'}`}></div>
                <div className={`w-3 h-[1.5px] ${activeProperty === 'AlignJustify' ? 'bg-[#fce00b]' : 'bg-white'}`}></div>
              </div>
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
          <div className="barra-de-botones">
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Texto')} title="Texto">
              <span className="icon-instance-node"><Type size={20} /></span>
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
            <button className="BOTON-DE-INSERTAR" onClick={() => handleAction('Forma')} title="Forma">
              <span className="icon-instance-node"><Diamond size={20} /></span>
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
