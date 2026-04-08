import React from 'react';
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
  Redo 
} from 'lucide-react';

interface LienzoDeApuntesProps {
  title: string;
  color: string;
  gradient: string;
  onBack: () => void;
}

const LienzoDeApuntes: React.FC<LienzoDeApuntesProps> = ({ title, color, gradient, onBack }) => {
  const handleAction = (action: string) => {
    console.log(`${action} clicado`);
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
          className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-white via-white to-white/90 shadow-[0_0_25px_rgba(255,255,255,0.6)] mr-1 group cursor-pointer border border-white/60 overflow-hidden" 
          onClick={onBack}
        >
          {/* Highlight Gradient for the prism */}
          <div 
            className="absolute inset-0 opacity-40 blur-md group-hover:opacity-60 transition-opacity"
            style={{ 
              background: `radial-gradient(circle at center, ${color}, transparent 70%)` 
            }}
          />
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
    </div>
  );
};

export default LienzoDeApuntes;
