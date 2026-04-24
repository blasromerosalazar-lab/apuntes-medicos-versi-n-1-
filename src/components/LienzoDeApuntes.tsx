import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, useDragControls, AnimatePresence } from 'motion/react';
import TextBoxComponent from './TextBoxComponent';
import CanvasImageComponent from './CanvasImageComponent';
import LottieComponent from './LottieComponent';
import Model3DComponent from './Model3DComponent';
import SchemaNodeComponent from './SchemaNodeComponent';
import CanvasShapeComponent from './CanvasShapeComponent';
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
  Hand,
  Plus,
  Minus,
  Sparkles,
  ListTodo,
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
  ArrowLeftRight,
  Spline,
  Palette,
  Move,
  MousePointer2,
  Edit2,
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
  ChevronRight,
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
  TestTube,
  X,
  Send,
  Loader2,
  BoxSelect,
  Network,
  MoreVertical,
  FileText,
  FileUp,
  Mic,
  Camera,
  Underline,
  Strikethrough,
  Check,
  Printer,
  FileDown,
  Layout,
  ChevronsUp,
  ChevronsDown,
  Square,
  PlusCircle,
  RectangleHorizontal,
  Pyramid,
  Cylinder,
  CircleDot,
  CheckSquare,
  Tag,
  AlertTriangle,
  Download
} from 'lucide-react';
import Markdown from 'react-markdown';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as fabric from 'fabric';

import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker with a more stable and direct link pattern
// Using .mjs extension which is required for modern PDF.js workers in ESM environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface LienzoDeApuntesProps {
  id: string;
  title: string;
  color: string;
  gradient: string;
  isViewOnly?: boolean;
  onBack: () => void;
}

import { GoogleGenAI } from "@google/genai";

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
  rotation?: number;
  zIndex?: number;
  sourcePage?: number;
}

interface LottieAnimation {
  id: string;
  x: number;
  y: number;
  scale: number;
  data: any;
  isPlaying: boolean;
  labels?: { start: number, end: number, text: string }[];
}

interface Hotspot {
  id: string;
  position: string;
  normal: string;
  title: string;
}

interface Model3DAnimation {
  id: string;
  x: number;
  y: number;
  scale: number;
  src: string;
  hotspots?: Hotspot[];
}

interface Drawing {
  id: string;
  points: { x: number, y: number }[];
  color: string;
  width: number;
  type: 'line' | 'arrow' | 'zigzag' | 'curve';
  showArrowHead?: boolean;
  showDoubleArrowHead?: boolean;
  isOrthogonal?: boolean;
}

interface CanvasShape {
  id: string;
  type: 'square' | 'rectangle' | 'circle' | 'triangle' | 'cube' | 'pyramid' | 'hexagon' | 'star' | 'cylinder' | 'sphere';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  borderColor: string;
  rotation: number;
}

interface SchemaNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isTracing?: boolean;
  parentId?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  schemaId?: string;
}

interface CanvasImageLabel {
  id: string;
  text: string;
  type: 'fixed' | 'interactive';
  color: string;
  anchorX: number; // 0-1 relative to image
  anchorY: number; // 0-1 relative to image
  labelX: number; // Absolute canvas X
  labelY: number; // Absolute canvas Y
  lineWidth: number;
  isOpen?: boolean;
  lineStyle?: 'solid' | 'dashed';
}

interface CanvasImage {
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
}

interface PDFAsset {
  id: string;
  type: 'text' | 'image';
  content: string; // text string or base64 image
  width: number;
  height: number;
  page: number;
}

interface LayoutAsset {
  id: string;
  type: 'text' | 'image' | 'drawing' | 'shape' | 'lottie' | 'model3d' | 'schema';
  thumbnail: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  pageIndex?: number;
  fontSize?: number;
  placed?: boolean;
  alignment?: 'left' | 'center' | 'justify';
  zIndex?: number;
  color?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  borderWidth?: number;
  borderColor?: string;
  shapeType?: string;
}

// --- Fabric.js Layout Implementation (High Performance Interaction) ---

interface FabricLayoutSheetProps {
  pageIndex: number;
  assets: LayoutAsset[];
  zoom: number;
  onUpdateAsset: (id: string, updates: Partial<LayoutAsset>) => void;
  onSelectAsset: (id: string | null) => void;
  selectedAssetId: string | null;
  onDeleteAsset: (id: string) => void;
  textBoxes: TextBox[];
  images: CanvasImage[];
  schemaNodes: SchemaNode[];
}

const FabricLayoutSheet: React.FC<FabricLayoutSheetProps> = ({ 
  pageIndex, 
  assets, 
  zoom, 
  onUpdateAsset, 
  onSelectAsset, 
  selectedAssetId,
  onDeleteAsset,
  textBoxes,
  images,
  schemaNodes
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const assetsMapRef = useRef<Map<string, fabric.Object>>(new Map());
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });

  // Derive active asset from props to ensure synchronization
  const activeAsset = assets.find(a => a.id === selectedAssetId) || null;

  // Initialization
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 595,
      height: 842,
      backgroundColor: '#fff',
      renderOnAddRemove: false, // Performance Optimization
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      selection: false, // Cleaner interaction for simple layout
    });

    // Custom Border Rendering Logic
    canvas.on('after:render', function() {
      const ctx = canvas.getContext();
      canvas.getObjects().forEach(obj => {
        const assetId = obj.get('data-id') as string;
        const asset = assets.find(a => a.id === assetId);
        
        if (asset && asset.borderWidth && asset.borderWidth > 0) {
          ctx.save();
          // Adjust for zoom and high-res if needed, but relative to canvas coords
          const bound = obj.getBoundingRect();
          
          ctx.strokeStyle = asset.borderColor || '#000000';
          ctx.lineWidth = asset.borderWidth;
          ctx.setLineDash([]); // Ensure solid line
          
          // Draw rectangle around the object boundary
          ctx.strokeRect(
            bound.left - asset.borderWidth/2, 
            bound.top - asset.borderWidth/2, 
            bound.width + asset.borderWidth, 
            bound.height + asset.borderWidth
          );
          ctx.restore();
        }
      });
    });

    // Custom Control Styling (Requested: 24px easy touch)
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#FFD105';
    fabric.Object.prototype.cornerStyle = 'rect';
    fabric.Object.prototype.cornerSize = 24;
    fabric.Object.prototype.borderColor = '#FFD105';
    fabric.Object.prototype.borderScaleFactor = 2;
    fabric.Object.prototype.padding = 6;

    fabricCanvasRef.current = canvas;

    // Events
    const updateToolbar = () => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const active = canvas.getActiveObject();
      if (active) {
        // Position toolbar above the object
        const bound = active.getBoundingRect();
        setToolbarPos({ x: bound.left + bound.width / 2, y: bound.top - 10 });
      }
    };

    canvas.on('selection:created', (e) => {
      onSelectAsset(e.selected[0]?.get('data-id') || null);
      updateToolbar();
    });
    canvas.on('selection:updated', (e) => {
      onSelectAsset(e.selected[0]?.get('data-id') || null);
      updateToolbar();
    });
    canvas.on('selection:cleared', () => {
      onSelectAsset(null);
    });

    canvas.on('object:moving', updateToolbar);
    canvas.on('object:scaling', updateToolbar);
    canvas.on('object:resizing', updateToolbar);

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      const id = obj.get('data-id');
      
      // "Bake" scaling for Textboxes (Reflow only on release as requested)
      if (obj instanceof fabric.Textbox) {
        const newWidth = (obj.width || 0) * (obj.scaleX || 1);
        obj.set({
          width: newWidth,
          scaleX: 1,
          scaleY: 1
        });
      }

      const finalW = (obj.width || 0) * (obj.scaleX || 1);
      const finalH = (obj.height || 0) * (obj.scaleY || 1);
      
      const mmX = (obj.left! / 595) * 210;
      const mmY = (obj.top! / 842) * 297;
      const mmW = (finalW / 595) * 210;
      const mmH = (finalH / 842) * 297;

      onUpdateAsset(id, { 
        x: mmX, 
        y: mmY, 
        width: mmW, 
        height: mmH,
        zIndex: obj.get('zIndex') || 10
      });
    });

    // High frequency render loop (60fps)
    let animationFrame: number;
    const render = () => {
      canvas.renderAll();
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      canvas.dispose();
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Sync Data to Fabric
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const currentIds = new Set(assets.map(a => a.id));
    
    // Clean deleted
    assetsMapRef.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        canvas.remove(obj);
        assetsMapRef.current.delete(id);
      }
    });

        // Add or Update
    assets.forEach(async (asset) => {
      let obj = assetsMapRef.current.get(asset.id);
      
      const left = (asset.x / 210) * 595;
      const top = (asset.y / 297) * 842;
      const width = (asset.width / 210) * 595;
      const height = (asset.height / 297) * 842;

      if (!obj) {
        if (asset.type === 'text') {
          const realText = textBoxes.find(t => t.id === asset.id.split('_')[0]);
          obj = new fabric.Textbox(realText?.text || '', {
            left, top, width,
            fontSize: asset.fontSize || 16,
            fontFamily: 'Inter',
            textAlign: asset.alignment || 'left',
            fontWeight: (asset.fontWeight || realText?.fontWeight || 'normal') as any,
            fill: asset.color || '#000000',
            lineHeight: 1.4,
            objectCaching: true,
            splitByGrapheme: true,
            hasBorders: true,
            hasControls: true,
            lockScalingFlip: true,
            padding: 5,
            cornerSize: 24,
            cornerColor: '#FFD105',
            cornerStyle: 'circle',
            borderColor: '#FFD105',
          });
        } else if (asset.type === 'image') {
          const realImg = images.find(i => i.id === asset.id.split('_')[0]);
          const src = realImg?.src || asset.thumbnail || '';
          try {
            const imgInstance = await fabric.FabricImage.fromURL(src, { crossOrigin: 'anonymous' });
            imgInstance.set({
               left, top, 
               scaleX: width / (imgInstance.width || 1),
               scaleY: height / (imgInstance.height || 1),
               objectCaching: true,
               hasBorders: true,
               hasControls: true,
               padding: 5,
               cornerSize: 24,
               cornerColor: '#FFD105',
               cornerStyle: 'circle',
               borderColor: '#FFD105',
               lockScalingFlip: true,
            });
            obj = imgInstance;
          } catch (e) {
            console.error("Fabric image load error", e);
            // Fallback placeholder for blank images
            obj = new fabric.Rect({
              left, top, width, height,
              fill: '#f0f0f0',
              stroke: '#ccc',
              strokeWidth: 1,
              strokeDashArray: [5, 5]
            });
          }
        } else if (asset.type === 'schema') {
           // Fallback if individual schema nodes are still used
           const realNodeId = asset.id.split('_')[0];
           const realNode = schemaNodes.find(n => n.id === realNodeId);
           obj = new fabric.Textbox(realNode?.text || '', {
             left, top, width,
             fontSize: 14,
             fontFamily: 'Inter',
             textAlign: realNode?.align || 'center',
             fontWeight: realNode?.bold ? 'bold' : 'normal',
             fontStyle: realNode?.italic ? 'italic' : 'normal',
             fill: '#ffffff',
             backgroundColor: realNode?.color || '#8e44ad',
             padding: 10,
             rx: 10,
             ry: 10,
             splitByGrapheme: true,
             hasBorders: true,
             hasControls: true,
             cornerSize: 24,
             cornerColor: '#FFD105',
             cornerStyle: 'circle',
             borderColor: '#FFD105',
             lockScalingFlip: true,
           });
        } else if (asset.type === 'shape') {
           const common = {
             left, top, width, height,
             fill: asset.color || '#FFD105',
             stroke: asset.borderColor || '#000000',
             strokeWidth: asset.borderWidth || 2,
             hasBorders: true,
             hasControls: true,
             padding: 5,
             cornerSize: 24,
             cornerColor: '#FFD105',
             cornerStyle: 'circle' as const,
             borderColor: '#FFD105',
             lockScalingFlip: true,
           };

           if (asset.shapeType === 'circle' || asset.shapeType === 'sphere') {
             obj = new fabric.Ellipse({
               ...common,
               rx: width / 2,
               ry: height / 2
             });
           } else if (asset.shapeType === 'triangle') {
             obj = new fabric.Triangle({
               ...common,
             });
           } else {
             obj = new fabric.Rect({
               ...common,
               rx: 4, ry: 4
             });
           }
        } else {
           // Fallback for other types
           obj = new fabric.Rect({
             left, top, width, height,
             fill: '#f0f0f0',
             stroke: '#ddd',
             objectCaching: true
           });
        }

        if (obj) {
          obj.set('data-id', asset.id);
          canvas.add(obj);
          assetsMapRef.current.set(asset.id, obj);
        }
      } else {
        // Update existing properties
        // We only skip left/top/width if NOT active to avoid feedback loops during manual transformation
        const isActive = canvas.getActiveObject() === obj;
        
        if (!isActive) {
          obj.set({ left, top });
          if (obj instanceof fabric.Textbox) {
            obj.set({ width });
          }
        }
        
        // Sync visual properties that aren't controlled by direct dragging/resizing
        if (obj instanceof fabric.Textbox) {
          obj.set({ 
            fontSize: asset.fontSize || 16, 
            textAlign: (asset.alignment as any) || 'left',
            fontWeight: (asset.fontWeight || 'normal') as any,
            fontStyle: asset.fontStyle || 'normal',
            fill: asset.color || '#000000'
          });
        }

        // Common styles (Borders/Frames)
        obj.set({
           strokeUniform: true // Very important: border keeps its size while scaling
        });

        if (obj instanceof fabric.FabricImage) {
          // Sync scale if not actively scaling
          if (!isActive) {
            obj.set({ 
              scaleX: width / (obj.width || 1), 
              scaleY: height / (obj.height || 1) 
            });
          }
        }

        obj.setCoords();
      }

      // Sync selection
      if (asset.id === selectedAssetId && canvas.getActiveObject() !== obj) {
        canvas.setActiveObject(obj!);
      }
    });

    // Draw connections between schema nodes IF both are on the same page
    const drawConnections = () => {
      // Logic for individual schema nodes connections (fallback)
      const pageSchemaAssets = assets.filter(a => a.type === 'schema');
      if (pageSchemaAssets.length === 0) return;
      
      const originalToInstance = new Map<string, string>();
      pageSchemaAssets.forEach(a => {
        const originalId = a.id.split('_')[0];
        originalToInstance.set(originalId, a.id);
      });

      pageSchemaAssets.forEach(asset => {
        const originalId = asset.id.split('_')[0];
        const originalNode = schemaNodes.find(n => n.id === originalId);
        if (!originalNode || !originalNode.parentId) return;

        // Check if parent is also on this page
        const parentInstanceId = originalToInstance.get(originalNode.parentId);
        if (parentInstanceId) {
          const parentAsset = pageSchemaAssets.find(a => a.id === parentInstanceId);
          if (!parentAsset) return;

          // Convert A4 mm coords to canvas pixels
          const x1 = (parentAsset.x + parentAsset.width / 2) * (595 / 210);
          const y1 = (parentAsset.y + parentAsset.height / 2) * (842 / 297);
          const x2 = (asset.x + asset.width / 2) * (595 / 210);
          const y2 = (asset.y + asset.height / 2) * (842 / 297);

          const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: originalNode.color || '#8e44ad',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            opacity: 0.6,
          });
          
          // We add connections to the bottom of the stack
          canvas.add(line);
          canvas.sendObjectToBack(line);
        }
      });
    };

    // We only want to draw connections after all objects are added
    // Clear old connections first (they won't have IDs or special markers, but we can tag them)
    canvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.Line && !obj.get('data-id')) {
        canvas.remove(obj);
      }
    });
    
    drawConnections();

    canvas.requestRenderAll();
  }, [assets, selectedAssetId, textBoxes, images, schemaNodes]);

  return (
    <div 
      ref={containerRef}
      className={`bg-white shadow-[0_60px_150px_rgba(0,0,0,0.5)] relative border-2 transform origin-top transition-all fabric-sheet-container ${onSelectAsset ? 'pointer-events-auto' : ''}`}
      style={{ 
        width: '595px', 
        height: '842px',
        minWidth: '595px',
        minHeight: '842px',
        scale: zoom,
        marginBottom: `${(zoom - 1) * 842}px`,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        touchAction: 'none' // Direct touch management
      }}
    >
      <canvas ref={canvasRef} />
      
      {/* Visual Overlays (Margins) */}
      <div className="absolute inset-8 border border-blue-500/5 pointer-events-none z-10" />
      <div className="absolute top-2 left-2 px-2 py-1 bg-[#8e44ad]/10 text-[#8e44ad] text-[10px] font-black rounded uppercase z-20">Pág {pageIndex + 1}</div>
    </div>
  );
};

const SHAPE_PALETTE = [
  { name: 'Amarillo', value: '#FFD105' },
  { name: 'Verde', value: '#00ff00' },
  { name: 'Morado', value: '#7500c9' },
  { name: 'Rosa', value: '#fe19fa' },
  { name: 'Cian', value: '#0bf5e6' },
  { name: 'Rojo', value: '#ff2c2c' },
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Negro', value: '#000000' },
];

let idCounter = 0;
const generateId = (prefix: string = '') => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `${prefix}${uuid}`;
};

const LienzoDeApuntes: React.FC<LienzoDeApuntesProps> = ({ id, title, color, gradient, isViewOnly = false, onBack }) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showIconsPanel, setShowIconsPanel] = useState(false);
  const [showCanvasShapesPanel, setShowCanvasShapesPanel] = useState(false);
  const [showLinesMenu, setShowLinesMenu] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showPendientes, setShowPendientes] = useState(false);
  const [showPDFPool, setShowPDFPool] = useState(false);
  const [pdfAssets, setPdfAssets] = useState<PDFAsset[]>([]);
  const [isPDFProcessing, setIsPDFProcessing] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [layoutAssets, setLayoutAssets] = useState<LayoutAsset[]>([]);
  const [inventoryAssets, setInventoryAssets] = useState<LayoutAsset[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [layoutNumPages, setLayoutNumPages] = useState(1);
  const [layoutZoom, setLayoutZoom] = useState(1);
  const [selectedLayoutAssetId, setSelectedLayoutAssetId] = useState<string | null>(null);
  const [selectedInventoryAssetId, setSelectedInventoryAssetId] = useState<string | null>(null);
  const [isLayoutAIProcessing, setIsLayoutAIProcessing] = useState(false);
  const [pdfToast, setPdfToast] = useState<{ show: boolean, message: string } | null>(null);
  
  // Manual PDF Selection States
  const [showManualPDF, setShowManualPDF] = useState(false);
  const [manualPDFFile, setManualPDFFile] = useState<File | null>(null);
  const [pdfJSInstance, setPdfJSInstance] = useState<any>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfViewScale, setPdfViewScale] = useState(1.5);
  const [pdfInSelectionMode, setPdfInSelectionMode] = useState(false);
  const [selectedNativeText, setSelectedNativeText] = useState('');
  const [pdfSelectionBuffer, setPdfSelectionBuffer] = useState<PDFAsset[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number, active: boolean } | null>(null);
  const [selectedPDFAreaContent, setSelectedPDFAreaContent] = useState<{ type: 'text'|'image', data: string } | null>(null);
  const [fullPageSuccess, setFullPageSuccess] = useState(false);
  const [selectionOperationRunning, setSelectionOperationRunning] = useState<'text'|'image'|null>(null);

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRenderTaskRef = useRef<any>(null);
  const pdfPageRef = useRef<any>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
  const requestRef = useRef<number|null>(null);
  const isDrawingSelectionRef = useRef(false);
  const isResizingSelectionRef = useRef<string | null>(null);
  const pdfTextItemsRef = useRef<any[]>([]);

  const [userNotes, setUserNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [showLineColorPalette, setShowLineColorPalette] = useState(false);
  const [isCurveMode, setIsCurveMode] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>('T');
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [lottieAnimations, setLottieAnimations] = useState<LottieAnimation[]>([]);
  const [model3DAnimations, setModel3DAnimations] = useState<Model3DAnimation[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const currentPathRef = useRef<{ x: number, y: number }[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [lineType, setLineType] = useState<'line' | 'arrow' | 'zigzag' | 'curve'>('line');
  const [showArrowHead, setShowArrowHead] = useState(false);
  const [showDoubleArrowHead, setShowDoubleArrowHead] = useState(false);
  const [isOrthogonalMode, setIsOrthogonalMode] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedLottieId, setSelectedLottieId] = useState<string | null>(null);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isHandMode, setIsHandMode] = useState(false);
  const [globalSelectedIds, setGlobalSelectedIds] = useState<string[]>([]);
  const [canvasShapes, setCanvasShapes] = useState<CanvasShape[]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [transformGroupId, setTransformGroupId] = useState<string | null>(null);

  // ID de grupo único para persistencia de sesiones de movimiento coordinado
  const groupId = useMemo(() => crypto.randomUUID(), [globalSelectedIds]);

  const [editingCanvasShapeId, setEditingCanvasShapeId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [showImageLabelEditor, setShowImageLabelEditor] = useState(false);
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#FFD105');
  const [newLabelType, setNewLabelType] = useState<'fixed' | 'interactive'>('fixed');
  const [newLabelLineStyle, setNewLabelLineStyle] = useState<'solid' | 'dashed'>('dashed');
  const [newLabelLineWidth, setNewLabelLineWidth] = useState(2);
  const [shapeFillColor, setShapeFillColor] = useState('#FFD105');
  const [shapeBorderColor, setShapeBorderColor] = useState('#000000');
  const [editingDrawingIds, setEditingDrawingIds] = useState<string[]>([]);
  const editingDrawingIdsRef = useRef<string[]>([]);

  useEffect(() => {
    editingDrawingIdsRef.current = editingDrawingIds;
  }, [editingDrawingIds]);

  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    underline: false
  });
  const [currentFontSize, setCurrentFontSize] = useState(18);
  const [showFontSizePanel, setShowFontSizePanel] = useState(false);
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [lineWidth, setLineWidth] = useState(4);
  const [activeShape, setActiveShape] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [isMedScanLoading, setIsMedScanLoading] = useState(false);
  const [showMedScanModal, setShowMedScanModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [selectedDrawingIdForPoint, setSelectedDrawingIdForPoint] = useState<string | null>(null);
  const [geminiQuery, setGeminiQuery] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [selectedGeminiText, setSelectedGeminiText] = useState('');
  const [showGeminiMenu, setShowGeminiMenu] = useState(false);
  const [geminiImages, setGeminiImages] = useState<{ data: string, mimeType: string }[]>([]);
  const [geminiAudio, setGeminiAudio] = useState<{ data: string, mimeType: string } | null>(null);
  const [schemaNodes, setSchemaNodes] = useState<SchemaNode[]>([]);
  const [selectedSchemaNodeId, setSelectedSchemaNodeId] = useState<string | null>(null);
  const [editingSchemaNodeId, setEditingSchemaNodeId] = useState<string | null>(null);
  const [isSchemaMode, setIsSchemaMode] = useState(false);
  const [useFullDocument, setUseFullDocument] = useState(false);
  const geminiDragControls = useDragControls();
  const geminiImageInputRef = useRef<HTMLInputElement>(null);
  const geminiAudioInputRef = useRef<HTMLInputElement>(null);
  const medScanVideoRef = useRef<HTMLVideoElement>(null);
  const medScanImageInputRef = useRef<HTMLInputElement>(null);
  const medScanStreamRef = useRef<MediaStream | null>(null);
  
  // MedScan Enhancement States
  const [medScanCaptures, setMedScanCaptures] = useState<string[]>([]);
  const [medScanCroppedImages, setMedScanCroppedImages] = useState<string[]>([]);
  const [medScanCroppingIndex, setMedScanCroppingIndex] = useState(0);
  const [medScanMode, setMedScanMode] = useState<'camera' | 'cropping'>('camera');
  const [medScanCapturedImage, setMedScanCapturedImage] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 250, height: 150 });
  const [medScanCropBoxes, setMedScanCropBoxes] = useState<{x: number, y: number, width: number, height: number}[]>([]);
  
  // Guardado Automático para AutoFileStorage
  useEffect(() => {
    const backupData = {
      textBoxes,
      lottieAnimations,
      model3DAnimations,
      drawings,
      canvasShapes,
      images,
      schemaNodes
    };
    
    // El evento será atrapado por AutoFileStorage que tiene su propio debounce de 800ms
    window.dispatchEvent(new CustomEvent('request-auto-save', {
      detail: {
        content: backupData,
        fileName: `Nota_${(title || 'Sin-Titulo').replace(/\s+/g, '_')}_${id}`
      }
    }));
  }, [textBoxes, lottieAnimations, model3DAnimations, drawings, canvasShapes, images, schemaNodes, title, id]);

  // Infinite Canvas State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Interaction Refs
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number, y: number } | null>(null);
  const wasDragging = useRef(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPointerPosRef = useRef<{ x: number, y: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const schemaLongPressTimerRef = useRef<any>(null);

  const handleSchemaInteraction = (e: React.PointerEvent, schemaId: string, nodeId: string) => {
    const now = Date.now();
    const LONG_PRESS_DELAY = 1000;

    // Clear any existing long press timer
    if (schemaLongPressTimerRef.current) {
      clearTimeout(schemaLongPressTimerRef.current);
    }

    // Iniciar timer para LONG PRESS (1000ms)
    schemaLongPressTimerRef.current = setTimeout(() => {
      // Find all nodes that belong to this schema (either by schemaId or being the root)
      const fullSchema = schemaNodes.filter(item => item.schemaId === schemaId || item.id === schemaId);
      const schemaIds = fullSchema.map(item => item.id);
      
      setGlobalSelectedIds(prev => {
        // En modo selección o si ya hay elementos seleccionados, sumamos los IDs del esquema
        if (isSelectionMode || prev.length > 0) {
          const newSelection = [...prev];
          schemaIds.forEach(sid => {
            if (!newSelection.includes(sid)) newSelection.push(sid);
          });
          return newSelection;
        }
        // Si no hay nada seleccionado y no estamos en modo selección, reemplazamos por el esquema completo
        return schemaIds;
      });

      setTransformGroupId(crypto.randomUUID());
      setIsSelectionMode(true); // Permitir movimiento grupal
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      window.requestAnimationFrame(() => console.log("Schema Group selected via Long Press"));
    }, LONG_PRESS_DELAY);

    lastTapRef.current = now;
  };

  const handleImageInteraction = (id: string, e: React.PointerEvent) => {
    if (!id) return;
    if (globalSelectedIds.length <= 1) {
      setEditingImageId(id);
      setSelectedImageId(id);
    }

    window.requestAnimationFrame(() => console.log("Image sub-menu activated via Long Press (1200ms)"));
    return null;
  };

  const handleCancelSchemaInteraction = () => {
    if (schemaLongPressTimerRef.current) {
      clearTimeout(schemaLongPressTimerRef.current);
      schemaLongPressTimerRef.current = null;
    }
  };

  // Cleanup PDF rendering on unmount
  useEffect(() => {
    return () => {
      if (pdfRenderTaskRef.current) {
        pdfRenderTaskRef.current.cancel();
      }
    };
  }, []);

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const zoomIn = () => {
    setTransform(prev => {
      const newScale = Math.min(prev.scale * 1.2, 5);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...prev, scale: newScale };
      const mx = rect.width / 2;
      const my = rect.height / 2;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale)
      };
    });
  };

  const zoomOut = () => {
    setTransform(prev => {
      const newScale = Math.max(prev.scale / 1.2, 0.1);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { ...prev, scale: newScale };
      const mx = rect.width / 2;
      const my = rect.height / 2;
      return {
        scale: newScale,
        x: mx - (mx - prev.x) * (newScale / prev.scale),
        y: my - (my - prev.y) * (newScale / prev.scale)
      };
    });
  };

  const addTextBox = (clickX?: number, clickY?: number) => {
    const newBox: TextBox = {
      id: generateId(),
      text: '',
      // Adjust coordinates based on current pan and scale
      x: clickX !== undefined ? (clickX - transform.x) / transform.scale - 100 : (window.innerWidth / 2 - transform.x) / transform.scale - 100,
      y: clickY !== undefined ? (clickY - transform.y) / transform.scale - 50 : (window.innerHeight / 2 - transform.y) / transform.scale - 50,
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

  const updateTextBox = useCallback((id: string, updates: any) => {
    setTextBoxes(prev => prev.map(box => box.id === id ? { ...box, ...updates } : box));
  }, []);

  // Persistent notes logic
  useEffect(() => {
    const loadNotes = async () => {
      const db = (window as any).db;
      if (db?.notas) {
        try {
          const doc = await db.notas.get(id);
          if (doc && doc.userNotes) {
            setUserNotes(doc.userNotes);
          } else {
            setUserNotes('');
          }
          if (doc && doc.tasks) {
            setTasks(doc.tasks);
          } else {
            setTasks([]);
          }
        } catch (err) {
          console.error("Error loading notes:", err);
        }
      }
    };
    loadNotes();
  }, [id]);

  const handleNotesChange = async (val: string) => {
    setUserNotes(val);
    saveSidebarData(val, tasks);
  };

  const saveSidebarData = async (notes: string, currentTasks: Task[]) => {
    const db = (window as any).db;
    if (db?.notas) {
      try {
        const exists = await db.notas.get(id);
        if (!exists) {
          await db.notas.put({ 
            id: id, 
            userNotes: notes, 
            tasks: currentTasks, 
            timestamp: new Date() 
          });
        } else {
          await db.notas.update(id, { 
            userNotes: notes, 
            tasks: currentTasks 
          });
        }
      } catch (err) {
        console.error("Error saving sidebar data:", err);
      }
    }
  };

  const handleAddTask = () => {
    const newTasks = [...tasks, { id: generateId(), text: '', completed: false }];
    setTasks(newTasks);
    saveSidebarData(userNotes, newTasks);
  };

  const handleToggleTask = (taskId: string) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setTasks(newTasks);
    saveSidebarData(userNotes, newTasks);
  };

  const handleUpdateTaskText = (taskId: string, text: string) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, text } : t);
    setTasks(newTasks);
    saveSidebarData(userNotes, newTasks);
  };

  const handleSingleExport = async () => {
    const exportData = {
      app: "MedNotes_UCV",
      exportType: "SINGLE_NOTE",
      version: "1.0",
      timestamp: new Date().toISOString(),
      note: {
        id: id,
        title: title,
        content: userNotes,
        tasks: tasks,
        textBoxes: textBoxes,
        drawings: drawings,
        lottieAnimations: lottieAnimations,
        model3DAnimations: model3DAnimations,
        canvasShapes: canvasShapes,
        images: images,
        schemaNodes: schemaNodes
      }
    };

    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedNote_${title.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza de memoria para la Redmi Pad SE
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Error al exportar nota:", err);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    saveSidebarData(userNotes, newTasks);
  };

  // Función para unificar el esquema en una sola pieza completa antes de la importación
  const exportarEsquemaUnificado = async (rootId: string, elementos: SchemaNode[]) => {
    if (elementos.length === 0) return null;

    // 1. Calcular el Bounding Box (contenedor) de todas las piezas
    const minX = Math.min(...elementos.map(el => el.x)) - 20;
    const minY = Math.min(...elementos.map(el => el.y)) - 20;
    const maxX = Math.max(...elementos.map(el => el.x + (el.width || 100))) + 20;
    const maxY = Math.max(...elementos.map(el => el.y + (el.height || 40))) + 20;

    const width = maxX - minX;
    const height = maxY - minY;

    // 2. Crear un Canvas temporal para "aplanar" el esquema
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, width, height);

    // Dibujar conexiones primero (debajo de los nodos)
    elementos.forEach(node => {
      if (node.parentId) {
        const parent = elementos.find(n => n.id === node.parentId);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.x + parent.width / 2 - minX, parent.y + parent.height / 2 - minY);
          ctx.lineTo(node.x + node.width / 2 - minX, node.y + node.height / 2 - minY);
          ctx.strokeStyle = node.color || '#8e44ad';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    });

    // Dibujar nodos
    elementos.forEach(node => {
      const relX = node.x - minX;
      const relY = node.y - minY;
      
      // Caja del nodo
      ctx.fillStyle = node.color || '#8e44ad';
      const radius = 10;
      ctx.beginPath();
      // @ts-ignore
      if (ctx.roundRect) { ctx.roundRect(relX, relY, node.width, node.height, radius); }
      else { ctx.rect(relX, relY, node.width, node.height); }
      ctx.fill();

      // Texto del nodo
      ctx.fillStyle = '#ffffff';
      const fontSize = 14;
      ctx.font = `${node.bold ? 'bold ' : ''}${node.italic ? 'italic ' : ''}${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const lines = node.text.split('\n');
      const lineHeight = fontSize * 1.2;
      const startY = relY + node.height / 2 - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, i) => {
        ctx.fillText(line, relX + node.width / 2, startY + i * lineHeight);
      });
    });
    
    // 4. Retornar como una sola pieza completa con ID único
    return {
      id: `unified-schema-${crypto.randomUUID()}`,
      type: 'image' as const,
      content: offscreenCanvas.toDataURL('image/png'),
      width: width,
      height: height,
      isUnified: true
    };
  };

  const prepararYMostrarMaquetador = async () => {
    // Collect all elements from state
    const assets: LayoutAsset[] = [];
    
    // Process text boxes
    textBoxes.forEach(box => {
      assets.push({
        id: box.id,
        type: 'text',
        thumbnail: box.text, // Actual text for preview
        originalWidth: box.width,
        originalHeight: box.height,
        width: 150, // Initial default width for placement
        height: 80,
        x: 10,
        y: 10,
        scale: 1,
        rotation: 0,
        pageIndex: 0,
        fontSize: box.fontSize || 16,
        placed: false,
        alignment: 'left'
      });
    });

    // Process images
    images.forEach(img => {
      assets.push({
        id: img.id,
        type: 'image',
        thumbnail: img.src,
        originalWidth: img.width,
        originalHeight: img.height,
        width: 100,
        height: 100,
        x: 10,
        y: 10,
        scale: 1,
        rotation: img.rotation || 0,
        pageIndex: 0,
        placed: false
      });
    });

    // Process schema nodes as unified pieces
    const roots = schemaNodes.filter(n => !n.parentId);
    const obtenerFamilia = (rootId: string, all: SchemaNode[]): SchemaNode[] => {
      const family: SchemaNode[] = [];
      const stack = [rootId];
      const visited = new Set();
      while (stack.length > 0) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const node = all.find(n => n.id === id);
        if (node) {
          family.push(node);
          all.filter(n => n.parentId === id).forEach(c => stack.push(c.id));
        }
      }
      return family;
    };

    for (const root of roots) {
      const family = obtenerFamilia(root.id, schemaNodes);
      const unified = await exportarEsquemaUnificado(root.id, family);
      if (unified) {
        assets.push({
          id: unified.id,
          type: 'image',
          thumbnail: unified.content,
          originalWidth: unified.width,
          originalHeight: unified.height,
          width: 120,
          height: (unified.height / unified.width) * 120,
          x: 10,
          y: 10,
          scale: 1,
          rotation: 0,
          pageIndex: 0,
          placed: false
        });
      }
    }

    // Process shapes
    canvasShapes.forEach(shape => {
      assets.push({
        id: shape.id,
        type: 'shape',
        thumbnail: '', 
        originalWidth: shape.width,
        originalHeight: shape.height,
        width: 60,
        height: 60,
        x: 10,
        y: 10,
        scale: 1,
        rotation: shape.rotation || 0,
        pageIndex: 0,
        placed: false,
        color: shape.fillColor,
        borderColor: shape.borderColor,
        shapeType: shape.type,
        borderWidth: 2
      });
    });

    setInventoryAssets(assets.filter((asset, index, self) => 
      index === self.findIndex((t) => t.id === asset.id)
    ));
    setLayoutAssets([]); // Comenzar con lienzo vacío
    setActivePageIndex(0);
    setLayoutNumPages(1);
    setShowLayoutModal(true);
  };

  const procesarMaquetacionAI = async () => {
    setIsLayoutAIProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // We send the list of assets to Gemini to get an optimized layout for a 210x297 (A4) area.
      // We assume the maquetador uses a virtual coordinate system where 210 is width and 297 is height.
      
      const assetList = layoutAssets.map(a => ({
        id: a.id,
        type: a.type,
        w: a.originalWidth,
        h: a.originalHeight
      }));

      const prompt = `Actúa como un diseñador editorial experto. Tengo una hoja A4 (dimensiones 210 x 297 unidades). 
      Necesito maquetar los siguientes elementos médicos de forma estética, sin solapamientos, y priorizando que los textos tipo 'text' (que suelen ser títulos o descripciones) queden en la parte superior.
      
      Elementos: ${JSON.stringify(assetList)}
      
      Devuelve ÚNICAMENTE un JSON con este formato:
      [
        {"id": "id_del_elemento", "x": número, "y": número, "scale": número},
        ...
      ]
      Donde x va de 0 a 210, y de 0 a 297. Asegúrate de que los elementos queden proporcionados y legibles.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const layoutData = JSON.parse(result.text);
      
      setLayoutAssets(prev => prev.map(asset => {
        const layout = layoutData.find((l: any) => l.id === asset.id);
        if (layout) {
          return {
            ...asset,
            x: layout.x,
            y: layout.y,
            scale: layout.scale || 1
          };
        }
        return asset;
      }));

    } catch (error) {
      console.error("Error en maquetación AI:", error);
      alert("Hubo un error al organizar con IA.");
    } finally {
      setIsLayoutAIProcessing(false);
    }
  };

  const exportarMaquetacionAPDF = async () => {
    setIsLayoutAIProcessing(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < layoutNumPages; i++) {
        const sheet = document.getElementById(`a4-sheet-p${i}`);
        if (!sheet) continue;

        const canvas = await html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      pdf.save(`${title || 'apunte'}_medico.pdf`);
      setShowLayoutModal(false);
    } catch (error) {
      console.error("Error exportando PDF:", error);
      alert("Error al generar el PDF multi-página.");
    } finally {
      setIsLayoutAIProcessing(false);
    }
  };

  const handleUpdateLayoutAsset = (id: string, updates: Partial<LayoutAsset>) => {
    setLayoutAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handlePDFUpload = async (file: File) => {
    // Check file size (approx limit for many proxies is around 4-10MB)
    // 4MB is a safe limit considering base64 bloat
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_FILE_SIZE) {
      alert("El archivo es demasiado grande (máximo 4MB para este procesamiento directo). Intenta con un PDF más pequeño o una sola página.");
      return;
    }

    setIsPDFProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analiza este documento PDF médico. 
      Extrae los bloques de texto significativos y describe las imágenes.
      Manten el idioma original.
      Responde estrictamente con un JSON (lista de objetos): [{"type": "text" | "image", "content": string, "page": number}]`;

      // Switch back to gemini-3-flash-preview as it's often more resilient to certain internal issues
      // and simplify content structure
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType: "application/pdf" } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      if (!result.text) throw new Error("No se obtuvo respuesta del modelo.");

      const rawJson = result.text.trim();
      const assets = JSON.parse(rawJson).map((a: any, i: number) => ({
        ...a,
        id: crypto.randomUUID(),
        width: a.type === 'text' ? 250 : 200,
        height: a.type === 'text' ? 150 : 200
      }));

      // Filter duplicates just in case
      setPdfAssets(assets.filter((asset, index, self) => 
        index === self.findIndex((t) => t.id === asset.id)
      ));
      setShowPDFPool(true);
    } catch (error: any) {
      console.error("Error detallado procesando PDF:", error);
      let errorMsg = "Error al analizar el PDF.";
      
      if (error?.message?.includes("Rpc failed") || error?.status === "UNKNOWN") {
        errorMsg = "El archivo es demasiado complejo o grande para el servidor. Intenta con un PDF de menos páginas.";
      } else if (error instanceof Error) {
        errorMsg = `Error: ${error.message}`;
      }
      
      alert(errorMsg);
    } finally {
      setIsPDFProcessing(false);
    }
  };

  // Manual PDF rendering
  useEffect(() => {
    if (showManualPDF && manualPDFFile) {
      const loadPDF = async () => {
        try {
          const arrayBuffer = await manualPDFFile.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          setPdfJSInstance(pdf);
          setPdfTotalPages(pdf.numPages);
          setPdfCurrentPage(1);
        } catch (error) {
          console.error("Error loading PDF for manual selection:", error);
          alert("Error al cargar el PDF.");
        }
      };
      loadPDF();
    }
  }, [showManualPDF, manualPDFFile]);

  const renderPDFPage = useCallback(async (customScale?: number) => {
    if (!pdfJSInstance || !pdfCanvasRef.current || !pdfContainerRef.current) return;
    try {
      const page = await pdfJSInstance.getPage(pdfCurrentPage);
      pdfPageRef.current = page;
      
      let scale = customScale || pdfViewScale;
      
      // zoom to fit logic if no scale provided or if we want to auto-adjust
      if (!customScale && pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.clientWidth - 40; // padding
        const unscaledViewport = page.getViewport({ scale: 1 });
        scale = containerWidth / unscaledViewport.width;
        setPdfViewScale(scale);
      }

      const viewport = page.getViewport({ scale });
      const canvas = pdfCanvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      // Cancel existing render task to prevent "Cannot use the same canvas" error
      if (pdfRenderTaskRef.current) {
        pdfRenderTaskRef.current.cancel();
      }

      const renderTask = page.render(renderContext);
      pdfRenderTaskRef.current = renderTask;

      try {
        await renderTask.promise;
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          return;
        }
        throw err;
      } finally {
        if (pdfRenderTaskRef.current === renderTask) {
          pdfRenderTaskRef.current = null;
        }
      }
      
      // Render text layer
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = '';
        const textContent = await page.getTextContent();
        
        // Store text items for snapping
        pdfTextItemsRef.current = textContent.items.map((item: any) => {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          return {
            x: tx[4],
            y: tx[5] - (item.height * scale),
            w: item.width * scale,
            h: item.height * scale,
            str: item.str
          };
        });

        // Modern pdfjs-dist v4/v5 API uses TextLayer class
        const textLayer = new (pdfjsLib as any).TextLayer({
          textContentSource: textContent,
          container: textLayerRef.current,
          viewport: viewport
        });
        await textLayer.render();
      }
    } catch (err) {
      console.error("Error rendering PDF page:", err);
    }
  }, [pdfJSInstance, pdfCurrentPage, pdfViewScale]);

  useEffect(() => {
    if (showManualPDF && pdfJSInstance) {
      renderPDFPage();
    }
  }, [showManualPDF, pdfJSInstance, pdfCurrentPage]);

  // Capture native text selection from PDF text layer
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!showManualPDF || pdfInSelectionMode) return;
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      // Basic check if the selection is within our modal
      if (text && selection?.anchorNode && textLayerRef.current?.contains(selection.anchorNode)) {
        setSelectedNativeText(text);
      } else {
        setSelectedNativeText('');
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [showManualPDF, pdfInSelectionMode]);

  const showToast = (message: string) => {
    setPdfToast({ show: true, message });
    setTimeout(() => setPdfToast(null), 2500);
  };

  // Optimización para selección de área PDF y Fluidez en Redmi Pad SE
  const handlePDFPointerDown = (e: React.PointerEvent) => {
    if (activeShape !== 'PDF_SELECT' || !pdfCanvasRef.current) return;
    e.stopPropagation();
    
    // Bloquear paneo del lienzo para evitar glitches de movimiento
    setIsPanning(false); 
    
    const rect = pdfCanvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionRect({ x: startX, y: startY, width: 0, height: 0, active: true });
  };

  const handlePDFPointerMove = (e: React.PointerEvent) => {
    if (!selectionRect?.active || !pdfCanvasRef.current) return;

    requestAnimationFrame(() => {
      const rect = pdfCanvasRef.current!.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      setSelectionRect(prev => {
        if (!prev) return null;
        return {
          ...prev,
          width: currentX - prev.x,
          height: currentY - prev.y
        };
      });
    });
  };

  const handleSelectionImport = async (type: 'text' | 'image') => {
    // 1. Validaciones de seguridad (Evita los errores de consola)
    if (!selectionRect || !pdfPageRef.current) return;

    const generateId = (prefix: string) => `${prefix}${Date.now()}`;
    
    // Mantenemos la lógica de feedback visual
    setSelectionOperationRunning(type);

    try {
      // 2. Obtener el viewport actual (esencial para la precisión de coordenadas visuales)
      const visualViewport = pdfPageRef.current.getViewport({ scale: pdfViewScale });

      if (type === 'text') {
        const textContent = await pdfPageRef.current.getTextContent();
        
        // 3. Conversión precisa de coordenadas (Pantalla -> PDF Points)
        const p1 = visualViewport.convertToPdfPoint(selectionRect.x, selectionRect.y);
        const p2 = visualViewport.convertToPdfPoint(selectionRect.x + selectionRect.width, selectionRect.y + selectionRect.height);

        const bounds = {
          minX: Math.min(p1[0], p2[0]),
          maxX: Math.max(p1[0], p2[0]),
          minY: Math.min(p1[1], p2[1]),
          maxY: Math.max(p1[1], p2[1])
        };

        // 4. Filtrado de texto exacto
        const extractedText = (textContent.items as any[])
          .filter((item: any) => {
            const x = item.transform[4];
            const y = item.transform[5];
            // Tolerancia de 2pt para bordes
            return x >= bounds.minX - 2 && x <= bounds.maxX + 2 && y >= bounds.minY - 2 && y <= bounds.maxY + 2;
          })
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Actualizamos el buffer de la barra lateral
        setPdfSelectionBuffer(prev => [...prev, {
          id: generateId('txt-'),
          type: 'text',
          content: extractedText || "No se detectó texto en el área.",
          page: pdfCurrentPage,
          width: Math.abs(selectionRect.width),
          height: Math.abs(selectionRect.height)
        }]);

      } else if (type === 'image') {
        // CAPTURA DE IMAGEN EN ALTA RESOLUCIÓN (3x)
        const renderScale = 3.0;
        const highResViewport = pdfPageRef.current.getViewport({ scale: renderScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Coordenadas normalizadas a escala 1.0x para el renderizado parcial
        const rect1x = {
          x: Math.min(selectionRect.x, selectionRect.x + selectionRect.width) / pdfViewScale,
          y: Math.min(selectionRect.y, selectionRect.y + selectionRect.height) / pdfViewScale,
          w: Math.abs(selectionRect.width) / pdfViewScale,
          h: Math.abs(selectionRect.height) / pdfViewScale
        };
        
        canvas.width = rect1x.w * renderScale;
        canvas.height = rect1x.h * renderScale;

        if (ctx) {
          // Renderizamos la porción específica a alta escala
          await pdfPageRef.current.render({
            canvasContext: ctx,
            viewport: highResViewport,
            transform: [1, 0, 0, 1, -rect1x.x * renderScale, -rect1x.y * renderScale]
          }).promise;
        }

        setPdfSelectionBuffer(prev => [...prev, {
          id: generateId('img-'),
          type: 'image',
          content: canvas.toDataURL('image/png', 1.0),
          page: pdfCurrentPage,
          width: Math.abs(selectionRect.width),
          height: Math.abs(selectionRect.height)
        }]);
      }
    } catch (err) {
      console.error("Error en la extracción:", err);
    } finally {
      // 5. Mantenemos el mismo comportamiento de cierre e interactividad
      setTimeout(() => {
        setSelectionOperationRunning(null);
        setSelectionRect(null);
        setSelectedNativeText('');
      }, 800);
    }
  };

  const insertFullPageToBuffer = async () => {
    if (!pdfPageRef.current) return;
    
    const viewport = pdfPageRef.current.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pdfPageRef.current.render({ canvasContext: ctx!, viewport }).promise;

    const newAsset: PDFAsset = {
      id: crypto.randomUUID(),
      type: 'image',
      content: canvas.toDataURL('image/webp', 0.6),
      page: pdfCurrentPage,
      width: viewport.width,
      height: viewport.height
    };

    // Ahora esto SÍ aparecerá en la bandeja de recortes lateral
    setPdfSelectionBuffer(prev => [...prev, newAsset]);
  };

  const snapToText = (val: number, dimension: 'x' | 'y'): number => {
    if (!pdfTextItemsRef.current.length) return val;
    const threshold = 15;
    let bestDist = threshold;
    let snappedVal = val;

    for (const item of pdfTextItemsRef.current) {
      if (dimension === 'x') {
        const dLeft = Math.abs(item.x - val);
        const dRight = Math.abs((item.x + item.w) - val);
        if (dLeft < bestDist) { bestDist = dLeft; snappedVal = item.x; }
        if (dRight < bestDist) { bestDist = dRight; snappedVal = item.x + item.w; }
      } else {
        const dTop = Math.abs(item.y - val);
        const dBottom = Math.abs((item.y + item.h) - val);
        if (dTop < bestDist) { bestDist = dTop; snappedVal = item.y; }
        if (dBottom < bestDist) { bestDist = dBottom; snappedVal = item.y + item.h; }
      }
    }
    return snappedVal;
  };

  const importAssetToCanvas = (asset: PDFAsset) => {
    const x = (window.innerWidth / 2 - transform.x) / transform.scale - 100;
    const y = (window.innerHeight / 2 - transform.y) / transform.scale - 50;
    
    if (asset.type === 'image' && asset.content.startsWith('data:image')) {
      const newImage: CanvasImage = {
        id: crypto.randomUUID(),
        src: asset.content,
        x,
        y,
        width: asset.width,
        height: asset.height,
        rotation: 0,
        zIndex: 5,
        sourcePage: asset.page
      };
      setImages(prev => [...prev, newImage]);
      setSelectedImageId(newImage.id);
    } else if (asset.type === 'text') {
      const newBox: TextBox = {
        id: crypto.randomUUID(),
        text: asset.content,
        x,
        y,
        width: asset.width,
        height: asset.height,
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        rotation: 0,
        zIndex: 5,
        sourcePage: asset.page
      };
      setTextBoxes(prev => [...prev, newBox]);
      setSelectedBoxId(newBox.id);
    } else {
      // For images from Gemini, we'll keep the text box placeholder or try to handle as image if we had binary
      const newBox: TextBox = {
         id: generateId(),
         text: `[Imagen Página ${asset.page}]: ${asset.content}`,
         x,
         y,
         width: asset.width,
         height: asset.height,
         fontSize: 14,
         fontWeight: 'bold',
         fontStyle: 'italic',
         textDecoration: 'none',
         textAlign: 'center',
         backgroundColor: '#f0f0f0',
         rotation: 0,
         zIndex: 5,
         sourcePage: asset.page
      };
      setTextBoxes(prev => [...prev, newBox]);
      setSelectedBoxId(newBox.id);
    }
  };

  const adjustZIndex = (direction: 'front' | 'back') => {
    if (selectedBoxId) {
      setTextBoxes(prev => prev.map(b => {
        if (b.id === selectedBoxId) {
          const currentZ = b.zIndex || 10;
          return { ...b, zIndex: direction === 'front' ? currentZ + 1 : Math.max(1, currentZ - 1) };
        }
        return b;
      }));
    } else if (selectedImageId) {
      setImages(prev => prev.map(img => {
        if (img.id === selectedImageId) {
          const currentZ = img.zIndex || 10;
          return { ...img, zIndex: direction === 'front' ? currentZ + 1 : Math.max(1, currentZ - 1) };
        }
        return img;
      }));
    }
  };

  const handleEditingChange = useCallback((isEditing: boolean) => {
    if (isEditing) {
      setShowTextMenu(true);
    }
  }, []);

  useEffect(() => {
    const handleToggleLabelEditor = () => {
      if (editingImageId) {
        setShowImageLabelEditor(prev => !prev);
      }
    };
    window.addEventListener('toggle-image-label-editor', handleToggleLabelEditor);
    return () => window.removeEventListener('toggle-image-label-editor', handleToggleLabelEditor);
  }, [editingImageId]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (wasDragging.current || isHandMode) return;
    
    // Check if we clicked the background
    const isBackground = e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS' || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).className?.includes?.('fabric-sheet-container');

    if (isBackground) {
      setGlobalSelectedIds([]);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedBoxId(null);
      setSelectedLottieId(null);
      setSelectedModel3DId(null);
      setSelectedDrawingId(null);
      setSelectedShapeId(null);
      setSelectedImageId(null);
      setSelectedSchemaNodeId(null);
      setEditingSchemaNodeId(null);
      setEditingImageId(null);
      setEditingCanvasShapeId(null);
      
      setTransformGroupId(null);
      setShowTextMenu(false);
      setShowCanvasShapesPanel(false);
      setShowMediaMenu(false);
      
      if (isSelectionMode) {
        if (e.detail === 2) {
          setIsSelectionMode(false);
        }
      }
      return;
    }

    if (isSelectionMode) {
      // Check for double click to deselect
      if (e.detail === 2) {
        setGlobalSelectedIds([]);
      }
      return;
    }

    if (showTextMenu) {
      // Get coordinates relative to the canvas container
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Selection auto-clear on background click (handled above)
      }
    } else {
      setSelectedBoxId(null);
      setSelectedSchemaNodeId(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // If clicking on the background (container itself) or using middle mouse button
    const isBackground = e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS' || (e.target as HTMLElement).tagName === 'svg';
    const isMiddleButton = e.button === 1;
    const isNavigationMode = !showTextMenu && !selectedBoxId && !showLinesMenu;

    if (isBackground) {
      // We don't clear selections here anymore to avoid closing windows during pan/zoom interaction
      // Clearing logic is moved to handleCanvasClick for clean taps only
    } else if (isVectorizing) {
      // If we clicked something that is NOT background but we are in vectorizing mode,
      // we should check if we clicked a drawing. 
      // The drawing's onPointerDown handles its own selection.
    }

    if (activePointers.current.size === 1) {
      wasDragging.current = false;
      
      if (showLinesMenu && !isHandMode && !isSelectionMode && !isVectorizing) {
        setIsDrawing(true);
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
          pauseTimeoutRef.current = null;
        }
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left - transform.x) / transform.scale;
          const y = (e.clientY - rect.top - transform.y) / transform.scale;
          lastPointerPosRef.current = { x, y };
          if (isCurveMode || lineType === 'zigzag' || lineType === 'curve') {
            currentPathRef.current = [{ x, y }];
          } else {
            currentPathRef.current = [{ x, y }, { x, y }];
          }
        }
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (isBackground || isMiddleButton || isHandMode) {
        setIsPanning(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    } else if (activePointers.current.size === 2) {
      setIsPanning(true);
      setIsDrawing(false);
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

  const drawPathOnCanvas = (ctx: CanvasRenderingContext2D, points: { x: number, y: number }[]) => {
    if (points.length < 2) return;
    
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth * transform.scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const startX = points[0].x * transform.scale + transform.x;
    const startY = points[0].y * transform.scale + transform.y;
    ctx.moveTo(startX, startY);

    if ((isCurveMode || lineType === 'curve') && points.length > 2 && !isOrthogonalMode) {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = ((points[i].x + points[i + 1].x) / 2) * transform.scale + transform.x;
        const yc = ((points[i].y + points[i + 1].y) / 2) * transform.scale + transform.y;
        const px = points[i].x * transform.scale + transform.x;
        const py = points[i].y * transform.scale + transform.y;
        ctx.quadraticCurveTo(px, py, xc, yc);
      }
      // For the last point
      const lastX = points[points.length - 1].x * transform.scale + transform.x;
      const lastY = points[points.length - 1].y * transform.scale + transform.y;
      ctx.lineTo(lastX, lastY);
    } else {
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * transform.scale + transform.x, points[i].y * transform.scale + transform.y);
      }
    }
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawing) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const rawX = (e.clientX - rect.left - transform.x) / transform.scale;
        const rawY = (e.clientY - rect.top - transform.y) / transform.scale;
        let x = rawX;
        let y = rawY;
        
        const points = currentPathRef.current;
        if (isOrthogonalMode && points.length > 0) {
          // The anchor for the current segment is the point before the last one
          // For simple lines (length 2), the anchor is always points[0]
          const anchor = (isCurveMode || lineType === 'zigzag' || lineType === 'curve')
            ? (points.length >= 2 ? points[points.length - 2] : points[0])
            : points[0];

          const dx = Math.abs(rawX - anchor.x);
          const dy = Math.abs(rawY - anchor.y);
          if (dx > dy) {
            y = anchor.y;
            x = rawX;
          } else {
            x = anchor.x;
            y = rawY;
          }
        }
        
        if (isCurveMode || lineType === 'zigzag' || lineType === 'curve') {
          const lastPoint = points[points.length - 1];
          const anchor = points.length >= 2 ? points[points.length - 2] : points[0];
          const dist = Math.hypot(x - lastPoint.x, y - lastPoint.y);
          
          // Detect pausing to create an anchor using raw coordinates
          const distFromLastMove = lastPointerPosRef.current ? Math.hypot(rawX - lastPointerPosRef.current.x, rawY - lastPointerPosRef.current.y) : 0;
          lastPointerPosRef.current = { x: rawX, y: rawY };

          if (distFromLastMove < 1) {
            if (!pauseTimeoutRef.current) {
              pauseTimeoutRef.current = setTimeout(() => {
                if (currentPathRef.current.length > 0) {
                  const last = currentPathRef.current[currentPathRef.current.length - 1];
                  currentPathRef.current.push({ ...last });
                  const ctx = canvasRef.current?.getContext('2d');
                  if (ctx) drawPathOnCanvas(ctx, currentPathRef.current);
                }
                pauseTimeoutRef.current = null;
              }, 300);
            }
          } else {
            if (pauseTimeoutRef.current) {
              clearTimeout(pauseTimeoutRef.current);
              pauseTimeoutRef.current = null;
            }
          }

          if (points.length === 1) {
            if (dist > 5) {
              points.push({ x, y });
            }
          } else {
            const prevPoint = points[points.length - 2];
            // Calculate perpendicular distance from current point (x,y) to the line formed by prevPoint and lastPoint
            const lineDist = Math.hypot(lastPoint.x - prevPoint.x, lastPoint.y - prevPoint.y);
            if (lineDist > 0) {
              // Use raw coordinates for deviation check to allow breaking segments in orthogonal mode
              const d = Math.abs((lastPoint.y - prevPoint.y) * rawX - (lastPoint.x - prevPoint.x) * rawY + lastPoint.x * prevPoint.y - lastPoint.y * prevPoint.x) / lineDist;
              const checkDist = isOrthogonalMode ? Math.hypot(rawX - lastPoint.x, rawY - lastPoint.y) : dist;
              
              // If deviation is significant, fix the last point and start a new segment
              if (isOrthogonalMode) {
                const dx = Math.abs(rawX - anchor.x);
                const dy = Math.abs(rawY - anchor.y);
                const isCurrentlyHorizontal = Math.abs(lastPoint.x - prevPoint.x) >= Math.abs(lastPoint.y - prevPoint.y);
                
                // Switch axis if the other direction becomes dominant and we've moved enough
                if (isCurrentlyHorizontal) {
                  if (dy > dx && dy > 10 && Math.abs(rawX - prevPoint.x) > 20) {
                    points.push({ x, y });
                  } else {
                    points[points.length - 1] = { x, y };
                  }
                } else {
                  if (dx > dy && dx > 10 && Math.abs(rawY - prevPoint.y) > 20) {
                    points.push({ x, y });
                  } else {
                    points[points.length - 1] = { x, y };
                  }
                }
              } else {
                if (d > 15 && checkDist > 20) {
                  points.push({ x, y });
                } else {
                  points[points.length - 1] = { x, y };
                }
              }
            } else {
              points[points.length - 1] = { x, y };
            }
          }
        } else {
          if (currentPathRef.current.length >= 2) {
            currentPathRef.current[1] = { x, y };
          }
        }
        
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          drawPathOnCanvas(ctx, currentPathRef.current);
        }
      }
      return;
    }

    if (!isPanning) return;

    const prevPos = activePointers.current.get(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && prevPos) {
      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        wasDragging.current = true;
      }

      setTransform(prev => ({
        ...prev,
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
        
        setTransform(prev => {
          const newScale = Math.min(Math.max(prev.scale * factor, 0.1), 5);
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return prev;

          const mx = midX - rect.left;
          const my = midY - rect.top;
          const prevMidX = currentMid.x - rect.left;
          const prevMidY = currentMid.y - rect.top;

          // Correct pinch-zoom formula: 
          // The point that was at prevMidX should now be at mx
          return {
            scale: newScale,
            x: mx - (prevMidX - prev.x) * (newScale / prev.scale),
            y: my - (prevMidY - prev.y) * (newScale / prev.scale)
          };
        });
      }

      lastPinchDist.current = dist;
      lastPinchMid.current = { x: midX, y: midY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if (isDrawing) {
      if (currentPathRef.current.length > 1) {
        const newDrawing: Drawing = {
          id: generateId(),
          points: [...currentPathRef.current],
          color: strokeColor,
          width: lineWidth,
          type: isCurveMode ? 'curve' : lineType,
          showArrowHead: showArrowHead,
          showDoubleArrowHead: showDoubleArrowHead,
          isOrthogonal: isOrthogonalMode
        };
        setDrawings(prev => [...prev, newDrawing]);
      }
      setIsDrawing(false);
      currentPathRef.current = [];
      // Clear canvas after a short delay to ensure SVG has rendered
      setTimeout(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      }, 50);
    }

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
      
      setTransform(prev => {
        const newScale = Math.min(Math.max(prev.scale * factor, 0.1), 5);
        return {
          scale: newScale,
          x: mx - (mx - prev.x) * (newScale / prev.scale),
          y: my - (my - prev.y) * (newScale / prev.scale)
        };
      });
    } else {
      // Pan with wheel
      setTransform(prev => ({
        ...prev,
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
        const newBold = box.fontWeight === 'bold';
        const newItalic = box.fontStyle === 'italic';
        const newUnderline = box.textDecoration === 'underline';

        setTextStyle(prev => {
          if (prev.bold === newBold && prev.italic === newItalic && prev.underline === newUnderline) {
            return prev;
          }
          return { bold: newBold, italic: newItalic, underline: newUnderline };
        });

        if (currentFontSize !== box.fontSize) {
          setCurrentFontSize(box.fontSize);
        }
      }
    } else {
      setTextStyle(prev => {
        if (!prev.bold && !prev.italic && !prev.underline) return prev;
        return { bold: false, italic: false, underline: false };
      });
    }
  }, [selectedBoxId, textBoxes]); // removed currentFontSize from dependencies to prevent self-triggering loop

  const FONT_SIZES = [
    8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 
    64, 68, 72, 80, 88, 96, 104, 112, 120, 140, 160, 200
  ];

  useEffect(() => {
    if (showFontSizePanel && fontSizePanelRef.current) {
      setTimeout(() => {
        if (!fontSizePanelRef.current) return;
        const selectedButton = fontSizePanelRef.current.querySelector('.text-wrapper.text-2xl') as HTMLElement;
        if (selectedButton) {
          const buttonContainer = selectedButton.closest('button');
          if (buttonContainer) {
            fontSizePanelRef.current.scrollTo({
              left: buttonContainer.offsetLeft - fontSizePanelRef.current.offsetWidth / 2 + buttonContainer.offsetWidth / 2,
              behavior: 'auto'
            });
          }
        }
      }, 50);
    }
  }, [showFontSizePanel, currentFontSize]);

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

  // Effect to sync canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const renderDrawing = (drawing: Drawing) => {
    if (drawing.points.length < 2) return null;

    const isEditing = editingDrawingIds.includes(drawing.id);

    let d = "";
    if (drawing.type === 'curve' && drawing.points.length > 2 && !drawing.isOrthogonal) {
      d = `M ${drawing.points[0].x} ${drawing.points[0].y}`;
      for (let i = 1; i < drawing.points.length - 1; i++) {
        const xc = (drawing.points[i].x + drawing.points[i + 1].x) / 2;
        const yc = (drawing.points[i].y + drawing.points[i + 1].y) / 2;
        d += ` Q ${drawing.points[i].x} ${drawing.points[i].y}, ${xc} ${yc}`;
      }
      d += ` L ${drawing.points[drawing.points.length - 1].x} ${drawing.points[drawing.points.length - 1].y}`;
    } else {
      d = `M ${drawing.points[0].x} ${drawing.points[0].y}`;
      for (let i = 1; i < drawing.points.length; i++) {
        d += ` L ${drawing.points[i].x} ${drawing.points[i].y}`;
      }
    }

    let wasSelectedAtPointerDown = false;

    return (
      <g key={drawing.id}>
        {/* Yellow highlight for edit mode */}
        {isEditing && (
          <path
            d={d}
            fill="none"
            stroke="#FFD105"
            strokeWidth={drawing.width + 8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.5, filter: 'blur(2px)', pointerEvents: 'none' }}
          />
        )}
        
        <motion.path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(drawing.width + 15, 20)}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ 
            pointerEvents: isPanning ? 'none' : 'auto',
            cursor: isVectorizing ? 'pointer' : (isEditing ? 'move' : 'default')
          }}
          onPointerDown={(e) => {
            if (!isPanning) {
              e.stopPropagation();
              if (isVectorizing) {
                wasSelectedAtPointerDown = editingDrawingIdsRef.current.includes(drawing.id);
                if (!wasSelectedAtPointerDown) {
                  setEditingDrawingIds(prev => [...prev, drawing.id]);
                }
                // When clicking the line, clear point selection
                setSelectedPointIndex(null);
                setSelectedDrawingIdForPoint(null);
              }
            }
          }}
          onTap={() => {
            if (isVectorizing && wasSelectedAtPointerDown) {
              setEditingDrawingIds(prev => prev.filter(id => id !== drawing.id));
            }
          }}
          onPan={(_, info) => {
            if (isEditing) {
              const deltaX = info.delta.x / transform.scale;
              const deltaY = info.delta.y / transform.scale;
              
              setDrawings(prev => prev.map(dr => {
                if (editingDrawingIdsRef.current.includes(dr.id)) {
                  return {
                    ...dr,
                    points: dr.points.map(p => ({
                      x: p.x + deltaX,
                      y: p.y + deltaY
                    }))
                  };
                }
                return dr;
              }));
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectionMode) {
              toggleGlobalSelection(drawing.id);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingDrawingIds([drawing.id]);
            setIsVectorizing(true);
            setIsSelectionMode(false);
          }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke={drawing.color}
          strokeWidth={drawing.width}
          strokeLinecap={(drawing.showArrowHead || drawing.showDoubleArrowHead) ? 'butt' : 'round'}
          strokeLinejoin="round"
          markerEnd={(drawing.showArrowHead || drawing.showDoubleArrowHead) ? `url(#arrowhead-end-${drawing.id})` : undefined}
          markerStart={drawing.showDoubleArrowHead ? `url(#arrowhead-start-${drawing.id})` : undefined}
          style={{ 
            pointerEvents: 'none'
          }}
        />

        {/* Edit handles */}
        {isEditing && drawing.points.map((point, index) => {
          const isPointSelected = selectedDrawingIdForPoint === drawing.id && selectedPointIndex === index;
          return (
            <motion.circle
              key={`${drawing.id}-handle-${index}`}
              cx={point.x}
              cy={point.y}
              r={8 / transform.scale}
              fill={isPointSelected ? "#FFFFFF" : "#FFD105"}
              stroke="#000"
              strokeWidth={1.5 / transform.scale}
              style={{ 
                cursor: 'pointer',
                pointerEvents: isPanning ? 'none' : 'auto',
                zIndex: 1000
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedPointIndex(index);
                setSelectedDrawingIdForPoint(drawing.id);
                // Ensure the drawing is also selected
                if (!editingDrawingIdsRef.current.includes(drawing.id)) {
                  setEditingDrawingIds(prev => [...prev, drawing.id]);
                }
              }}
              onPan={(_, info) => {
                setDrawings(prev => prev.map(dr => {
                  if (editingDrawingIdsRef.current.includes(dr.id)) {
                    const newPoints = [...dr.points];
                    if (newPoints[index]) {
                      newPoints[index] = {
                        x: newPoints[index].x + info.delta.x / transform.scale,
                        y: newPoints[index].y + info.delta.y / transform.scale
                      };
                      return { ...dr, points: newPoints };
                    }
                  }
                  return dr;
                }));
              }}
            />
          );
        })}
      </g>
    );
  };

  const deleteSelectedDrawings = () => {
    if (selectedPointIndex !== null && selectedDrawingIdForPoint !== null) {
      setDrawings(prev => prev.map(dr => {
        if (dr.id === selectedDrawingIdForPoint) {
          if (dr.points.length > 2) {
            const newPoints = dr.points.filter((_, i) => i !== selectedPointIndex);
            return { ...dr, points: newPoints };
          } else {
            // If only 2 points, deleting one deletes the line
            return null as any;
          }
        }
        return dr;
      }).filter(Boolean));
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
    } else {
      setDrawings(prev => prev.filter(dr => !editingDrawingIds.includes(dr.id)));
      setEditingDrawingIds([]);
    }
  };

  const addCanvasShape = (type: CanvasShape['type']) => {
    const newShape: CanvasShape = {
      id: generateId(),
      type,
      x: (window.innerWidth / 2 - transform.x) / transform.scale - (type === 'rectangle' ? 75 : 50),
      y: (window.innerHeight / 2 - transform.y) / transform.scale - 50,
      width: type === 'rectangle' ? 150 : 100,
      height: 100,
      fillColor: shapeFillColor,
      borderColor: shapeBorderColor,
      rotation: 0
    };
    setCanvasShapes(prev => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
    setEditingCanvasShapeId(newShape.id);
    setGlobalSelectedIds([newShape.id]); // Asegurar que aparezca el sub-menú al insertar
    setShowCanvasShapesPanel(false);
  };

  const updateCanvasShape = (id: string, updates: Partial<CanvasShape>) => {
    setCanvasShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateMultipleCanvasShapes = (ids: string[], updates: Partial<CanvasShape>) => {
    setCanvasShapes(prev => prev.map(s => ids.includes(s.id) ? { ...s, ...updates } : s));
  };

  const deleteCanvasShape = (id: string) => {
    setCanvasShapes(prev => prev.filter(s => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
    if (editingCanvasShapeId === id) setEditingCanvasShapeId(null);
  };

  const handleAction = (action: string) => {
    console.log(`${action} clicado`);
    if (action === 'Texto') {
      const nextShowTextMenu = !showTextMenu;
      setShowTextMenu(nextShowTextMenu);
      setIsSelectionMode(false);
      setIsSchemaMode(false);
      setShowLinesMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      setSelectedModel3DId(null);
      setEditingCanvasShapeId(null);
      
      if (nextShowTextMenu) {
        setShowStylePanel(false);
        setShowIconsPanel(false);
        setShowMediaMenu(false);
        setShowFontSizePanel(false);
      } else {
        setIsHighlighterActive(false);
      }
    } else if (action === 'Forma') {
      if (showTextMenu) {
        const next = !showIconsPanel;
        setShowIconsPanel(next);
        if (next) {
          setShowLinesMenu(false);
          setShowMediaMenu(false);
          setIsVectorizing(false);
          setEditingDrawingIds([]);
          setSelectedPointIndex(null);
          setSelectedDrawingIdForPoint(null);
          setSelectedLottieId(null);
          setSelectedModel3DId(null);
          setShowStylePanel(false);
          setShowFontSizePanel(false);
          setIsSelectionMode(false);
        }
      } else {
        const next = !showCanvasShapesPanel;
        setShowCanvasShapesPanel(next);
        if (next) {
          setShowLinesMenu(false);
          setShowMediaMenu(false);
          setIsVectorizing(false);
          setEditingDrawingIds([]);
          setSelectedPointIndex(null);
          setSelectedDrawingIdForPoint(null);
          setSelectedLottieId(null);
          setSelectedModel3DId(null);
          setShowStylePanel(false);
          setShowFontSizePanel(false);
          setShowTextMenu(false);
          setIsSelectionMode(false);
          setShowIconsPanel(false);
        }
      }
    } else if (action === 'Selección') {
      setIsSelectionMode(!isSelectionMode);
      setIsHandMode(false);
      setIsSchemaMode(false);
      setShowLinesMenu(false);
      setShowMediaMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      setSelectedModel3DId(null);
      setEditingCanvasShapeId(null);
      if (!isSelectionMode) {
        setGlobalSelectedIds([]);
        setTransformGroupId(null);
      }
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
    } else if (action === 'Mano') {
      setIsHandMode(!isHandMode);
      setIsSelectionMode(false);
      setIsSchemaMode(false);
      setShowLinesMenu(false);
      setShowMediaMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      setSelectedModel3DId(null);
      setEditingCanvasShapeId(null);
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
    } else if (action === 'Eliminar') {
      if (globalSelectedIds.length > 0) {
        setTextBoxes(prev => prev.filter(box => !globalSelectedIds.includes(box.id)));
        setLottieAnimations(prev => prev.filter(l => !globalSelectedIds.includes(l.id)));
        setModel3DAnimations(prev => prev.filter(m => !globalSelectedIds.includes(m.id)));
        setCanvasShapes(prev => prev.filter(s => !globalSelectedIds.includes(s.id)));
        setImages(prev => prev.filter(img => !globalSelectedIds.includes(img.id)));
        setSchemaNodes(prev => prev.filter(node => !globalSelectedIds.includes(node.id)));
        setGlobalSelectedIds([]);
      } else if (selectedBoxId) {
        setTextBoxes(prev => prev.filter(box => box.id !== selectedBoxId));
        setSelectedBoxId(null);
      } else if (selectedLottieId) {
        setLottieAnimations(prev => prev.filter(l => l.id !== selectedLottieId));
        setSelectedLottieId(null);
      } else if (selectedModel3DId) {
        setModel3DAnimations(prev => prev.filter(m => m.id !== selectedModel3DId));
        setSelectedModel3DId(null);
      } else if (selectedImageId) {
        setImages(prev => prev.filter(img => img.id !== selectedImageId));
        setSelectedImageId(null);
      } else if (editingImageId) {
        setImages(prev => prev.filter(img => img.id !== editingImageId));
        setEditingImageId(null);
      } else if (selectedShapeId) {
        deleteCanvasShape(selectedShapeId);
      } else if (editingCanvasShapeId) {
        deleteCanvasShape(editingCanvasShapeId);
      } else if (editingDrawingIds.length > 0 || selectedPointIndex !== null) {
        deleteSelectedDrawings();
      }
    } else if (action === 'Gemini') {
      handleGeminiQuery();
    } else if (action === 'Flecha') {
      const next = !showLinesMenu;
      setShowLinesMenu(next);
      if (next) {
        setIsSchemaMode(false);
        setIsVectorizing(false);
        setEditingDrawingIds([]);
        setSelectedPointIndex(null);
        setSelectedDrawingIdForPoint(null);
        setSelectedLottieId(null);
        setSelectedModel3DId(null);
        setShowIconsPanel(false);
        setShowMediaMenu(false);
        setShowStylePanel(false);
        setShowFontSizePanel(false);
        setShowTextMenu(false);
        setIsSelectionMode(false);
      }
    } else if (action === 'Imagen') {
      setShowMediaMenu(!showMediaMenu);
      if (!showMediaMenu) {
        setShowLinesMenu(false);
        setShowIconsPanel(false);
        setShowStylePanel(false);
        setShowFontSizePanel(false);
        setShowTextMenu(false);
      }
    } else if (action === 'Borrador') {
      // Placeholder for other actions to prevent them from closing menus if not needed
      console.log(`Action ${action} triggered`);
    } else {
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
      if (action !== 'Selección' && action !== 'Mano') {
        setIsSelectionMode(false);
        setIsHandMode(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showGeminiMenu) {
        setShowGeminiMenu(false);
      }
    };

    if (showGeminiMenu) {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGeminiMenu]);

  const handleGeminiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        const data = base64Data.split(',')[1];
        setGeminiImages(prev => [...prev, { data, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input
    e.target.value = '';
  };

  const handleGeminiAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const data = base64Data.split(',')[1];
      setGeminiAudio({ data, mimeType: file.type });
      setShowGeminiModal(true); // Abrir la ventana de Gemini al cargar audio
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleGeminiQuery = async () => {
    const selectedBoxes = useFullDocument 
      ? textBoxes 
      : textBoxes.filter(box => globalSelectedIds.includes(box.id) || box.id === selectedBoxId);

    if (!geminiQuery.trim() && geminiImages.length === 0) {
      alert("Por favor, ingresa una pregunta o adjunta una imagen.");
      return;
    }

    setIsGeminiLoading(true);
    setGeminiResponse(''); // Clear previous response
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("La clave de API de Gemini no está configurada.");
      }

      const genAI = new GoogleGenAI({ apiKey });
      
      const contextPrefix = useFullDocument ? "Contexto de TODO el documento (todas las notas):\n\n" : "Contexto de mis notas seleccionadas:\n\n";
      const context = selectedBoxes.length > 0 
        ? `${contextPrefix}${selectedBoxes.map(box => box.text).join('\n\n')}\n\n` 
        : "";
      
      const parts: any[] = [{ text: `${context}Pregunta/Investigación del usuario: ${geminiQuery}` }];
      
      // Add images if any
      geminiImages.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });

      // Add audio if any
      if (geminiAudio) {
        parts.push({
          inlineData: {
            data: geminiAudio.data,
            mimeType: geminiAudio.mimeType
          }
        });
      }

      const response = await (genAI as any).models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts }]
      });
      
      let fullText = '';
      for await (const chunk of response) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setGeminiResponse(fullText);
        }
      }
      
      // Clear images and audio after successful query
      setGeminiImages([]);
      setGeminiAudio(null);
    } catch (error: any) {
      console.error("Error al consultar a Gemini:", error);
      const errorMsg = error?.message || JSON.stringify(error);
      alert(`Hubo un error al consultar a Gemini: ${errorMsg}`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  /**
   * MedScan AI Logic
   */
  const iniciarEscaneo = async () => {
    try {
      // Reset multipage state
      setMedScanCaptures([]);
      setMedScanCroppedImages([]);
      setMedScanCroppingIndex(0);
      setMedScanMode('camera');
      setMedScanCapturedImage(null);

      // Pedimos resolución alta...
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Intentamos activar el enfoque automático continuo si el navegador lo permite
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          try {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }] as any
            });
          } catch (e) {
            console.warn("No se pudo activar el enfoque continuo:", e);
          }
        }
      }

      medScanStreamRef.current = stream;
      setShowMedScanModal(true);
      
      // Delay to ensure video ref is attached
      setTimeout(() => {
        if (medScanVideoRef.current) {
          medScanVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error al iniciar cámara:", err);
      alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
    }
  };

  const cerrarEscaneo = () => {
    if (medScanStreamRef.current) {
      medScanStreamRef.current.getTracks().forEach(track => track.stop());
      medScanStreamRef.current = null;
    }
    setMedScanCapturedImage(null);
    setMedScanCaptures([]);
    setMedScanCroppedImages([]);
    setMedScanMode('camera');
    setShowMedScanModal(false);
  };

  const handleMedScanFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const base64Promises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(base64Promises);
      
      setMedScanCaptures(base64Images);
      setMedScanCropBoxes(base64Images.map(() => ({ x: 50, y: 50, width: 250, height: 150 })));
      setMedScanMode('cropping');
      setMedScanCroppingIndex(0);
      setMedScanCapturedImage(base64Images[0]);
      
      // Stop stream if it was running
      if (medScanStreamRef.current) {
        medScanStreamRef.current.getTracks().forEach(track => track.stop());
        medScanStreamRef.current = null;
      }
      
      // Reset input value to allow re-uploading same files if needed
      e.target.value = '';
    }
  };

  const capturarYDelimitar = async () => {
    if (!medScanVideoRef.current) return;
    
    try {
      const video = medScanVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const base64Image = canvas.toDataURL('image/jpeg');
      setMedScanCaptures(prev => [...prev, base64Image]);
      setMedScanCropBoxes(prev => [...prev, { x: 50, y: 50, width: 250, height: 150 }]);
      
      // Feedback visual opcional: podriamos mostrar una miniatura o un flash
    } catch (err) {
      console.error("Error al capturar:", err);
    }
  };

  const finalizarCaptura = () => {
    if (medScanCaptures.length === 0) return;
    
    if (medScanStreamRef.current) {
      medScanStreamRef.current.getTracks().forEach(track => track.stop());
      medScanStreamRef.current = null;
    }
    
    setMedScanMode('cropping');
    setMedScanCroppingIndex(0);
    setMedScanCapturedImage(medScanCaptures[0]);
    // Use the stored box for page 0
    setCropBox(medScanCropBoxes[0] || { x: 50, y: 50, width: 250, height: 150 });
  };

  // Use a ref to store crop boxes for each page
  useEffect(() => {
    if (medScanMode === 'cropping') {
      const newBoxes = [...medScanCropBoxes];
      newBoxes[medScanCroppingIndex] = cropBox;
      if (JSON.stringify(medScanCropBoxes[medScanCroppingIndex]) !== JSON.stringify(cropBox)) {
        setMedScanCropBoxes(newBoxes);
      }
    }
  }, [cropBox, medScanCroppingIndex, medScanMode]);

  const cambiarPaginaRecorte = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= medScanCaptures.length) return;
    setMedScanCroppingIndex(newIndex);
    setMedScanCapturedImage(medScanCaptures[newIndex]);
    setCropBox(medScanCropBoxes[newIndex] || { x: 50, y: 50, width: 250, height: 150 });
  };

  const procesarTodoElEscaneo = async () => {
    setIsMedScanLoading(true);
    try {
      const croppedImages: string[] = [];
      
      const previewContainer = document.getElementById('medscan-preview-container');
      if (!previewContainer) throw new Error("Canal de previsualización no encontrado");
      const containerRect = previewContainer.getBoundingClientRect();

      for (let i = 0; i < medScanCaptures.length; i++) {
        const base64 = medScanCaptures[i];
        const box = medScanCropBoxes[i];
        
        const img = document.createElement('img');
        img.src = base64;
        await new Promise(resolve => img.onload = resolve);

        const cropCanvas = document.createElement('canvas');
        const scaleX = img.naturalWidth / containerRect.width;
        const scaleY = img.naturalHeight / containerRect.height;

        cropCanvas.width = box.width * scaleX;
        cropCanvas.height = box.height * scaleY;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx?.drawImage(
          img,
          box.x * scaleX,
          box.y * scaleY,
          box.width * scaleX,
          box.height * scaleY,
          0, 0,
          cropCanvas.width,
          cropCanvas.height
        );

        croppedImages.push(cropCanvas.toDataURL('image/jpeg').split(',')[1]);
      }

      await procesarImagenMedScan(croppedImages);
      cerrarEscaneo();
    } catch (err) {
      console.error("Error al procesar el lote completo:", err);
      alert("Error al procesar las páginas.");
    } finally {
      setIsMedScanLoading(false);
    }
  };

  const procesarImagenMedScan = async (base64Images: string[]) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Clave API no configurada.");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = "Transcribe estas imágenes médicas en orden secuencial, son páginas continuas de un mismo apunte. Devuelve el texto unificado y estructurado. Si hay términos de anatomía o bioquímica, asegúrate de que la ortografía sea correcta.";

      const imageParts = base64Images.map(b64 => ({
        inlineData: {
          data: b64,
          mimeType: "image/jpeg"
        }
      }));

      const response = await (ai as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }
      });

      const text = response.text || "";
      
      // Integration with existing note structure
      const noteId = generateId();
      const rect = containerRef.current?.getBoundingClientRect();
      const newBox: TextBox = {
        id: noteId,
        text: text,
        x: ((rect?.width || 0) / 2 - transform.x) / transform.scale - 100,
        y: ((rect?.height || 0) / 2 - transform.y) / transform.scale - 50,
        width: 300,
        height: 200,
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        backgroundColor: '#ffffff',
      };
      setTextBoxes(prev => [...prev, newBox]);
      setSelectedBoxId(newBox.id);

      // Dexie persistence as requested
      const db = (window as any).db;
      const currentNote = (window as any).currentNote;
      if (db?.notas) {
        await db.notas.add({
          id: noteId,
          text: text,
          timestamp: new Date(),
          exportable: currentNote?.isPurchased ? false : true // Requirement: variable de control
        });
      }

    } catch (error: any) {
      console.error("Error Gemini MedScan:", error);
      alert(`Error al escanear: ${error.message}`);
    }
  };

  const handleImportToCanvas = () => {
    const textToImport = selectedGeminiText || geminiResponse;
    if (!textToImport) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? rect.width / 2 : 100;
    const y = rect ? rect.height / 2 : 100;
    
    const newBox: TextBox = {
      id: generateId(),
      text: textToImport,
      x: (x - transform.x) / transform.scale - 150,
      y: (y - transform.y) / transform.scale - 100,
      width: 300,
      height: 200,
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      backgroundColor: '#ffffff',
    };
    
    setTextBoxes(prev => [...prev, newBox]);
    setSelectedBoxId(newBox.id);
    setGlobalSelectedIds([]);
    
    // Clear selection after import
    setSelectedGeminiText('');
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  useEffect(() => {
    if (globalSelectedIds.length === 1) {
      const id = globalSelectedIds[0];
      if (textBoxes.some(b => b.id === id)) {
        if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
        if (showMediaMenu) setShowMediaMenu(false);
        if (showLinesMenu) setShowLinesMenu(false);
        if (!showTextMenu && isSelectionMode) setShowTextMenu(true);
        if (selectedBoxId !== id) setSelectedBoxId(id);
        
        // Reset others to null for safety
        if (selectedShapeId) setSelectedShapeId(null);
        if (editingCanvasShapeId) setEditingCanvasShapeId(null);
        if (selectedImageId) setSelectedImageId(null);
        if (editingImageId) setEditingImageId(null);
        if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
        if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      } else if (canvasShapes.some(s => s.id === id)) {
        if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
        if (showTextMenu) setShowTextMenu(false);
        if (showMediaMenu) setShowMediaMenu(false);
        if (showLinesMenu) setShowLinesMenu(false);
        if (selectedShapeId !== id) setSelectedShapeId(id);
        
        // Reset others
        if (selectedBoxId) setSelectedBoxId(null);
        if (selectedImageId) setSelectedImageId(null);
        if (editingImageId) setEditingImageId(null);
        if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
        if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      } else if (images.some(i => i.id === id)) {
        if (showMediaMenu) setShowMediaMenu(false);
        if (showTextMenu) setShowTextMenu(false);
        if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
        if (showLinesMenu) setShowLinesMenu(false);
        if (!editingImageId && isSelectionMode) setEditingImageId(id);
        if (selectedImageId !== id) setSelectedImageId(id);
        
        // Reset others
        if (selectedBoxId) setSelectedBoxId(null);
        if (selectedShapeId) setSelectedShapeId(null);
        if (editingCanvasShapeId) setEditingCanvasShapeId(null);
        if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
        if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      } else if (model3DAnimations.some(m => m.id === id) || lottieAnimations.some(l => l.id === id)) {
        if (showMediaMenu) setShowMediaMenu(false);
        if (showTextMenu) setShowTextMenu(false);
        if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
        if (showLinesMenu) setShowLinesMenu(false);
        
        // Clear all single selections
        if (selectedBoxId) setSelectedBoxId(null);
        if (selectedShapeId) setSelectedShapeId(null);
        if (editingCanvasShapeId) setEditingCanvasShapeId(null);
        if (selectedImageId) setSelectedImageId(null);
        if (editingImageId) setEditingImageId(null);
        if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
        if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      } else if (schemaNodes.some(n => n.id === id)) {
        if (selectedSchemaNodeId !== id) setSelectedSchemaNodeId(id);
        if (showTextMenu) setShowTextMenu(false);
        if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
        if (showMediaMenu) setShowMediaMenu(false);
        if (showLinesMenu) setShowLinesMenu(false);
        
        // Reset others
        if (selectedBoxId) setSelectedBoxId(null);
        if (selectedShapeId) setSelectedShapeId(null);
        if (editingCanvasShapeId) setEditingCanvasShapeId(null);
        if (selectedImageId) setSelectedImageId(null);
        if (editingImageId) setEditingImageId(null);
      }
    } else if (globalSelectedIds.length > 1) {
      // Deactivate individual menus as requested
      if (showTextMenu) setShowTextMenu(false);
      if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
      if (showMediaMenu) setShowMediaMenu(false);
      if (showLinesMenu) setShowLinesMenu(false);
      
      if (editingCanvasShapeId) setEditingCanvasShapeId(null);
      if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      if (editingImageId) setEditingImageId(null);
      
      // Also clear IDs that might trigger menus
      if (selectedBoxId) setSelectedBoxId(null);
      if (selectedShapeId) setSelectedShapeId(null);
      if (selectedImageId) setSelectedImageId(null);
      if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
    } else {
      // Clear everything if length is 0
      if (showTextMenu) setShowTextMenu(false);
      if (showCanvasShapesPanel) setShowCanvasShapesPanel(false);
      if (showMediaMenu) setShowMediaMenu(false);
      if (showLinesMenu) setShowLinesMenu(false);
      if (editingCanvasShapeId) setEditingCanvasShapeId(null);
      if (editingSchemaNodeId) setEditingSchemaNodeId(null);
      if (editingImageId) setEditingImageId(null);
      if (selectedBoxId) setSelectedBoxId(null);
      if (selectedShapeId) setSelectedShapeId(null);
      if (selectedImageId) setSelectedImageId(null);
      if (selectedSchemaNodeId) setSelectedSchemaNodeId(null);
    }
  }, [globalSelectedIds]); // Reduced dependency array to only globalSelectedIds to prevent loop when items are updated

  const addSchema = () => {
    setIsSchemaMode(true);
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? rect.width / 2 : 100;
    const y = rect ? rect.height / 2 : 100;

    // Añadir un pequeño offset aleatorio si ya hay nodos para que no se encimen perfectamente
    const offset = schemaNodes.length > 0 ? (Math.random() * 40 - 20) : 0;

    const newNode: SchemaNode = {
      id: generateId('node-'),
      text: schemaNodes.length === 0 ? 'Nodo Central' : 'Nuevo Nodo',
      x: ((x - transform.x) / transform.scale - 75) + offset,
      y: ((y - transform.y) / transform.scale - 30) + offset,
      width: 150,
      height: 60,
      color: '#8e44ad',
      schemaId: crypto.randomUUID(),
    };
    setSchemaNodes(prev => [...prev, newNode]);
    setSelectedSchemaNodeId(newNode.id);
    setEditingSchemaNodeId(newNode.id);
    setShowMediaMenu(false);
  };

  const addChildNode = (parentId: string) => {
    const parent = schemaNodes.find(n => n.id === parentId);
    if (!parent) return;

    const newNode: SchemaNode = {
      id: generateId('node-'),
      text: 'Nuevo Nodo',
      x: parent.x + 200,
      y: parent.y + (Math.random() * 100 - 50),
      width: 130,
      height: 50,
      color: parent.color,
      parentId: parentId,
      schemaId: parent.schemaId || crypto.randomUUID(),
    };
    setSchemaNodes(prev => [...prev, newNode]);
    setSelectedSchemaNodeId(newNode.id);
    setEditingSchemaNodeId(newNode.id);
  };

  const updateSchemaNode = (id: string, updates: Partial<SchemaNode>) => {
    setSchemaNodes(prev => prev.map(node => node.id === id ? { ...node, ...updates } : node));
  };

  const deleteSchemaNode = (id: string) => {
    setSchemaNodes(prev => prev.filter(node => node.id !== id && node.parentId !== id));
    if (selectedSchemaNodeId === id) setSelectedSchemaNodeId(null);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedGeminiText(selection.toString().trim());
    } else {
      setSelectedGeminiText('');
    }
  };

  const toggleGlobalSelection = useCallback((id: string) => {
    setGlobalSelectedIds(prev => {
      const isAlreadySelected = prev.includes(id);
      const nextSelection = isAlreadySelected ? prev.filter(i => i !== id) : [...prev, id];
      
      // Auto-activate image editing menu if exactly one image is selected in selection mode
      if (nextSelection.length === 1) {
        const selectedId = nextSelection[0];
        const isImage = images.some(img => img.id === selectedId);
        if (isImage) {
          setEditingImageId(selectedId);
          setSelectedImageId(selectedId);
        } else {
          setEditingImageId(null);
        }
      } else {
        setEditingImageId(null);
      }
      
      return nextSelection;
    });
  }, [setGlobalSelectedIds, images]);

  const selectAsset = useCallback((id: string, type: 'shape' | 'box' | 'image' | 'lottie' | 'model3d' | 'schema') => {
    // Si estamos en modo selección, respetamos la selección múltiple y no reseteamos todo
    if (isSelectionMode) {
      setGlobalSelectedIds(prev => 
        prev.includes(id) ? prev : [...prev, id]
      );
      // Actualizamos los selectores individuales solo si el tipo coincide
      if (type === 'shape') setSelectedShapeId(id);
      if (type === 'box') setSelectedBoxId(id);
      if (type === 'image') setSelectedImageId(id);
      if (type === 'lottie') setSelectedLottieId(id);
      if (type === 'model3d') setSelectedModel3DId(id);
      if (type === 'schema') setSelectedSchemaNodeId(id);
      return;
    }

    setSelectedShapeId(type === 'shape' ? id : null);
    setSelectedBoxId(type === 'box' ? id : null);
    setSelectedImageId(type === 'image' ? id : null);
    setSelectedLottieId(type === 'lottie' ? id : null);
    setSelectedModel3DId(type === 'model3d' ? id : null);
    setSelectedSchemaNodeId(type === 'schema' ? id : null);
    setSelectedDrawingId(null);
    
    setEditingSchemaNodeId(prev => (type === 'schema' && prev === id) ? prev : null);
    if (type !== 'shape') setEditingCanvasShapeId(null);
    if (type !== 'image') setEditingImageId(null);

    setGlobalSelectedIds([id]);
  }, [isSelectionMode, setGlobalSelectedIds]);

  const handleShapeSelect = useCallback((id: string) => selectAsset(id, 'shape'), [selectAsset]);
  const handleBoxSelect = useCallback((id: string) => selectAsset(id, 'box'), [selectAsset]);
  const handleImageSelect = useCallback((id: string) => selectAsset(id, 'image'), [selectAsset]);
  const handleLottieSelect = useCallback((id: string) => selectAsset(id, 'lottie'), [selectAsset]);
  const handleModel3DSelect = useCallback((id: string) => selectAsset(id, 'model3d'), [selectAsset]);
  const handleSchemaSelect = useCallback((id: string) => selectAsset(id, 'schema'), [selectAsset]);

  const handleUnifiedDrag = (id: string, delta: { x: number, y: number }) => {
    // Dispatch high-performance custom event for smooth movement across all types
    window.dispatchEvent(new CustomEvent('group-drag', { 
      detail: { senderId: id, delta } 
    }));

    // We don't perform React state updates during drag for globalSelectedIds > 1
    // to maintain high FPS on devices like Redmi Pad SE.
    // The final state sync happens in onGroupDragEnd which each component calls.
  };

  // Escuchador de alto rendimiento para mover las líneas de esquema en tiempo real
  useEffect(() => {
    const handleGroupDragEvent = (e: any) => {
      const { delta } = e.detail;
      
      // Actualizamos todas las líneas conectadas a nodos seleccionados
      globalSelectedIds.forEach(selectedId => {
        // 1. Línea donde el seleccionado es el HIJO (punto final x2, y2)
        const childLine = document.querySelector(`.schema-connector-${selectedId}`) as SVGLineElement | null;
        if (childLine) {
          childLine.x2.baseVal.value += delta.x;
          childLine.y2.baseVal.value += delta.y;
        }
        
        // 2. Líneas donde el seleccionado es el PADRE (punto inicial x1, y1)
        const parentLines = document.querySelectorAll(`.schema-connector-parent-${selectedId}`);
        parentLines.forEach(line => {
          const l = line as SVGLineElement;
          if (l) {
            l.x1.baseVal.value += delta.x;
            l.y1.baseVal.value += delta.y;
          }
        });
      });
    };

    window.addEventListener('group-drag', handleGroupDragEvent);
    return () => window.removeEventListener('group-drag', handleGroupDragEvent);
  }, [globalSelectedIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const lottieData = JSON.parse(event.target?.result as string);
          const newLottie: LottieAnimation = {
            id: generateId(),
            x: 100,
            y: 100,
            scale: 1,
            data: lottieData,
            isPlaying: false
          };
          setLottieAnimations(prev => [...prev, newLottie]);
          setShowMediaMenu(false);
        } catch (error) {
          console.error("Error parsing Lottie JSON:", error);
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
      console.log("3D Model file detected:", file.name);
      const url = URL.createObjectURL(file);
      console.log("Generated Blob URL:", url);
      const newModel: Model3DAnimation = {
        id: generateId(),
        x: 100,
        y: 100,
        scale: 1,
        src: url
      };
      setModel3DAnimations(prev => [...prev, newModel]);
      setShowMediaMenu(false);
    } else if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.onload = () => {
        const maxWidth = 500;
        const maxHeight = 500;
        let w = img.width;
        let h = img.height;
        
        if (w > maxWidth) {
          h = (maxWidth / w) * h;
          w = maxWidth;
        }
        if (h > maxHeight) {
          w = (maxHeight / h) * w;
          h = maxHeight;
        }

        const newImage: CanvasImage = {
          id: generateId(),
          src: url,
          x: (window.innerWidth / 2 - transform.x) / transform.scale - w / 2,
          y: (window.innerHeight / 2 - transform.y) / transform.scale - h / 2,
          width: w,
          height: h,
          rotation: 0
        };
        setImages(prev => [...prev, newImage]);
        setShowMediaMenu(false);
      };
      img.src = url;
    }
  };

  const updateLottieAnimation = (id: string, updates: any) => {
    setLottieAnimations(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const updateModel3DAnimation = (id: string, updates: any) => {
    setModel3DAnimations(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateCanvasImage = useCallback((id: string, updates: Partial<CanvasImage> & { _delete?: boolean }) => {
    if (updates._delete) {
      setImages(prev => prev.filter(img => img.id !== id));
      if (selectedImageId === id) setSelectedImageId(null);
      if (editingImageId === id) setEditingImageId(null);
      return;
    }
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  }, [selectedImageId, editingImageId]);

  const handleImageUpdate = updateCanvasImage;

  const handleImageLongPress = useCallback((id: string) => {
    setEditingImageId(id);
  }, []);

  const handleAddLabelToImage = () => {
    if (!editingImageId || !newLabelText.trim()) return;

    const targetImg = images.find(img => img.id === editingImageId);
    if (!targetImg) return;

    const newLabel: CanvasImageLabel = {
      id: generateId(),
      text: newLabelText,
      type: newLabelType,
      color: newLabelColor,
      anchorX: 0.5,
      anchorY: 0.5,
      // Initialize with absolute coordinates nearby the image
      labelX: targetImg.x + targetImg.width * 0.7,
      labelY: targetImg.y + targetImg.height * 0.4,
      lineWidth: newLabelLineWidth,
      isOpen: newLabelType === 'fixed',
      lineStyle: newLabelLineStyle
    };

    updateCanvasImage(editingImageId, { 
      labels: [...(targetImg.labels || []), newLabel] 
    });

    setNewLabelText('');
    setShowImageLabelEditor(false);
  };

  const handleGroupDragEnd = (id: string) => {
    // When drag ends, sync ALL selected boxes to the parent state
    // We need to get the current positions from the DOM or motion values
    // Since we don't have easy access to other components' motion values here,
    // we'll rely on the fact that the state update at the end is fine.
    // However, we need to know the FINAL positions.
    // Let's use a simpler approach: the TextBoxComponent will call onUpdate at the end.
  };

  return (
    <div className="lienzo-de-med" style={{ 
      '--subject-color': color,
      '--subject-color-light': `${color}cc`
    } as React.CSSProperties}>
      <style>{`
        .contenedor-fijo-lineas {
          position: relative !important;
          display: inline-block !important;
        }
        .sub-menu-completo-de-boton-de-insertar-lineas,
        .sub-menu-completo-de-instance {
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          margin-bottom: 21px !important; /* Adjusted margin to avoid overlap as per common tablet issues */
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 5px !important; /* Exact match with figma gap */
          z-index: 1000 !important;
          background-color: transparent !important;
          border: none !important;
        }

        .div-3 {
          align-items: flex-start !important;
          background-color: #232323 !important;
          border-radius: 3px !important;
          display: flex !important;
          gap: 5px !important;
          height: 27px !important;
          padding: 3px 14px 4px 9px !important;
          position: relative !important;
          width: 156px !important;
        }

        .sub-menu-lineas-fila-inferior {
          display: flex !important;
          align-items: flex-end !important;
          gap: 8px !important;
        }

        .sub-menu-lineas-horizontal {
          background-color: #232323 !important;
          border-radius: 12px !important;
          padding: 6px !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }

        .sub-menu-lineas-vertical {
          background-color: #000000 !important;
          border-radius: 12px !important;
          padding: 6px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }

        .botones-principales-lineas {
          display: flex !important;
          gap: 6px !important;
        }

        .boton-linea, .boton-vertical {
          background-color: #000000 !important;
          border: none !important;
          border-radius: 10px !important;
          width: 42px !important;
          height: 42px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }

        .boton-linea:hover, .boton-vertical:hover {
          background-color: #1a1a1a !important;
        }

        .boton-linea.active {
          border: 1px solid #FFD105 !important;
        }

        .boton-texto-media {
          background-color: #000000 !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 0 16px !important;
          height: 42px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          color: white !important;
          font-family: sans-serif !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          white-space: nowrap !important;
        }

        .boton-texto-media:hover {
          background-color: #1a1a1a !important;
          color: #FFD105 !important;
        }

        .contador-lineas {
          background-color: #000000 !important;
          border: 1px solid #333333 !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 12px !important;
          gap: 12px !important;
          height: 42px !important;
        }

        .boton-contador {
          background: transparent !important;
          border: none !important;
          color: white !important;
          cursor: pointer !important;
          font-size: 20px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
        }

        .valor-contador {
          color: white !important;
          font-family: sans-serif !important;
          font-size: 24px !important;
          min-width: 30px !important;
          text-align: center !important;
          font-weight: 300 !important;
        }

        .paleta-colores-lineas {
          background-color: #232323 !important;
          border-radius: 20px !important;
          display: flex !important;
          gap: 10px !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.5) !important;
          position: relative !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          padding-top: 8px !important;
          padding-left: 8px !important;
          padding-right: 12px !important;
          padding-bottom: 4px !important;
          margin-left: -41px !important;
          margin-right: 2px !important;
          margin-top: -5px !important;
          margin-bottom: -64px !important;
        }
        .ellipse-black, .ellipse-yellow, .ellipse-green, .ellipse-purple, .ellipse-pink, .ellipse-cyan, .ellipse-red {
          width: 20px !important;
          height: 20px !important;
          border-radius: 50% !important;
          border: 2px solid transparent !important;
          cursor: pointer !important;
          transition: transform 0.2s !important;
        }
        .ellipse-black { background-color: #000000 !important; }
        .ellipse-yellow { background-color: #FFD105 !important; }
        .ellipse-green { background-color: #00ff00 !important; }
        .ellipse-purple { background-color: #7500c9 !important; }
        .ellipse-pink { background-color: #fe19fa !important; }
        .ellipse-cyan { background-color: #0bf5e6 !important; }
        .ellipse-red { background-color: #ff2c2c !important; }
        .ellipse-black:hover, .ellipse-yellow:hover, .ellipse-green:hover, .ellipse-purple:hover, .ellipse-pink:hover, .ellipse-cyan:hover, .ellipse-red:hover {
          transform: scale(1.2) !important;
        }
        .boton-linea.active {
          background: rgba(255,255,255,0.2) !important;
          border: 1px solid #FFD105 !important;
        }
        .sub-menu-lineas-horizontal {
          background-color: #1a1a1a !important;
          border-radius: 12px !important;
          padding: 6px 12px !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          height: 50px !important;
        }
        .botones-principales-lineas {
          display: flex !important;
          gap: 4px !important;
        }
        .boton-linea, .boton-contador, .boton-vertical {
          background: none !important;
          border: none !important;
          padding: 6px !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          transition: background 0.2s !important;
          color: white !important;
        }
        .boton-linea:hover, .boton-contador:hover, .boton-vertical:hover {
          background: rgba(255,255,255,0.1) !important;
        }
        .separador-lineas {
          width: 1px !important;
          height: 30px !important;
          background-color: rgba(255,255,255,0.2) !important;
          margin: 0 4px !important;
        }
        .contador-lineas {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: rgba(0,0,0,0.3) !important;
          padding: 2px 10px !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          height: 38px !important;
        }
        .valor-contador {
          color: white !important;
          font-family: sans-serif !important;
          font-size: 22px !important;
          font-weight: 400 !important;
          min-width: 30px !important;
          text-align: center !important;
        }
        .sub-menu-lineas-vertical {
          background-color: #1a1a1a !important;
          border-radius: 12px !important;
          padding: 6px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          width: 44px !important;
        }
        .boton-vertical {
          height: 32px !important;
          width: 32px !important;
        }
        .sub-menu-formas-flotante {
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          margin: 0 !important;
          margin-bottom: 10px !important;
          background-color: #1a1a1a !important;
          padding: 12px !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          z-index: 2000 !important;
          width: 280px !important;
          display: block !important;
          height: auto !important;
          max-height: 350px !important;
          overflow-y: auto !important;
          scrollbar-width: none !important;
        }
        .sub-menu-formas-flotante::-webkit-scrollbar {
          display: none !important;
        }

        /* PDF.js Text Layer Styles */
        .textLayer {
          position: absolute;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          color: transparent;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer span {
          color: transparent;
          position: absolute;
          white-space: pre;
          cursor: text;
          transform-origin: 0% 0%;
        }
        .textLayer ::selection {
          background: rgba(0, 0, 255, 0.2);
          color: transparent;
        }

        .pdf-selection-sidebar {
          width: 320px !important;
          background-color: #1a1a1a !important;
          border-left: 1px solid rgba(255,255,255,0.1) !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        .pdf-selection-item {
          background-color: rgba(255,255,255,0.03) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          padding: 12px !important;
          margin-bottom: 12px !important;
          position: relative !important;
          transition: all 0.2s !important;
        }
        .pdf-selection-item:hover {
          background-color: rgba(255,255,255,0.06) !important;
          border-color: rgba(255,209,5,0.3) !important;
        }
        .pdf-selection-item textarea {
          background: none !important;
          border: none !important;
          color: rgba(255,255,255,0.7) !important;
          font-size: 11px !important;
          width: 100% !important;
          resize: none !important;
          outline: none !important;
          line-height: 1.5 !important;
          padding: 0 !important;
        }

        .shapes-menu-grid {
          display: grid !important;
          grid-template-columns: repeat(5, 44px) !important;
          gap: 8px !important;
          justify-content: center !important;
          padding: 0 !important;
          background: transparent !important;
        }
        .shapes-menu-grid button {
          width: 44px !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: #232323 !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
          color: white !important;
          padding: 0 !important;
        }
        .shapes-menu-grid button:hover {
          background-color: #333333 !important;
          transform: scale(1.05) !important;
          border-color: #FFD105 !important;
        }
        .shapes-menu-grid button.active {
          border-color: #FFD105 !important;
          background-color: #333333 !important;
          box-shadow: 0 0 10px rgba(255, 209, 5, 0.3) !important;
        }
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          pointer-events: auto !important;
        }
        /* Aggressive overrides for main bars */
        .barra-de-botones, 
        .control-container .barra-de-botones,
        div#root div.barra-de-botones {
          height: 44px !important;
          margin-left: 1px !important;
          margin-top: 0px !important;
          margin-bottom: 0px !important;
          margin-right: 1px !important;
          position: relative !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          transform: none !important;
          width: auto !important;
          min-width: 0 !important;
          background-color: #333333 !important;
          border-radius: 40px !important;
          padding: 0 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        }
        .div-4,
        .control-container .div-4,
        div#root div.div-4 {
          height: 56px !important;
          margin-left: 0px !important;
          margin-top: 0px !important;
          margin-bottom: 0px !important;
          margin-right: 0px !important;
          position: relative !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          transform: none !important;
          width: auto !important;
          min-width: 0 !important;
          background-color: #232323 !important;
          border: 3px solid #FFD105 !important;
          border-radius: 40px !important;
          padding: 0 20px !important;
          gap: 10px !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6) !important;
        }
        .frame .propiedad,
        .frame .propiedad-activada,
        .frame .propiedad-activado {
          height: 40px !important;
          width: 40px !important;
          border-radius: 12px !important;
        }
        /* Ensure all sub-panels (Style, Font Size) are centered and have the 5px gap */
        .control-container .div-2 {
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          margin-bottom: 5px !important;
          z-index: 1000 !important;
          margin-left: 0 !important;
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 10px !important;
          background-color: #232323 !important;
          border-radius: 12px !important;
          padding: 8px 12px !important;
          box-shadow: 0 8px 25px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          height: 48px !important;
          width: auto !important;
          min-width: 0 !important;
        }
        .style-panel-tail {
          content: "" !important;
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 0 !important;
          height: 0 !important;
          border-left: 10px solid transparent !important;
          border-right: 10px solid transparent !important;
          border-top: 10px solid #232323 !important;
          border-bottom: 0 !important;
          z-index: 1001 !important;
        }
        .icons-grid {
          display: grid !important;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 10px !important;
          padding: 5px !important;
          background: transparent !important;
        }
        .ellipse-yellow, .ellipse-green, .ellipse-purple, .ellipse-pink, .ellipse-cyan, .ellipse-red {
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          border: 2px solid rgba(255,255,255,0.2) !important;
          cursor: pointer !important;
          transition: transform 0.2s !important;
          flex-shrink: 0 !important;
        }
        .ellipse-yellow { background-color: #FFD105 !important; }
        .ellipse-green { background-color: #00ff00 !important; }
        .ellipse-purple { background-color: #7500c9 !important; }
        .ellipse-pink { background-color: #fe19fa !important; }
        .ellipse-cyan { background-color: #0bf5e6 !important; }
        .ellipse-red { background-color: #ff2c2c !important; }
        .ellipse-none {
          width: 24px !important;
          height: 24px !important;
          border-radius: 50% !important;
          border: 2px solid rgba(255,255,255,0.4) !important;
          cursor: pointer !important;
          transition: transform 0.2s !important;
          flex-shrink: 0 !important;
          background-color: transparent !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .ellipse-none::after {
          content: "" !important;
          position: absolute !important;
          width: 100% !important;
          height: 2px !important;
          background-color: #ff2c2c !important;
          transform: rotate(-45deg) !important;
        }
      `}</style>
      {/* Barra Superior (Rectangle con borde degradado) */}
      <div className="rectangle"></div>
      
      <div className="flex items-center gap-2 p-0 absolute top-[18px] left-[12px] z-[25]">
        {/* Badge de Título (Segmento superior izquierdo) */}
        <div className="div" style={{ 
          background: gradient, 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative', 
          top: '0', 
          left: '0', 
          flexShrink: 0 
        }}>
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
          <div className="carbohidratos ml-2" style={{ color: 'white', marginRight: '20px' }}>
            {title}
          </div>
        </div>
        
        {!isViewOnly && (
        <div className="flex items-center gap-2 p-1">
          <button 
            id="btn-medscan"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMedScanLoading ? 'animate-pulse' : 'hover:bg-white/10'}`}
            onClick={iniciarEscaneo}
            title="MedScan AI (OCR)"
            style={{ border: `1px solid ${isMedScanLoading ? '#FFD105' : '#8e44ad'}`, backgroundColor: '#1a1a1a', pointerEvents: 'auto' }}
          >
            <Camera size={20} color={isMedScanLoading ? '#FFD105' : '#8e44ad'} />
          </button>
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isGeminiLoading ? 'animate-pulse' : 'hover:bg-white/10'}`}
            onClick={() => setShowGeminiModal(true)}
            title="Consultar a Gemini"
            style={{ border: `1px solid ${isGeminiLoading ? '#FFD105' : '#8e44ad'}`, backgroundColor: '#1a1a1a', pointerEvents: 'auto' }}
          >
            <Sparkles size={20} color={isGeminiLoading ? '#FFD105' : '#8e44ad'} />
          </button>
          <button 
            id="btn-pendientes"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10 relative`}
            onClick={() => setShowPendientes(!showPendientes)}
            title="Notas Rápidas/Pendientes"
            style={{ border: `1px solid ${showPendientes ? '#FFD105' : '#8e44ad'}`, backgroundColor: '#1a1a1a', pointerEvents: 'auto' }}
          >
            <ListTodo size={20} color={showPendientes ? '#FFD105' : '#8e44ad'} />
            {(userNotes.trim().length > 0 || tasks.length > 0) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
            )}
          </button>
          <button 
            id="btn-print-layout"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            onClick={prepararYMostrarMaquetador}
            title="Diseñar e Imprimir PDF"
            style={{ border: `1px solid #8e44ad`, backgroundColor: '#1a1a1a', pointerEvents: 'auto' }}
          >
            <Printer size={20} color="#8e44ad" />
          </button>
          <button 
            id="btn-manual-pdf"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white/10`}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/pdf';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  setManualPDFFile(file);
                  setShowManualPDF(true);
                }
              };
              input.click();
            }}
            title="Selector Manual de PDF"
            style={{ border: `1px solid #8e44ad`, backgroundColor: '#1a1a1a', pointerEvents: 'auto' }}
          >
            <FileText size={20} color="#8e44ad" />
          </button>
          
          <button 
            id="btn-export-single"
            onClick={handleSingleExport}
            className="flex items-center gap-2 px-3 h-10 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg transition-all active:scale-95"
            title="Exportar archivo de nota (.json)"
            style={{ pointerEvents: 'auto' }}
          >
            <FileDown size={18} />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Exportar</span>
          </button>

          <input 
            type="file" 
            ref={pdfInputRef} 
            className="hidden" 
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePDFUpload(file);
            }}
          />
        </div>
        )}
      </div>

      {/* Side Panel: Pendientes */}
      <AnimatePresence>
        {showPendientes && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPendientes(false)}
              className="fixed inset-0 bg-black/20 z-[49] pointer-events-auto"
            />
            <motion.div
              id="panel-pendientes"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[350px] bg-[#fdfaf1] shadow-[-10px_0_30px_rgba(0,0,0,0.15)] z-[50] flex flex-col p-6 pointer-events-auto"
              style={{ borderLeft: '2px solid rgba(142,68,173,0.3)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8e44ad]/10 flex items-center justify-center">
                    <ListTodo size={18} color="#8e44ad" />
                  </div>
                  <h2 className="text-[#2c3e50] font-bold text-xl tracking-tight font-poppins">Pendientes</h2>
                </div>
                <button 
                  onClick={() => setShowPendientes(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={24} color="#2c3e50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* Tareas Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#2c3e50]/40 uppercase text-[10px] font-black tracking-[0.2em]">Tareas Check</h3>
                    <button 
                      onClick={handleAddTask}
                      className="p-1 hover:bg-[#8e44ad]/10 rounded-md transition-all text-[#8e44ad] flex items-center gap-1"
                    >
                      <Plus size={14} strokeWidth={3} />
                      <span className="text-[10px] font-black">AÑADIR</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.map(task => (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex items-start gap-3 p-2 rounded-xl hover:bg-white transition-all shadow-sm border border-transparent hover:border-[#8e44ad]/10"
                      >
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-1 transition-all ${task.completed ? 'text-green-500' : 'text-[#8e44ad]/40'}`}
                        >
                          {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                        </button>
                        <input 
                          type="text"
                          value={task.text}
                          onChange={(e) => handleUpdateTaskText(task.id, e.target.value)}
                          placeholder="Nueva tarea..."
                          className={`flex-1 bg-transparent border-none outline-none text-[#2c3e50] font-medium transition-all ${task.completed ? 'line-through opacity-40' : ''}`}
                        />
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-[#2c3e50]/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-[#2c3e50]/5 rounded-2xl">
                        <p className="text-[11px] text-[#2c3e50]/30 font-medium">No hay tareas pendientes</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas Section */}
                <div className="flex-1 h-[400px] flex flex-col">
                  <h3 className="text-[#2c3e50]/40 uppercase text-[10px] font-black tracking-[0.2em] mb-4">Notas Libres</h3>
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:100%_30px] pointer-events-none" />
                    <textarea
                      className="w-full h-full bg-transparent border-none outline-none resize-none font-sans text-lg text-[#2c3e50] leading-[30px] py-0 relative z-10 placeholder:text-[#2c3e50]/30"
                      placeholder="Anotaciones extra..."
                      value={userNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-top border-[#2c3e50]/10 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 text-[#2c3e50]/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Autoguardado</span>
                </div>
                {tasks.length > 0 && (
                  <span className="text-[#8e44ad]">
                    {tasks.filter(t => t.completed).length}/{tasks.length} completado
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isSchemaMode && (
        <div className="fixed top-[100px] left-6 z-[9999] pointer-events-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsSchemaMode(false);
              setSelectedSchemaNodeId(null);
              setEditingSchemaNodeId(null);
            }}
            className="flex items-center gap-3 bg-[#8e44ad] text-white px-6 py-3 rounded-full border-2 border-white/40 shadow-[0_0_30px_rgba(142,68,173,0.6)] hover:bg-[#9b59b6] transition-all active:scale-95 cursor-pointer"
          >
            <X size={22} strokeWidth={3} />
            <span className="text-sm font-black uppercase tracking-widest">Salir de Esquemas</span>
          </button>
        </div>
      )}

      {isSelectionMode && (
        <div className="absolute top-[90px] left-1/2 -translate-x-1/2 z-50">
          <div className="bg-[#FFD105] text-black px-6 py-2 rounded-full font-medium shadow-lg animate-bounce">
            Seleccionar los elementos que se editarán
          </div>
        </div>
      )}

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
          cursor: isPanning ? 'grabbing' : isHandMode ? 'grab' : isHighlighterActive ? 'crosshair' : showTextMenu ? 'text' : showLinesMenu ? 'crosshair' : 'default',
          overflow: 'hidden',
          touchAction: 'none',
          backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`,
          backgroundSize: `${40 * transform.scale}px ${40 * transform.scale}px`,
          backgroundPosition: `${transform.x}px ${transform.y}px`,
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        <div 
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedShapeId(null);
              setEditingCanvasShapeId(null);
              setSelectedImageId(null);
              setEditingImageId(null);
              setSelectedBoxId(null);
              setSelectedLottieId(null);
              setSelectedModel3DId(null);
              setSelectedDrawingId(null);
              setEditingSchemaNodeId(null);
            }
          }}
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: isPanning ? 'none' : 'auto',
            zIndex: 2,
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            marginTop: '0px'
          }}
        >
          <svg 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '10000%', 
              height: '10000%', 
              pointerEvents: 'none',
              overflow: 'visible'
            }}
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="2" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {drawings.filter(d => d.showArrowHead || d.showDoubleArrowHead).map(d => (
                <React.Fragment key={`markers-${d.id}`}>
                  <marker
                    id={`arrowhead-end-${d.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="8"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill={d.color} />
                  </marker>
                  {d.showDoubleArrowHead && (
                    <marker
                      id={`arrowhead-start-${d.id}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="0"
                      refY="4"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M8,0 L0,4 L8,8 Z" fill={d.color} />
                    </marker>
                  )}
                </React.Fragment>
              ))}
            </defs>
            
            {/* Conexiones de Esquemas */}
            {schemaNodes.map(node => {
              if (!node.parentId) return null;
              const parent = schemaNodes.find(n => n.id === node.parentId);
              if (!parent) return null;

              const startX = parent.x + parent.width / 2;
              const startY = parent.y + parent.height / 2;
              const endX = node.x + node.width / 2;
              const endY = node.y + node.height / 2;

              return (
                <line
                  key={`conn-${node.id}`}
                  className={`schema-connector-${node.id} schema-connector-parent-${node.parentId}`}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={node.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              );
            })}

            {drawings.map(renderDrawing)}
          </svg>

          {textBoxes.map((box) => (
            <TextBoxComponent
              key={box.id}
              {...box}
              rotation={box.rotation || 0}
              zIndex={box.zIndex || 10}
              isSelected={box.id === selectedBoxId}
              isMultiSelected={globalSelectedIds.length > 1 && globalSelectedIds.includes(box.id)}
              isSelectionMode={isSelectionMode}
              canEdit={showTextMenu}
              onSelect={handleBoxSelect}
              onToggleMultiSelect={toggleGlobalSelection}
              onLongPress={(id) => {
                if (!showTextMenu) setShowTextMenu(true);
              }}
              onUpdate={updateTextBox}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
              onEditingChange={handleEditingChange}
              canvasScale={transform.scale}
              isHandMode={isHandMode}
            />
          ))}

          {canvasShapes.map((shape) => (
            <CanvasShapeComponent
              key={shape.id}
              {...shape}
              isSelected={selectedShapeId === shape.id}
              isMultiSelected={globalSelectedIds.length > 1 && globalSelectedIds.includes(shape.id)}
              isSelectionMode={isSelectionMode}
              isHandMode={isHandMode}
              isEditing={editingCanvasShapeId === shape.id}
              onSelect={handleShapeSelect}
              onStartEdit={() => setEditingCanvasShapeId(shape.id)}
              onToggleMultiSelect={toggleGlobalSelection}
              onUpdate={updateCanvasShape}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
              canvasScale={transform.scale}
            />
          ))}

          {images.map((img) => (
            <CanvasImageComponent
              key={img.id}
              {...img}
              rotation={img.rotation || 0}
              zIndex={img.zIndex || 10}
              isSelected={img.id === selectedImageId}
              isMultiSelected={globalSelectedIds.length > 1 && globalSelectedIds.includes(img.id)}
              isSelectionMode={isSelectionMode}
              canEdit={true}
              onSelect={handleImageSelect}
              onInteraction={(e) => handleImageInteraction(img.id, e)}
              isEditing={img.id === editingImageId}
              onToggleMultiSelect={toggleGlobalSelection}
              onUpdate={updateCanvasImage}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
              canvasScale={transform.scale}
              isHandMode={isHandMode}
            />
          ))}
          {lottieAnimations.map((lottie) => (
            <LottieComponent
              key={lottie.id}
              {...lottie}
              isSelected={selectedLottieId === lottie.id}
              isMultiSelected={globalSelectedIds.includes(lottie.id)}
              isSelectionMode={isSelectionMode}
              isHandMode={isHandMode}
              onSelect={handleLottieSelect}
              onToggleMultiSelect={toggleGlobalSelection}
              onUpdate={updateLottieAnimation}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
              canvasScale={transform.scale}
            />
          ))}
          {model3DAnimations.map((model) => (
            <Model3DComponent
              key={model.id}
              {...model}
              isSelected={selectedModel3DId === model.id}
              isMultiSelected={globalSelectedIds.includes(model.id)}
              isSelectionMode={isSelectionMode}
              isHandMode={isHandMode}
              onSelect={handleModel3DSelect}
              onToggleMultiSelect={toggleGlobalSelection}
              onUpdate={updateModel3DAnimation}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
              canvasScale={transform.scale}
            />
          ))}
          
          {schemaNodes.map((node) => (
            <SchemaNodeComponent
              key={node.id}
              {...node}
              isSelected={selectedSchemaNodeId === node.id}
              isMultiSelected={globalSelectedIds.includes(node.id)}
              isSelectionMode={isSelectionMode}
              isSchemaMode={isSchemaMode}
              canvasScale={transform.scale}
              onSelect={handleSchemaSelect}
              onInteraction={(e) => handleSchemaInteraction(e, node.schemaId || node.id, node.id)}
              onCancelInteraction={handleCancelSchemaInteraction}
              onToggleMultiSelect={toggleGlobalSelection}
              onUpdate={updateSchemaNode}
              onDelete={deleteSchemaNode}
              onAddChild={addChildNode}
              onStartEdit={(id) => setEditingSchemaNodeId(id)}
              onGroupDrag={handleUnifiedDrag}
              onGroupDragEnd={() => {}}
            />
          ))}

          {/* Group Multiple Schema Selector Buttons */}
          {isSelectionMode && Array.from(
            schemaNodes.reduce((acc, node) => {
              const sId = node.schemaId || node.id;
              if (!acc.has(sId)) {
                acc.set(sId, []);
              }
              acc.get(sId).push(node);
              return acc;
            }, new Map<string, typeof schemaNodes>()).entries()
          ).map(([sId, nodes]) => {
            // Find base position below the group
            const minX = Math.min(...nodes.map(n => n.x));
            const maxX = Math.max(...nodes.map(n => n.x + n.width));
            const maxY = Math.max(...nodes.map(n => n.y + n.height));
            const centerX = (minX + maxX) / 2;
            
            return (
              <div
                key={`schema-group-btn-${sId}`}
                style={{
                  position: 'absolute',
                  left: centerX,
                  top: maxY + 20,
                  transform: 'translateX(-50%)',
                  zIndex: 1002,
                }}
              >
                <button
                  title="Seleccionar esquema completo"
                  className="w-10 h-10 bg-[#8e44ad] hover:scale-110 outline outline-2 outline-white text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer pointer-events-auto transition-transform"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const fullSchema = schemaNodes.filter(n => n.schemaId === sId || n.id === sId);
                    const schemaIds = fullSchema.map(n => n.id);
                    
                    setGlobalSelectedIds(prev => {
                      // Si estamos en modo selección, sumamos al grupo
                      if (isSelectionMode) {
                        return [...new Set([...prev, ...schemaIds])];
                      }
                      // Si no, reemplazamos
                      return schemaIds;
                    });
                    setTransformGroupId(`group-${crypto.randomUUID()}`);
                  }}
                >
                  <Network size={20} />
                </button>
              </div>
            );
          })}
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
          <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
            <button 
              onClick={zoomIn}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-b border-gray-100"
              title="Aumentar zoom"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 bg-gray-50/50">
              {Math.round(transform.scale * 100)}%
            </div>
            <button 
              onClick={zoomOut}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors border-t border-gray-100"
              title="Disminuir zoom"
            >
              <Minus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Herramientas (Segmento inferior con botones negros) */}
      {!isViewOnly && (
      <div className="frame frame-insert-lines" style={{ position: 'fixed', bottom: '10px', left: '0', width: '100%', height: 'auto', pointerEvents: 'none', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="control-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
          
          {isSchemaMode && !editingSchemaNodeId && (
            <div className="absolute bottom-[75px] left-1/2 -translate-x-1/2 z-[10001] pointer-events-auto">
              <button 
                onClick={addSchema}
                style={{ marginLeft: '-4px', marginTop: '0px', marginBottom: '21px' }}
                className="flex items-center gap-3 bg-[#232323] text-white px-8 py-4 rounded-full border-2 border-[#FFD105] shadow-[0_0_25px_rgba(255,209,5,0.4)] hover:scale-105 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle size={26} className="text-[#FFD105]" />
                <span className="text-base font-black uppercase tracking-widest">Añadir Nodo</span>
              </button>
            </div>
          )}

          {/* Sub-menús reubicados dentro de sus botones correspondientes */}
          
          {showTextMenu ? (
            <div className="div-4" style={{ 
              marginLeft: '16px', 
              marginTop: '0px', 
              marginRight: '-3px', 
              marginBottom: '0px',
              height: '56px',
              padding: '0 20px',
              gap: '10px'
            }}>
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

              <button 
                className="propiedad"
                onClick={() => addTextBox()}
                title="Añadir Nota de Texto"
              >
                <Plus size={24} color="#FFD105" />
              </button>
              
              <div className="w-px h-10 bg-white/10 mx-1" />

              <button 
                className={textStyle.bold ? 'propiedad-activada' : 'propiedad'}
                onClick={() => toggleProperty('fontWeight', 'bold', 'normal')}
              >
                <Bold size={24} color={textStyle.bold ? '#FFD105' : 'white'} />
              </button>
              <button 
                className={textStyle.italic ? 'propiedad-activada' : 'propiedad'}
                onClick={() => toggleProperty('fontStyle', 'italic', 'normal')}
              >
                <Italic size={24} color={textStyle.italic ? '#FFD105' : 'white'} />
              </button>
              <button 
                className={textStyle.underline ? 'propiedad-activada' : 'propiedad'}
                onClick={() => toggleProperty('textDecoration', 'underline', 'none')}
              >
                <Underline size={24} color={textStyle.underline ? '#FFD105' : 'white'} />
              </button>

              <div className="w-px h-10 bg-white/10 mx-1" />

              <button className="propiedad" onClick={() => setShowTextMenu(false)}>
                <span className="text-wrapper">&lt;</span>
              </button>
              <div className="contenedor-fijo-fuente" style={{ position: 'relative', display: 'inline-block' }}>
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
                {showFontSizePanel && (
                  <div 
                    ref={fontSizePanelRef}
                    className="div-2" 
                    tabIndex={0}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minWidth: '320px', 
                      maxWidth: '450px',
                      overflowX: 'auto', 
                      whiteSpace: 'nowrap', 
                      padding: '0 40px', 
                      scrollbarWidth: 'none',
                      cursor: isDraggingFontSize.current ? 'grabbing' : 'grab',
                      outline: 'none',
                      height: '60px'
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
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#FFD105]/20 -translate-x-1/2 pointer-events-none"></div>
                    <div className="style-panel-tail" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                  </div>
                )}
              </div>
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
                    color={activeProperty === 'Book' ? '#FFD105' : 'white'} 
                    fill={activeProperty === 'Book' ? '#FFD105' : 'none'}
                    fillOpacity={activeProperty === 'Book' ? 0.3 : 0}
                    strokeWidth={1.5} 
                  />
                  <span className={`absolute text-[8px] font-bold top-[5px] ${activeProperty === 'Book' ? 'text-[#FFD105]' : 'text-white'}`}>A</span>
                </div>
              </button>
              <div className="contenedor-fijo-estilo" style={{ position: 'relative', display: 'inline-block' }}>
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
                    color={isHighlighterActive ? '#FFD105' : 'white'} 
                    fill={isHighlighterActive ? '#FFD105' : 'none'}
                    fillOpacity={isHighlighterActive ? 0.3 : 0}
                    strokeWidth={1.5} 
                  />
                </button>
                {showStylePanel && (
                  <div className="div-2">
                    <button className="ellipse-none" title="Sin color" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', isHighlighterActive ? 'transparent' : '#ffffff')}></button>
                    <button className="ellipse-yellow" title="Amarillo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#FFD105')}></button>
                    <button className="ellipse-green" title="Verde" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#00ff00')}></button>
                    <button className="ellipse-purple" title="Morado" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#7500c9')}></button>
                    <button className="ellipse-pink" title="Rosa" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#fe19fa')}></button>
                    <button className="ellipse-cyan" title="Cian" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#0bf5e6')}></button>
                    <button className="ellipse-red" title="Rojo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#ff2c2c')}></button>
                    <div className="w-[1px] h-6 bg-white/20 mx-1" />
                    <button 
                      onClick={() => adjustZIndex('front')}
                      className="p-1 hover:bg-white/10 rounded text-white" 
                      title="Traer al frente"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => adjustZIndex('back')}
                      className="p-1 hover:bg-white/10 rounded text-white" 
                      title="Enviar al fondo"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <div className="style-panel-tail"></div>
                  </div>
                )}
              </div>
              <div className="contenedor-fijo-formas" style={{ position: 'relative', display: 'inline-block' }}>
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
                    color={activeProperty === 'Diamond' ? '#FFD105' : 'white'} 
                    fill={activeProperty === 'Diamond' ? '#FFD105' : 'none'}
                    fillOpacity={activeProperty === 'Diamond' ? 0.3 : 0}
                    strokeWidth={1.5} 
                  />
                </button>
                {showIconsPanel && showTextMenu && (
                  <div className="sub-menu-formas-flotante" 
                    onMouseDown={(e) => e.preventDefault()} 
                  >
                    <div className="shapes-menu-grid" 
                      onMouseDown={(e) => e.preventDefault()} 
                    >
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
                        <button 
                          key={item.id} 
                          className={`${item.id} ${activeShape === item.id ? 'active' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault(); 
                            setActiveShape(item.id);
                            
                            const svgMarkup = renderToStaticMarkup(React.cloneElement(item.icon as any, { 
                              size: '1em', 
                              color: 'currentColor',
                              style: { display: 'inline-block', verticalAlign: 'middle', pointerEvents: 'none' }
                            }));
                            
                            const iconHtml = `<span class="inserted-icon" contenteditable="false" style="display:inline-block; vertical-align:middle; width:20px; height:auto; margin:0 2px; pointer-events:none;">${svgMarkup}</span>&#8203;`;
                            
                            const onSuccess = () => {
                              setTimeout(() => setShowIconsPanel(false), 100);
                              window.removeEventListener('insert-icon-success', onSuccess);
                            };
                            window.addEventListener('insert-icon-success', onSuccess);
                            
                            window.dispatchEvent(new CustomEvent('insert-icon', { 
                              detail: { html: iconHtml } 
                            }));
                          }}
                        >
                          {React.cloneElement(item.icon as any, { color: 'white', size: 24 })}
                        </button>
                      ))}
                    </div>
                    <div className="style-panel-tail" style={{ left: '50%', bottom: '-12px', transform: 'translateX(-50%)' }}></div>
                  </div>
                )}
              </div>
              <button 
                className={activeProperty === 'AlignLeft' ? 'propiedad-activada' : 'propiedad'}
                onClick={() => {
                  setActiveProperty('AlignLeft');
                  applyPropertyToSelected('textAlign', 'left');
                  setShowStylePanel(false);
                  setShowIconsPanel(false);
                }}
              >
                <AlignLeft size={20} color={activeProperty === 'AlignLeft' ? '#FFD105' : 'white'} strokeWidth={1.5} />
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
                <AlignCenter size={20} color={activeProperty === 'AlignCenter' ? '#FFD105' : 'white'} strokeWidth={1.5} />
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
                <AlignRight size={20} color={activeProperty === 'AlignRight' ? '#FFD105' : 'white'} strokeWidth={1.5} />
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
                  color={activeProperty === 'Clipboard' ? '#FFD105' : 'white'} 
                  fill={activeProperty === 'Clipboard' ? '#FFD105' : 'none'}
                  fillOpacity={activeProperty === 'Clipboard' ? 0.3 : 0}
                  strokeWidth={1.5} 
                />
              </button>
            </div>
          ) : editingImageId ? (
            <div className="div-4 relative" style={{ 
              marginLeft: '16px', 
              marginTop: '0px', 
              marginRight: '-3px', 
              marginBottom: '0px',
              height: '56px',
              padding: '0 20px',
              gap: '10px'
            }}>
              <button 
                className={showImageLabelEditor ? 'propiedad-activada' : 'propiedad'}
                onClick={() => setShowImageLabelEditor(!showImageLabelEditor)}
                title="Añadir Etiqueta"
              >
                <Tag size={20} color={showImageLabelEditor ? '#FFD105' : 'white'} />
              </button>

              <div className="w-px h-10 bg-white/10 mx-1" />

              <button 
                className="propiedad" 
                onClick={() => {
                  setImages(prev => prev.filter(img => img.id !== editingImageId));
                  setEditingImageId(null);
                }}
                title="Eliminar Imagen"
                style={{ backgroundColor: 'rgba(255, 44, 44, 0.1)' }}
              >
                <Trash2 size={20} color="#ff2c2c" />
              </button>

              <div className="w-px h-10 bg-white/10 mx-1" />

              <button className="propiedad" onClick={() => setEditingImageId(null)}>
                <span className="text-wrapper">&lt;</span>
              </button>

              {/* Image Label Editor Window */}
              <AnimatePresence>
                {showImageLabelEditor && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/20 p-4 rounded-2xl shadow-2xl z-[1003] w-64"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest opacity-60">Nueva Etiqueta</span>
                        <button onClick={() => setShowImageLabelEditor(false)}><X size={14} className="text-white/40" /></button>
                      </div>
                      
                      <input
                        type="text"
                        value={newLabelText}
                        onChange={(e) => setNewLabelText(e.target.value)}
                        placeholder="Texto..."
                        className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FFD105]"
                        autoFocus
                      />

                      <div className="flex gap-2 justify-center">
                        {['#FFD105', '#00ff00', '#fe19fa', '#0bf5e6', '#ff2c2c', '#ffffff'].map(c => (
                          <button
                            key={c}
                            onClick={() => setNewLabelColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${newLabelColor === c ? 'border-white scale-110' : 'border-black/20'}`}
                          />
                        ))}
                      </div>

                      <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                          onClick={() => setNewLabelType('fixed')}
                          className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${newLabelType === 'fixed' ? 'bg-[#FFD105] text-black' : 'text-white/40'}`}
                        >
                          Fija
                        </button>
                        <button
                          onClick={() => setNewLabelType('interactive')}
                          className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${newLabelType === 'interactive' ? 'bg-[#FFD105] text-black' : 'text-white/40'}`}
                        >
                          Interactiva
                        </button>
                      </div>

                      {newLabelType === 'fixed' && (
                        <>
                          <div className="flex flex-col gap-2">
                            <span className="text-white text-[8px] font-bold uppercase tracking-widest opacity-40 text-center">Grosor de Línea</span>
                            <div className="flex bg-white/5 p-1 rounded-xl">
                              {[1, 2, 4].map((w) => (
                                <button
                                  key={w}
                                  onClick={() => setNewLabelLineWidth(w)}
                                  className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${newLabelLineWidth === w ? 'bg-white/20 text-white' : 'text-white/40'}`}
                                >
                                  {w === 1 ? 'Fino' : w === 2 ? 'Medio' : 'Grueso'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-white text-[8px] font-bold uppercase tracking-widest opacity-40 text-center">Estilo de Línea</span>
                            <div className="flex bg-white/5 p-1 rounded-xl">
                              <button
                                onClick={() => setNewLabelLineStyle('solid')}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${newLabelLineStyle === 'solid' ? 'bg-white/20 text-white' : 'text-white/40'}`}
                              >
                                Sólida
                              </button>
                              <button
                                onClick={() => setNewLabelLineStyle('dashed')}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors ${newLabelLineStyle === 'dashed' ? 'bg-white/20 text-white' : 'text-white/40'}`}
                              >
                                Punteada
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        onClick={handleAddLabelToImage}
                        disabled={!newLabelText.trim()}
                        className="bg-[#FFD105] disabled:opacity-50 text-black rounded-xl py-2 flex items-center justify-center gap-2 font-bold text-sm"
                      >
                        <Plus size={16} /> Insertar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="barra-de-botones" style={{ 
              marginLeft: '0px', 
              marginTop: '0px', 
              marginBottom: '0px', 
              marginRight: '0px' 
            }}>
              <button 
                className={`BOTON-DE-INSERTAR ${isHandMode ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => handleAction('Mano')} 
                title="Mano"
                style={isHandMode ? { borderColor: '#FFD105', borderWidth: '1px' } : {}}
              >
                <span className="icon-instance-node"><Hand size={20} color={isHandMode ? '#FFD105' : 'currentColor'} /></span>
              </button>
              <button 
                className={`BOTON-DE-INSERTAR ${showTextMenu ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss when toggling text menu
                onClick={() => handleAction('Texto')} 
                title="Texto"
                style={showTextMenu ? { borderColor: '#FFD105', borderWidth: '1px' } : {}}
              >
                <span className="icon-instance-node">
                  <Type size={20} color={showTextMenu ? '#FFD105' : 'currentColor'} />
                </span>
              </button>
              <button 
                className={`BOTON-DE-INSERTAR ${isSelectionMode ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => handleAction('Selección')} 
                title="Selección"
                style={isSelectionMode ? { borderColor: '#FFD105', borderWidth: '1px' } : {}}
              >
                <span className="icon-instance-node"><MousePointer2 size={20} color={isSelectionMode ? '#FFD105' : 'currentColor'} /></span>
              </button>
              <div className="contenedor-fijo-lineas" style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                  className={`BOTON-DE-INSERTAR boton-de-anadir-flechas ${showLinesMenu ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => handleAction('Flecha')} 
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setIsCurveMode(!isCurveMode);
                  }}
                  title={isCurveMode ? "Modo Curva Suave" : "Modo Línea Recta"}
                  style={showLinesMenu ? { borderColor: '#FFD105', borderWidth: '1px' } : {}}
                >
                  <span className="icon-instance-node">
                    {isCurveMode ? (
                      <Spline size={20} color={showLinesMenu ? '#FFD105' : 'currentColor'} />
                    ) : (
                      <ArrowUpRight size={20} color={showLinesMenu ? '#FFD105' : 'currentColor'} />
                    )}
                  </span>
                </button>
                {showLinesMenu && (
                    <div className="sub-menu-completo-de-boton-de-insertar-lineas">
                      {showLineColorPalette && (
                        <div className="div-3">
                          <button className="ellipse-black" onClick={() => { setStrokeColor('#000000'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-yellow" onClick={() => { setStrokeColor('#FFD105'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-green" onClick={() => { setStrokeColor('#00ff00'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-instance" onClick={() => { setStrokeColor('#7500c9'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-2-instance" onClick={() => { setStrokeColor('#fe19fa'); setShowLineColorPalette(false); }}></button>
                          <button className="design-component-instance-node" onClick={() => { setStrokeColor('#0bf5e6'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-3" onClick={() => { setStrokeColor('#ff2c2c'); setShowLineColorPalette(false); }}></button>
                        </div>
                      )}
                      <div className="sub-menu-lineas-fila-inferior">
                        <div className="sub-menu-lineas-horizontal">
                          <div className="botones-principales-lineas">
                            <button className={`boton-linea ${lineType === 'zigzag' && !isVectorizing ? 'active' : ''}`} onClick={() => { setLineType('zigzag'); setIsVectorizing(false); }}><Activity size={22} color="white" /></button>
                            <button className={`boton-linea ${lineType === 'curve' && !isVectorizing ? 'active' : ''}`} onClick={() => { setLineType('curve'); setIsVectorizing(false); }}><Spline size={22} color="white" /></button>
                            <button className={`boton-linea ${lineType === 'line' && !isVectorizing ? 'active' : ''}`} onClick={() => { setLineType('line'); setIsVectorizing(false); }}><Minus size={22} color="white" /></button>
                            <button 
                              className={`boton-linea ${isVectorizing ? 'active' : ''}`} 
                              onClick={() => { 
                                const next = !isVectorizing;
                                setIsVectorizing(next); 
                                if (next) {
                                  setEditingDrawingIds([]);
                                  setSelectedPointIndex(null);
                                  setSelectedDrawingIdForPoint(null);
                                }
                              }} 
                              title="Modo Edición"
                            >
                              <MousePointer2 size={22} color="white" />
                            </button>
                            {isVectorizing && (editingDrawingIds.length > 0 || selectedPointIndex !== null) && (
                              <button 
                                className="boton-linea" 
                                onClick={deleteSelectedDrawings}
                                title={selectedPointIndex !== null ? "Eliminar vector seleccionado" : "Eliminar trazos seleccionados"}
                                style={{ backgroundColor: '#ff2c2c' }}
                              >
                                <Trash2 size={22} color="white" />
                              </button>
                            )}
                            <button className={`boton-linea ${showLineColorPalette ? 'active' : ''}`} onClick={() => setShowLineColorPalette(!showLineColorPalette)}><Palette size={22} color="white" /></button>
                          </div>
                          <div className="contador-lineas">
                            <button className="boton-contador" onClick={() => setLineWidth(prev => Math.min(50, prev + 1))}><Plus size={20} color="white" /></button>
                            <span className="valor-contador">{lineWidth}</span>
                            <button className="boton-contador" onClick={() => setLineWidth(prev => Math.max(1, prev - 1))}><Minus size={20} color="white" /></button>
                          </div>
                        </div>
                        <div className="sub-menu-lineas-vertical">
                          <button 
                            className={`boton-vertical ${isOrthogonalMode ? 'active' : ''}`} 
                            onClick={() => setIsOrthogonalMode(!isOrthogonalMode)}
                            style={{ backgroundColor: isOrthogonalMode ? '#FFD105' : 'transparent' }}
                          >
                            <Move size={20} color={isOrthogonalMode ? 'black' : 'white'} />
                          </button>
                          <button 
                            className={`boton-vertical ${showDoubleArrowHead ? 'active' : ''}`} 
                            onClick={() => setShowDoubleArrowHead(!showDoubleArrowHead)}
                            style={{ backgroundColor: showDoubleArrowHead ? '#FFD105' : 'transparent' }}
                          >
                            <ArrowLeftRight size={20} color={showDoubleArrowHead ? 'black' : 'white'} />
                          </button>
                          <button 
                            className={`boton-vertical ${showArrowHead ? 'active' : ''}`} 
                            onClick={() => setShowArrowHead(!showArrowHead)}
                            style={{ backgroundColor: showArrowHead ? '#FFD105' : 'transparent' }}
                          >
                            <ArrowRight size={20} color={showArrowHead ? 'black' : 'white'} />
                          </button>
                        </div>
                      </div>
                    </div>
                )}
              </div>
              <div className="contenedor-fijo-lineas">
                <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Imagen')} title="Insertar Multimedia">
                  <span className="icon-instance-node"><Plus size={20} /></span>
                </button>
                {showMediaMenu && (
                  <div className="sub-menu-completo-de-instance">
                    <div className="sub-menu-lineas-horizontal">
                      <div className="botones-principales-lineas">
                        <button 
                          className="boton-texto-media" 
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = ".json";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          animaciones
                        </button>
                        <button 
                          className="boton-texto-media" 
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = "image/*";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          imágenes
                        </button>
                        <button 
                          className="boton-texto-media" 
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.accept = ".glb,.gltf";
                              fileInputRef.current.click();
                            }
                          }}
                        >
                          modelos 3d
                        </button>
                        <button 
                          className="boton-texto-media" 
                          onClick={addSchema}
                        >
                          esquemas
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json,.glb,.gltf"
                onChange={handleFileChange}
              />
              <button className="boton-de-eliminar" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Eliminar')} title="Eliminar">
                <span className="icon-instance-node"><Trash2 size={20} /></span>
              </button>
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Borrador')} title="Borrador">
                <span className="icon-instance-node"><Eraser size={20} /></span>
              </button>
              <div className="contenedor-fijo-formas" style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                  className={`BOTON-DE-INSERTAR anadir-formas-2 ${showCanvasShapesPanel ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAction('Forma')} 
                  title="Forma"
                >
                  <span className="icon-instance-node"><Diamond size={20} color={showCanvasShapesPanel ? '#FFD105' : 'currentColor'} /></span>
                </button>
                {showCanvasShapesPanel && (
                  <div className="sub-menu-formas-flotante" 
                    onMouseDown={(e) => e.preventDefault()} 
                    style={{ minWidth: '300px', padding: '16px', height: 'auto' }}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="shapes-menu-grid" 
                        onMouseDown={(e) => e.preventDefault()} 
                      >
                        {[
                          { id: 'triangle', icon: <Triangle size={18} color="white" strokeWidth={1.5} />, label: 'Triángulo' },
                          { id: 'square', icon: <Square size={18} color="white" strokeWidth={1.5} />, label: 'Cuadrado' },
                          { id: 'rectangle', icon: <RectangleHorizontal size={18} color="white" strokeWidth={1.5} />, label: 'Rectángulo' },
                          { id: 'circle', icon: <Circle size={18} color="white" strokeWidth={1.5} />, label: 'Círculo' },
                          { id: 'hexagon', icon: <Hexagon size={18} color="white" strokeWidth={1.5} />, label: 'Hexágono' },
                          { id: 'star', icon: <Star size={18} color="white" strokeWidth={1.5} />, label: 'Estrella' },
                          { id: 'cube', icon: <Box size={18} color="white" strokeWidth={1.5} />, label: 'Cubo' },
                          { id: 'pyramid', icon: <Pyramid size={18} color="white" strokeWidth={1.5} />, label: 'Pirámide' },
                          { id: 'cylinder', icon: <Cylinder size={18} color="white" strokeWidth={1.5} />, label: 'Cilindro' },
                          { id: 'sphere', icon: <CircleDot size={18} color="white" strokeWidth={1.5} />, label: 'Esfera' },
                        ].map((item) => (
                          <button 
                            key={item.id} 
                            className={`shape-select-btn ${selectedShapeId === item.id ? 'active' : ''}`}
                            onClick={() => addCanvasShape(item.id as any)}
                            title={item.label}
                          >
                            {item.icon}
                          </button>
                        ))}
                      </div>

                      <div className="w-full h-px bg-white/10" />

                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider text-left">Fondo</span>
                          <div className="flex gap-2 flex-wrap">
                            {SHAPE_PALETTE.map(c => (
                              <button 
                                key={`fill-${c.value}`}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${shapeFillColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value }}
                                onClick={() => setShapeFillColor(c.value)}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider text-left">Borde</span>
                          <div className="flex gap-2 flex-wrap">
                            {SHAPE_PALETTE.map(c => (
                              <button 
                                key={`border-${c.value}`}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${shapeBorderColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value }}
                                onClick={() => setShapeBorderColor(c.value)}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="style-panel-tail" style={{ left: '50%', bottom: '-12px', transform: 'translateX(-50%)' }}></div>
                  </div>
                )}
              </div>
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Deshacer')} title="Deshacer">
                <span className="icon-instance-node"><Undo size={20} /></span>
              </button>
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Rehacer')} title="Rehacer">
                <span className="icon-instance-node"><Redo size={20} /></span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Barra de edición inferior para Esquemas (Estilo similar al menú de texto) */}
      {globalSelectedIds.length === 1 && editingCanvasShapeId && !isHandMode && (
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[10000] flex flex-col items-center pointer-events-none"
        >
          <div className="bg-[#1a1a1a] border-t-4 border-[#FFD105] p-6 flex flex-col gap-6 shadow-[0_-30px_80px_rgba(0,0,0,0.9)] w-full pointer-events-auto">
            <div className="flex items-center gap-12 max-w-7xl mx-auto w-full">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-white/40 uppercase font-black tracking-widest">
                  Tipo de Forma
                </span>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[#FFD105]">
                    {(() => {
                      const targetId = editingCanvasShapeId || globalSelectedIds[0];
                      const shape = canvasShapes.find(s => s.id === targetId);
                      if (!shape) return <Diamond size={24} />;
                      switch (shape.type) {
                        case 'triangle': return <Triangle size={24} />;
                        case 'square': return <Square size={24} />;
                        case 'rectangle': return <RectangleHorizontal size={24} />;
                        case 'circle': return <Circle size={24} />;
                        case 'hexagon': return <Hexagon size={24} />;
                        case 'star': return <Star size={24} />;
                        case 'cube': return <Box size={24} />;
                        case 'pyramid': return <Pyramid size={24} />;
                        case 'cylinder': return <Cylinder size={24} />;
                        case 'sphere': return <CircleDot size={24} />;
                        default: return <Diamond size={24} />;
                      }
                    })()}
                  </div>
                  <span className="text-xl text-white font-bold capitalize">
                    {canvasShapes.find(s => s.id === (editingCanvasShapeId || globalSelectedIds[0]))?.type || 'Forma'}
                  </span>
                </div>
              </div>

              <div className="h-12 w-px bg-white/10" />

              <div className="flex-1 flex gap-12">
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-white/40 uppercase font-black tracking-widest">Color de Fondo</span>
                  <div className="flex gap-2 flex-wrap">
                    {SHAPE_PALETTE.map(c => {
                      const targetId = editingCanvasShapeId || globalSelectedIds[0];
                      const isActive = canvasShapes.find(s => s.id === targetId)?.fillColor === c.value;
                      
                      return (
                        <button 
                          key={`edit-fill-${c.value}`}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${isActive ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => {
                            const targetId = editingCanvasShapeId || globalSelectedIds[0];
                            if (targetId) {
                               updateCanvasShape(targetId, { fillColor: c.value });
                            }
                          }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs text-white/40 uppercase font-black tracking-widest">Color de Borde</span>
                  <div className="flex gap-2 flex-wrap">
                    {SHAPE_PALETTE.map(c => {
                      const targetId = editingCanvasShapeId || globalSelectedIds[0];
                      const isActive = canvasShapes.find(s => s.id === targetId)?.borderColor === c.value;

                      return (
                        <button 
                          key={`edit-border-${c.value}`}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${isActive ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent'}`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => {
                            const targetId = editingCanvasShapeId || globalSelectedIds[0];
                            if (targetId) {
                               updateCanvasShape(targetId, { borderColor: c.value });
                            }
                          }}
                          title={c.name}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {!isSelectionMode && (
                  <button 
                    onClick={() => {
                      const targetId = editingCanvasShapeId || globalSelectedIds[0];
                      if (targetId) {
                        deleteCanvasShape(targetId);
                        setEditingCanvasShapeId(null);
                        setGlobalSelectedIds([]);
                      }
                    }}
                    className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                    title="Eliminar Forma"
                  >
                    <Trash2 size={24} />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setEditingCanvasShapeId(null);
                    if (isSelectionMode) {
                      setIsSelectionMode(false);
                      setGlobalSelectedIds([]);
                    }
                  }}
                  className="p-4 bg-[#FFD105] text-black rounded-2xl font-black uppercase tracking-widest px-8 hover:scale-105 transition-all active:scale-95"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Barra de edición inferior para Esquemas (Estilo similar al menú de texto) */}
      {editingSchemaNodeId && (
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[10000] flex flex-col items-center pointer-events-none"
        >
          <div className="bg-[#1a1a1a] border-t-4 border-[#8e44ad] p-4 flex flex-col gap-4 shadow-[0_-30px_80px_rgba(0,0,0,0.9)] w-full pointer-events-auto">
            {/* Contenedor principal con sub-menú a la izquierda */}
            <div className="flex items-center gap-4 max-w-7xl mx-auto w-full">
              {/* Sub-menú de formato (estilo div-4) - Ahora a la izquierda */}
              <div className="div-4" style={{ 
                position: 'relative', 
                bottom: '0', 
                left: '0', 
                transform: 'none', 
                minWidth: 'auto', 
                width: 'fit-content', 
                height: '56px',
                marginLeft: '0px',
                marginRight: '0px',
                marginBottom: '0px',
                padding: '0 20px',
                gap: '10px'
              }}>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.bold ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { bold: !schemaNodes.find(n => n.id === editingSchemaNodeId)?.bold })}
                >
                  <Bold size={24} color="white" />
                </button>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.italic ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { italic: !schemaNodes.find(n => n.id === editingSchemaNodeId)?.italic })}
                >
                  <Italic size={24} color="white" />
                </button>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.underline ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { underline: !schemaNodes.find(n => n.id === editingSchemaNodeId)?.underline })}
                >
                  <Underline size={24} color="white" />
                </button>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.strikethrough ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { strikethrough: !schemaNodes.find(n => n.id === editingSchemaNodeId)?.strikethrough })}
                >
                  <Strikethrough size={24} color="white" />
                </button>
                <div className="w-px h-10 bg-white/10 mx-2" />
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.align === 'left' ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { align: 'left' })}
                >
                  <AlignLeft size={24} color="white" />
                </button>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.align === 'center' ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { align: 'center' })}
                >
                  <AlignCenter size={24} color="white" />
                </button>
                <button 
                  className={schemaNodes.find(n => n.id === editingSchemaNodeId)?.align === 'right' ? 'propiedad-activada' : 'propiedad'}
                  onClick={() => updateSchemaNode(editingSchemaNodeId, { align: 'right' })}
                >
                  <AlignRight size={24} color="white" />
                </button>
              </div>

              {/* Input y botón de Check */}
              <div className="flex-1 flex items-center gap-6">
                <input 
                  autoFocus
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-8 py-5 text-white text-2xl outline-none focus:border-[#8e44ad] transition-all placeholder:text-white/20 shadow-inner"
                  placeholder="Escribe el contenido del nodo..."
                  value={schemaNodes.find(n => n.id === editingSchemaNodeId)?.text || ''}
                  onChange={(e) => updateSchemaNode(editingSchemaNodeId, { text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingSchemaNodeId(null);
                      window.dispatchEvent(new CustomEvent('stop-schema-editing'));
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    setEditingSchemaNodeId(null);
                    window.dispatchEvent(new CustomEvent('stop-schema-editing'));
                  }}
                  className="bg-[#8e44ad] text-white w-[56px] h-[56px] rounded-2xl flex items-center justify-center hover:bg-[#9b59b6] transition-all shadow-[0_0_30px_rgba(142,68,173,0.5)] active:scale-90 shrink-0 border-2 border-white/20"
                >
                  <Check size={28} strokeWidth={4} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ventana Flotante de Gemini */}
      {/* MedScan Camera Modal */}
      {showMedScanModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95">
          <input 
            type="file" 
            ref={medScanImageInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleMedScanFileUpload} 
          />
          
          <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center p-4">
            <div className="relative w-full aspect-[3/4] max-h-full bg-black rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl flex items-center justify-center">
              
              {medScanMode === 'camera' ? (
                <>
                  <video 
                    ref={medScanVideoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Camera interface overlays */}
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                    <div className="w-[80%] h-[60%] border-2 border-dashed border-white/50 rounded-xl" />
                  </div>

                  {/* Page counter */}
                  {medScanCaptures.length > 0 && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white text-xs font-bold tracking-widest animate-in fade-in zoom-in">
                      {medScanCaptures.length} {medScanCaptures.length === 1 ? 'PÁGINA CAPTURADA' : 'PÁGINAS CAPTURADAS'}
                    </div>
                  )}
                </>
              ) : (
                <div id="medscan-preview-container" className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black/40">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={medScanCroppingIndex}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 100) {
                          cambiarPaginaRecorte(medScanCroppingIndex - 1);
                        } else if (info.offset.x < -100) {
                          cambiarPaginaRecorte(medScanCroppingIndex + 1);
                        }
                      }}
                      className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                    >
                      <img 
                        src={medScanCapturedImage || ''} 
                        className="w-full h-full object-contain pointer-events-none" 
                        alt="Captured" 
                      />
                      
                      {/* Area Selector (Cropper) */}
                      <div 
                        style={{ 
                          width: cropBox.width, 
                          height: cropBox.height,
                          left: cropBox.x,
                          top: cropBox.y,
                          touchAction: 'none'
                        }}
                        onPointerDown={(e) => e.stopPropagation()} // Prevent swipe when touching crop box
                        className="absolute border-4 border-[#FFD105] shadow-[0_0_0_1000px_rgba(0,0,0,0.6)] flex items-center justify-center z-10"
                      >
                        {/* Handles visuales */}
                        <div className="absolute -top-3 -left-3 w-6 h-6 bg-white border-2 border-[#FFD105] rounded-full pointer-events-none" />
                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-white border-2 border-[#FFD105] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-2 border-[#FFD105] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white border-2 border-[#FFD105] rounded-full pointer-events-none" />
                        
                        {/* Área de arrastre para MOVER */}
                        <div 
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startPosX = cropBox.x;
                            const startPosY = cropBox.y;
                            (e.target as HTMLElement).setPointerCapture(e.pointerId);

                            const onMove = (moveEvent: PointerEvent) => {
                              setCropBox(prev => ({ 
                                ...prev, 
                                x: startPosX + (moveEvent.clientX - startX), 
                                y: startPosY + (moveEvent.clientY - startY) 
                              }));
                            };

                            const onUp = () => {
                              window.removeEventListener('pointermove', onMove);
                              window.removeEventListener('pointerup', onUp);
                            };

                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                          }}
                          className="w-full h-full cursor-move bg-white/5 active:bg-white/10 transition-colors"
                        />

                        {/* Resizer Handle */}
                        <div 
                          className="absolute bottom-[-20px] right-[-20px] w-14 h-14 cursor-nwse-resize flex items-center justify-center bg-white rounded-full shadow-2xl border-2 border-[#8e44ad] z-20 active:scale-90 transition-transform"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startY = e.clientY;
                            const startW = cropBox.width;
                            const startH = cropBox.height;
                            (e.target as HTMLElement).setPointerCapture(e.pointerId);

                            const onMove = (moveEvent: PointerEvent) => {
                              setCropBox(prev => ({
                                ...prev,
                                width: Math.max(100, startW + (moveEvent.clientX - startX)),
                                height: Math.max(80, startH + (moveEvent.clientY - startY))
                              }));
                            };

                            const onUp = () => {
                              window.removeEventListener('pointermove', onMove);
                              window.removeEventListener('pointerup', onUp);
                            };

                            window.addEventListener('pointermove', onMove);
                            window.addEventListener('pointerup', onUp);
                          }}
                        >
                          <Spline size={24} className="text-[#8e44ad]" />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows for better affordance */}
                  {medScanCroppingIndex > 0 && (
                    <button 
                      onClick={() => cambiarPaginaRecorte(medScanCroppingIndex - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-white/20 transition-all border border-white/10"
                    >
                      <ChevronLeft size={30} />
                    </button>
                  )}
                  {medScanCroppingIndex < medScanCaptures.length - 1 && (
                    <button 
                      onClick={() => cambiarPaginaRecorte(medScanCroppingIndex + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-white/20 transition-all border border-white/10"
                    >
                      <ChevronLeft size={30} className="rotate-180" />
                    </button>
                  )}

                  {/* Pagination dots */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {medScanCaptures.map((capture, i) => (
                      <div 
                        key={`medscan-dot-${i}-${capture.substring(0, 10)}`} 
                        className={`w-2 h-2 rounded-full transition-all ${i === medScanCroppingIndex ? 'bg-[#FFD105] w-6' : 'bg-white/30'}`}
                        onClick={() => cambiarPaginaRecorte(i)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white font-medium tracking-wider">
                    {medScanMode === 'cropping' ? `RECORTAR PÁGINA ${medScanCroppingIndex + 1}/${medScanCaptures.length}` : 'MEDSCAN AI LIVE'}
                  </span>
                </div>
                <button 
                  onClick={cerrarEscaneo}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Shutter / Confirm Button */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-6">
                {medScanMode === 'camera' ? (
                  <>
                    <button 
                      onClick={() => medScanImageInputRef.current?.click()}
                      className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-md border border-white/20 shadow-xl"
                      title="Subir de Galería"
                    >
                      <Image size={24} />
                    </button>
                    
                    <button 
                      onClick={capturarYDelimitar}
                      className="group relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95"
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-[#FFD105] opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                        <Plus size={32} className="text-[#8e44ad]" />
                      </div>
                      <span className="absolute -bottom-8 text-[10px] text-white font-bold tracking-widest whitespace-nowrap opacity-60">AÑADIR PÁGINA</span>
                    </button>

                    <button 
                      onClick={finalizarCaptura}
                      disabled={medScanCaptures.length === 0}
                      className="w-14 h-14 rounded-full bg-[#FFD105] disabled:opacity-30 disabled:grayscale flex items-center justify-center text-black font-black transition-all shadow-xl active:scale-90"
                      title="Finalizar y Recortar"
                    >
                      <Check size={28} />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setMedScanCaptures([]);
                        setMedScanCroppingIndex(0);
                        setMedScanMode('camera');
                        setMedScanCroppedImages([]);
                        iniciarEscaneo();
                      }}
                      className="px-6 py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/10"
                    >
                      CANCELAR
                    </button>
                    
                    <button 
                      onClick={procesarTodoElEscaneo}
                      disabled={isMedScanLoading}
                      className="px-8 py-4 rounded-2xl bg-[#FFD105] text-black font-black shadow-[0_0_30px_rgba(255,209,5,0.4)] hover:scale-105 transition-all flex flex-col items-center gap-1 disabled:opacity-50"
                    >
                      {isMedScanLoading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Check size={24} strokeWidth={4} />
                            <span className="text-sm">TRANSCRIPCIÓN COMPLETA</span>
                          </div>
                          <span className="text-[10px] opacity-70 tracking-widest">{medScanCaptures.length} PÁGINAS SELECCIONADAS</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="mt-4 text-white/60 text-sm font-light uppercase tracking-[0.2em]">
              {medScanMode === 'cropping' ? 'Ajusta el recuadro sobre el texto y pulsa Siguiente' : 'Captura todas las páginas de tu apunte médico'}
            </p>
          </div>
        </div>
      )}

      {showGeminiModal && (
        <motion.div 
          drag
          dragControls={geminiDragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.05}
          className="fixed top-24 right-8 z-[1000] w-[450px] md:w-[500px] lg:w-[550px] flex flex-col shadow-2xl overflow-visible"
          style={{ 
            backgroundColor: '#1a1a1a',
            border: '1px solid #8e44ad',
            height: 'auto',
            minHeight: '500px',
            maxHeight: 'calc(100vh - 120px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            touchAction: 'none'
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileDrag={{ cursor: 'grabbing' }}
        >
          {/* Handles de arrastre laterales y superior extendido */}
          <div 
            className="absolute -top-6 left-0 right-0 h-6 bg-[#8e44ad]/80 hover:bg-[#8e44ad] rounded-t-xl flex items-center justify-center cursor-move z-[1005] transition-colors shadow-lg"
            onPointerDown={(e) => geminiDragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div className="w-16 h-1.5 bg-white/40 rounded-full" />
          </div>

          {/* Reborde lateral izquierdo (Área de agarre aumentada) */}
          <div 
            className="absolute top-0 bottom-0 -left-3 w-6 cursor-move z-[1005] group"
            onPointerDown={(e) => geminiDragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute right-0 top-4 bottom-4 w-1.5 bg-[#8e44ad]/20 group-hover:bg-[#8e44ad]/60 transition-colors rounded-full" />
          </div>

          {/* Reborde lateral derecho (Área de agarre aumentada) */}
          <div 
            className="absolute top-0 bottom-0 -right-3 w-6 cursor-move z-[1005] group"
            onPointerDown={(e) => geminiDragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-[#8e44ad]/20 group-hover:bg-[#8e44ad]/60 transition-colors rounded-full" />
          </div>

          {/* Reborde inferior (Área de agarre aumentada) */}
          <div 
            className="absolute -bottom-3 left-4 right-4 h-6 cursor-move z-[1005] group"
            onPointerDown={(e) => geminiDragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div className="absolute top-0 left-10 right-10 h-1.5 bg-[#8e44ad]/20 group-hover:bg-[#8e44ad]/60 transition-colors rounded-full" />
          </div>

          <div className="flex flex-col w-full h-full rounded-b-2xl overflow-hidden relative z-10">
            {/* Header de la ventana - AHORA ES DRAGGABLE TAMBIÉN */}
            <div 
              className="flex items-center justify-between p-4 border-b border-white/10 cursor-move bg-[#232323]"
              onPointerDown={(e) => geminiDragControls.start(e)}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} color="#8e44ad" />
                <span className="text-white font-semibold text-sm">Asistente Gemini</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGeminiModal(false);
                    setGeminiResponse('');
                    setGeminiQuery('');
                    setShowGeminiMenu(false);
                    setGeminiImages([]);
                    setGeminiAudio(null);
                    setUseFullDocument(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} color="white" />
                </button>
              </div>
            </div>

            {/* Cuerpo de la ventana (Respuestas) */}
            <div 
              className="flex-1 min-h-[350px] overflow-y-auto overflow-x-hidden p-6 custom-scrollbar relative bg-[#232323]"
              onMouseUp={handleTextSelection}
            >
              {geminiResponse ? (
                <>
                  <div className="text-white/90 prose prose-invert prose-sm max-w-none break-words text-[13px] leading-relaxed">
                    <Markdown>{geminiResponse}</Markdown>
                  </div>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleImportToCanvas}
                    className="sticky bottom-0 mt-6 ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#8e44ad] hover:bg-[#9b59b6] text-white text-xs font-bold rounded-xl transition-all shadow-xl animate-in fade-in slide-in-from-bottom-2 border border-white/10"
                    title={selectedGeminiText ? "Importar fragmento seleccionado" : "Importar respuesta completa"}
                  >
                    <Plus size={16} />
                    {selectedGeminiText ? "Importar Selección" : "Importar al Lienzo"}
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/40 gap-3 py-12">
                  <BrainCircuit size={40} strokeWidth={1} />
                  <p className="text-center text-xs px-6">
                    {textBoxes.filter(b => globalSelectedIds.includes(b.id) || b.id === selectedBoxId).length > 0 
                      ? "Haz una pregunta sobre tus notas seleccionadas o investiga algo nuevo."
                      : "Pregúntame lo que quieras o selecciona notas para darme contexto."}
                  </p>
                </div>
              )}
            {isGeminiLoading && (
              <div className="flex items-center gap-2 text-[#8e44ad] mt-4 animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-medium">Gemini está pensando...</span>
              </div>
            )}
          </div>

          {/* Footer de la ventana (Input) */}
          <div 
            className="pt-0 px-4 pb-4 relative rounded-b-2xl"
            style={{ marginTop: '32px', marginLeft: '-1px' }}
          >
            {/* Preview de imágenes adjuntas */}
            {geminiImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {geminiImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={`data:${img.mimeType};base64,${img.data}`} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded-lg border border-white/20"
                    />
                    <button 
                      onClick={() => setGeminiImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Menú de opciones de Gemini */}
            {showGeminiMenu && (
              <div 
                className="absolute bottom-full left-4 mb-2 w-56 bg-[#232323] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[1003] animate-in slide-in-from-bottom-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    geminiImageInputRef.current?.click();
                    setShowGeminiMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-5 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-xs border-b border-white/5"
                >
                  <Image size={20} className="text-[#8e44ad]" />
                  <span className="font-semibold">Insertar fotos</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    geminiAudioInputRef.current?.click();
                    setShowGeminiMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-5 py-5 text-white/80 hover:bg-white/5 hover:text-white transition-colors text-xs border-b border-white/5"
                >
                  <Mic size={20} className="text-[#8e44ad]" />
                  <span className="font-semibold">Insertar audio</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setUseFullDocument(!useFullDocument);
                    setShowGeminiMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-5 hover:bg-white/5 transition-colors text-xs ${useFullDocument ? 'text-[#8e44ad]' : 'text-white/80'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={20} />
                    <span className="font-semibold">Leer todo el documento</span>
                  </div>
                  {useFullDocument && <div className="w-2.5 h-2.5 rounded-full bg-[#8e44ad] shadow-[0_0_8px_#8e44ad]" />}
                </button>
              </div>
            )}

            <input 
              type="file" 
              ref={geminiImageInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleGeminiImageUpload}
            />
            <input 
              type="file" 
              ref={geminiAudioInputRef} 
              className="hidden" 
              accept="audio/*" 
              onChange={handleGeminiAudioUpload}
            />

            {/* Preview de audio adjunto */}
            {geminiAudio && (
              <div className="flex items-center gap-3 mb-3 p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 bg-[#8e44ad]/20 rounded-lg flex items-center justify-center text-[#8e44ad]">
                  <Mic size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] text-white/80 font-semibold truncate">Audio cargado</p>
                  <p className="text-[9px] text-white/40">{geminiAudio.mimeType}</p>
                </div>
                <button 
                  onClick={() => setGeminiAudio(null)}
                  className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div 
              className="grid grid-cols-[auto_1fr_auto] items-center gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/10 focus-within:border-[#8e44ad] transition-all"
            >
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGeminiMenu(!showGeminiMenu);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${showGeminiMenu ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                <MoreVertical size={20} />
              </button>
              <textarea
                value={geminiQuery}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => setGeminiQuery(e.target.value)}
                placeholder={useFullDocument ? "Pregunta sobre todo el documento..." : "Pregunta algo..."}
                className="w-full bg-transparent border-none px-2 py-2 text-white text-sm outline-none resize-none custom-scrollbar leading-tight min-h-[40px] max-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGeminiQuery();
                  }
                }}
              />
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleGeminiQuery}
                disabled={isGeminiLoading || (!geminiQuery.trim() && geminiImages.length === 0)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isGeminiLoading || (!geminiQuery.trim() && geminiImages.length === 0) ? 'text-white/20 bg-white/5' : 'bg-[#8e44ad] text-white shadow-lg'}`}
              >
                {isGeminiLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p 
              className="text-[10px] text-white/30 text-center font-medium"
              style={{ marginTop: '4px' }}
            >
              {useFullDocument ? "Analizando todo el lienzo." : "Investiga o usa tus notas como contexto."}
            </p>
          </div>
        </div>
      </motion.div>
      )}

      {/* Side Panel: PDF Asset Pool */}
      <AnimatePresence>
        {pdfToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[15000] bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 backdrop-blur-md border border-green-400/30"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={12} />
            </div>
            {pdfToast.message}
          </motion.div>
        )}

        {/* PDF Manual Selection Modal */}
        {showManualPDF && (
          <div className="fixed inset-0 z-[12000] bg-black/90 flex flex-col items-center p-4" style={{ transform: 'translateZ(0)', transition: 'all 0.2s ease-in-out' }}>
            {/* Header / Toolbar */}
            <div className="w-full max-w-7xl bg-[#232323] p-4 rounded-t-3xl border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowManualPDF(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all shadow-lg active:scale-95"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                  <h2 className="text-white font-black text-xl tracking-tight leading-tight">Selector de PDF Médico</h2>
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none">Extracción y Delimitación de Párrafos</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5">
                <button 
                  onClick={() => setPdfCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 text-white/60 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 text-white font-black font-mono text-sm min-w-[100px] text-center">
                  {pdfCurrentPage} / {pdfTotalPages}
                </div>
                <button 
                  onClick={() => setPdfCurrentPage(p => Math.min(pdfTotalPages, p + 1))}
                  className="p-2 text-white/60 hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const newMode = !pdfInSelectionMode;
                    setPdfInSelectionMode(newMode);
                    setActiveShape(newMode ? 'PDF_SELECT' : null);
                    setSelectionRect(null);
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${pdfInSelectionMode ? 'bg-[#FFD105] text-black shadow-[0_0_20px_rgba(255,209,5,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {pdfInSelectionMode ? <BoxSelect size={16} strokeWidth={3} /> : <Hand size={16} strokeWidth={3} />}
                  {pdfInSelectionMode ? 'Modo Selección' : 'Modo Navegar'}
                </button>

                <button 
                  onClick={insertFullPageToBuffer}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${fullPageSuccess ? 'bg-green-600 scale-105' : 'bg-green-500 hover:bg-green-600'} text-white`}
                >
                  <FileUp size={16} strokeWidth={3} className={fullPageSuccess ? 'animate-bounce' : ''} />
                  {fullPageSuccess ? '¡Añadida!' : 'Subir Página Completa'}
                </button>
              </div>
            </div>

            {/* Main Layout: Viewport + Sidebar */}
            <div className="w-full max-w-7xl flex-1 bg-[#1a1a1a] flex overflow-hidden rounded-b-3xl border border-white/5 shadow-2xl">
              {/* Viewport Area */}
              <div 
                ref={pdfContainerRef}
                onPointerDown={handlePDFPointerDown}
                onPointerMove={handlePDFPointerMove}
                onPointerUp={() => setSelectionRect(prev => prev ? { ...prev, active: false } : null)}
                className={`flex-1 relative overflow-auto custom-scrollbar flex justify-center py-6 px-4 bg-[#121212] ${pdfInSelectionMode ? 'touch-none select-none' : 'touch-pan-y'}`}
                style={{ 
                  willChange: 'transform', 
                  contain: 'paint layout',
                  transform: 'translateZ(0)'
                }}
              >
                <div className="relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] rounded-lg bg-white overflow-hidden transition-all h-fit" style={{ transform: 'translateZ(0)' }}>
                  <canvas 
                    ref={pdfCanvasRef} 
                    className="block pointer-events-none" 
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  
                  {/* Native Text Layer for selection */}
                  <div 
                    ref={textLayerRef} 
                    className="textLayer absolute inset-0 z-20 pointer-events-auto overflow-hidden opacity-30 mix-blend-multiply" 
                    style={{ 
                      display: pdfInSelectionMode ? 'none' : 'block',
                      pointerEvents: pdfInSelectionMode ? 'none' : 'auto',
                      userSelect: 'text'
                    }}
                  />
                  
                  {/* Drawn Selection Box (Dashed style) */}
                   {selectionRect && Math.abs(selectionRect.width) > 5 && Math.abs(selectionRect.height) > 5 && (
                    <div 
                      className="absolute border-2 border-dashed border-[#FFD105] z-40 transition-shadow pointer-events-auto"
                      style={{
                        left: selectionRect.width >= 0 ? selectionRect.x : selectionRect.x + selectionRect.width,
                        top: selectionRect.height >= 0 ? selectionRect.y : selectionRect.y + selectionRect.height,
                        width: Math.abs(selectionRect.width),
                        height: Math.abs(selectionRect.height),
                        backgroundColor: 'rgba(255, 209, 5, 0.1)',
                        boxShadow: selectionRect.active ? 'none' : '0 0 0 9999px rgba(0,0,0,0.4)',
                        willChange: 'left, top, width, height',
                        transform: 'translateZ(0)',
                        cursor: selectionRect.active ? 'crosshair' : 'move'
                      }}
                    >
                      {/* Floating Tool Buttons */}
                      {!selectionRect.active && (
                        <div 
                          className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1a1a1a] p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 pointer-events-auto backdrop-blur-xl"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <button 
                            onClick={() => handleSelectionImport('text')}
                            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl transition-all active:scale-95 ${selectionOperationRunning === 'text' ? 'bg-green-600' : 'hover:bg-white/5'}`}
                          >
                            <Type size={24} color={selectionOperationRunning === 'text' ? 'white' : '#FFD105'} className={selectionOperationRunning === 'text' ? 'animate-bounce' : ''} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectionOperationRunning === 'text' ? 'text-white' : 'text-[#FFD105]'}`}>
                              {selectionOperationRunning === 'text' ? '¡Insertado!' : 'Insertar Texto'}
                            </span>
                          </button>
                          <div className="w-px h-10 bg-white/10" />
                          <button 
                            onClick={() => handleSelectionImport('image')}
                            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-xl transition-all active:scale-95 ${selectionOperationRunning === 'image' ? 'bg-green-600' : 'hover:bg-white/5'}`}
                          >
                            <Camera size={24} color={selectionOperationRunning === 'image' ? 'white' : '#FFD105'} className={selectionOperationRunning === 'image' ? 'animate-bounce' : ''} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectionOperationRunning === 'image' ? 'text-white' : 'text-[#FFD105]'}`}>
                              {selectionOperationRunning === 'image' ? '¡Insertada!' : 'Insertar Imagen'}
                            </span>
                          </button>
                          <div className="w-px h-10 bg-white/10" />
                          <button 
                            onClick={() => setSelectionRect(null)}
                            className="p-4 hover:bg-red-500/20 rounded-xl text-red-500 transition-all active:scale-90"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Selection Buffer / Refinement */}
              <div className="pdf-selection-sidebar p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6 relative">
                  <h3 className="text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">Bandeja de Recortes</h3>
                  <motion.span 
                    key={pdfSelectionBuffer.length}
                    initial={{ scale: 1.5, color: '#FFD105' }}
                    animate={{ scale: 1, color: '#FFD105' }}
                    className="px-2 py-0.5 bg-[#FFD105]/20 text-[#FFD105] text-[10px] font-black rounded-full"
                  >
                    {pdfSelectionBuffer.length} items
                  </motion.span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <AnimatePresence>
                    {pdfSelectionBuffer.map((asset, index) => (
                      <motion.div 
                        key={asset.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="pdf-selection-item flex flex-col gap-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">
                            Pág {asset.page} • {asset.type === 'image' ? 'Imagen' : 'Párrafo'}
                          </span>
                          <button 
                            onClick={() => setPdfSelectionBuffer(prev => prev.filter(a => a.id !== asset.id))}
                            className="p-1 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-md transition-all"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {asset.type === 'text' ? (
                          <textarea 
                            value={asset.content}
                            rows={4}
                            placeholder="Delimita o edita el párrafo aquí..."
                            onChange={(e) => {
                              const newContent = e.target.value;
                              setPdfSelectionBuffer(prev => prev.map(a => a.id === asset.id ? { ...a, content: newContent } : a));
                            }}
                            className="w-full bg-transparent border-none text-white/70 text-xs custom-scrollbar leading-relaxed outline-none resize-none"
                          />
                        ) : (
                          <div className="aspect-video w-full rounded-lg bg-black/40 overflow-hidden ring-1 ring-white/10 group-hover:ring-[#FFD105]/30 transition-all">
                            <img src={asset.content} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        <button 
                          onClick={() => {
                            importAssetToCanvas(asset);
                            setPdfSelectionBuffer(prev => prev.filter(a => a.id !== asset.id));
                          }}
                          className="w-full py-2.5 bg-[#FFD105] text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] shadow-lg hover:shadow-[#FFD105]/20"
                        >
                          Confirmar e Insertar
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {pdfSelectionBuffer.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-10 pointer-events-none">
                      <BoxSelect size={40} className="mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest italic">Selecciona áreas para delimitar párrafos</p>
                    </div>
                  )}
                </div>

                {pdfSelectionBuffer.length > 0 && (
                  <button 
                    onClick={() => {
                      pdfSelectionBuffer.forEach(a => importAssetToCanvas(a));
                      setPdfSelectionBuffer([]);
                    }}
                    className="mt-4 px-6 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#FFD105] transition-all shadow-2xl active:scale-95"
                  >
                    Insertar Todo ({pdfSelectionBuffer.length})
                  </button>
                )}
              </div>
            </div>

            {/* Instruction Overlay */}
            {pdfInSelectionMode && !selectionRect && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#FFD105] text-black rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl pointer-events-none animate-bounce">
                DIBUJA UN RECTÁNGULO PARA EXTRAER
              </div>
            )}

            {/* Native Selection Import Floating Toast/Button */}
            <AnimatePresence>
              {selectedNativeText && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[13000] bg-[#FFD105] text-black px-6 py-4 rounded-3xl shadow-[0_20px_50px_rgba(255,209,5,0.4)] flex items-center gap-5 border-2 border-black/10 backdrop-blur-md pointer-events-auto"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Texto Seleccionado</span>
                    <span className="font-bold text-sm max-w-[200px] truncate italic">
                      "{selectedNativeText}"
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      const newAsset: PDFAsset = {
                        id: crypto.randomUUID(),
                        type: 'text',
                        content: selectedNativeText,
                        page: pdfCurrentPage,
                        width: 350,
                        height: 200
                      };
                      // Direct Background Import
                      importAssetToCanvas(newAsset);
                      setPdfAssets(prev => {
                        if (prev.some(a => a.id === newAsset.id)) return prev;
                        return [...prev, newAsset];
                      });
                      showToast("Texto insertado en el lienzo");
                      
                      setSelectedNativeText('');
                      window.getSelection()?.removeAllRanges();
                    }}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-xl hover:bg-zinc-900"
                  >
                    Insertar en Lienzo
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedNativeText('');
                      window.getSelection()?.removeAllRanges();
                    }}
                    className="p-2 hover:bg-black/10 rounded-full transition-colors"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {showPDFPool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPDFPool(false)}
              className="fixed inset-0 bg-black/20 z-[49] pointer-events-auto"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-[350px] bg-white shadow-2xl z-[50] flex flex-col p-6 pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8e44ad]/10 flex items-center justify-center">
                    <FileText size={18} color="#8e44ad" />
                  </div>
                  <h2 className="text-[#2c3e50] font-bold text-xl">Recortes de PDF</h2>
                </div>
                <button 
                  onClick={() => setShowPDFPool(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X size={24} color="#2c3e50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {pdfAssets.map(asset => (
                  <motion.div 
                    key={asset.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-[#fdfaf1] rounded-xl border border-[#8e44ad]/10 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all relative group"
                    onClick={() => importAssetToCanvas(asset)}
                  >
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#8e44ad]/10 text-[#8e44ad] text-[10px] font-black rounded uppercase tracking-wider">
                      PÁG {asset.page}
                    </div>
                    {asset.type === 'image' ? (
                      <div className="flex items-center gap-3">
                        <Image size={24} className="text-[#8e44ad]/40" />
                        <p className="text-xs text-[#2c3e50] font-medium italic">{asset.content}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-[#2c3e50] line-clamp-4 leading-relaxed">{asset.content}</p>
                    )}
                    <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-bold text-[#8e44ad] flex items-center gap-1">
                        <Plus size={12} /> ARRASTRAR AL LIENZO
                      </button>
                    </div>
                  </motion.div>
                ))}
                {pdfAssets.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <FileText size={48} className="mb-4" />
                    <p className="text-sm font-medium">Sube un PDF para extraer bloques</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#8e44ad]/10">
                 <p className="text-[10px] text-[#2c3e50]/40 text-center uppercase tracking-widest font-bold">
                   Haz clic en el recorte para insertarlo
                 </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Maquetador Modal (Modo Tetris) */}
      <AnimatePresence>
        {showLayoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black/90 flex flex-col backdrop-blur-md layout-modal-container"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black">
              <div className="flex items-center gap-3">
                <Layout size={20} color="#8e44ad" />
                <h2 className="text-white font-bold text-lg">Maquetador de Impresión A4</h2>
                <span className="text-white/40 text-xs bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest font-black">Beta AI</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10 mr-4">
                  <button onClick={() => setLayoutZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-white/10 rounded-full text-white/60"><Minus size={14} /></button>
                  <span className="text-[10px] text-white font-mono w-10 text-center">{Math.round(layoutZoom * 100)}%</span>
                  <button onClick={() => setLayoutZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white/10 rounded-full text-white/60"><Plus size={14} /></button>
                </div>
                <button 
                  onClick={procesarMaquetacionAI}
                  disabled={isLayoutAIProcessing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLayoutAIProcessing ? 'bg-white/10 text-white/40' : 'bg-[#FFD105] text-black hover:scale-105 shadow-[0_0_20px_rgba(255,209,5,0.4)]'}`}
                >
                  {isLayoutAIProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  ORDENAR CON IA
                </button>
                <button 
                  onClick={exportarMaquetacionAPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  <FileDown size={16} />
                  GENERAR PDF
                </button>
                <button 
                  onClick={() => setShowLayoutModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Elementos Extraídos (Sidebar) */}
              <div className="w-[380px] border-r border-white/10 bg-[#121212] flex flex-col p-6 overflow-y-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                <h3 className="text-white/40 uppercase text-[11px] font-black tracking-[0.2em] mb-6">Inventario de Elementos</h3>
                
                {/* Text Preview Area */}
                <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 min-h-[100px] flex flex-col gap-2">
                  <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Vista Previa de Contenido</span>
                  <div className="flex-1 text-white/60 text-xs italic leading-relaxed overflow-y-auto custom-scrollbar pr-2 max-h-[150px]">
                    {selectedLayoutAssetId 
                      ? (layoutAssets.find(a => a.id === selectedLayoutAssetId)?.thumbnail || "Sin contenido")
                      : selectedInventoryAssetId
                        ? (inventoryAssets.find(a => a.id === selectedInventoryAssetId)?.thumbnail || "Sin contenido")
                        : "Selecciona un elemento para previsualizar su contenido..."}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {inventoryAssets.map(asset => (
                    <div 
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('sourceAssetId', asset.id);
                        e.dataTransfer.effectAllowed = 'copy';
                        setSelectedInventoryAssetId(asset.id);
                      }}
                      onClick={() => {
                        setSelectedInventoryAssetId(asset.id);
                        setSelectedLayoutAssetId(null);
                        // Also auto-preview in main canvas interaction (selection logic might differ)
                      }}
                      className={`p-3 bg-white/5 rounded-xl border transition-all group cursor-pointer relative overflow-hidden ${selectedInventoryAssetId === asset.id ? 'border-[#FFD105] bg-white/10 shadow-[0_0_15px_rgba(255,209,5,0.2)]' : 'border-white/5 hover:border-[#FFD105]/50 hover:bg-white/10'} active:scale-95`}
                    >
                      <div 
                        className="absolute inset-0 bg-[#FFD105] flex items-center justify-center opacity-0 group-hover:opacity-90 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const instanceId = generateId(`${asset.id}_`);
                          const newAsset: LayoutAsset = {
                            ...asset,
                            id: instanceId,
                            placed: true,
                            pageIndex: activePageIndex,
                            x: 105 - (asset.width / 2),
                            y: 148.5 - (asset.height / 2),
                            zIndex: layoutAssets.length + 10
                          };
                          setLayoutAssets(prev => [...prev, newAsset]);
                          setSelectedLayoutAssetId(instanceId);
                          setSelectedInventoryAssetId(null);
                        }}
                      >
                        <span className="text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                          <Plus size={14} /> Añadir
                        </span>
                      </div>
                      <div className="aspect-square rounded-lg bg-black/40 mb-2 flex items-center justify-center overflow-hidden">
                        {asset.type === 'image' && asset.thumbnail ? (
                          <img src={asset.thumbnail} alt="asset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : asset.type === 'text' ? (
                          <Type size={20} className="text-white/40" />
                        ) : asset.type === 'schema' ? (
                          <div className="w-full h-full bg-[#8e44ad]/80 flex items-center justify-center p-2">
                            <span className="text-[8px] text-white font-bold text-center line-clamp-3 uppercase leading-tight">{asset.thumbnail}</span>
                          </div>
                        ) : asset.type === 'shape' ? (
                          <Diamond size={20} className="text-[#FFD105]" />
                        ) : (
                          <Diamond size={20} className="text-white/40" />
                        )}
                      </div>
                      <div className="text-[9px] text-white/40 font-bold uppercase overflow-hidden text-ellipsis whitespace-nowrap text-center">
                        {asset.type.toUpperCase()}
                      </div>
                    </div>
                  ))}
                  {inventoryAssets.length === 0 && (
                    <div className="col-span-2 py-8 text-center border border-dashed border-white/10 rounded-xl">
                       <p className="text-[10px] text-white/20 uppercase font-black">Cargando Inventario...</p>
                    </div>
                  )}
                </div>

        {selectedLayoutAssetId && layoutAssets.find(a => a.id === selectedLayoutAssetId)?.placed && (
          <div className="mt-auto pt-8 border-t border-white/10">
            <h4 className="text-[#FFD105] font-black text-sm uppercase mb-6 tracking-widest flex items-center gap-2">
              <Sparkles size={16} /> Ajustes del Elemento
            </h4>
            <div className="space-y-6 pb-6">
              {/* Common: Forward/Backward */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Orden de Capas</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { zIndex: (layoutAssets.find(a => a.id === selectedLayoutAssetId)?.zIndex || 10) + 1 })}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-white/5"
                  >
                    <ChevronsUp size={20} />
                    <span className="text-[9px] font-black uppercase">Traer Frente</span>
                  </button>
                  <button 
                    onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { zIndex: Math.max(1, (layoutAssets.find(a => a.id === selectedLayoutAssetId)?.zIndex || 10) - 1) })}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-white/5"
                  >
                    <ChevronsDown size={20} />
                    <span className="text-[9px] font-black uppercase">Enviar Fondo</span>
                  </button>
                </div>
              </div>

              {/* Text Specific Settings */}
              {layoutAssets.find(a => a.id === selectedLayoutAssetId)?.type === 'text' && (
                <>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Tamaño de Fuente</label>
                    <div className="flex items-center gap-4 bg-black/60 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                      <button 
                        onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { fontSize: Math.max(8, (layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontSize || 16) - 2) })}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white active:scale-90 transition-transform"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="flex-1 text-center text-[#FFD105] font-mono text-lg font-black">{layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontSize}<span className="text-[10px] ml-1 opacity-50">PX</span></span>
                      <button 
                        onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { fontSize: Math.min(100, (layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontSize || 16) + 2) })}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white active:scale-90 transition-transform"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Estilo de Texto</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { fontWeight: layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontWeight === 'bold' ? 'bg-[#FFD105] text-black border-[#FFD105] shadow-[0_0_20px_rgba(255,209,5,0.3)] scale-[1.02]' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                      >
                        <Bold size={18} />
                        <span className="text-[10px] font-black uppercase">Negrita</span>
                      </button>
                      <button 
                        onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { fontStyle: layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        className={`py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${layoutAssets.find(a => a.id === selectedLayoutAssetId)?.fontStyle === 'italic' ? 'bg-[#FFD105] text-black border-[#FFD105] shadow-[0_0_20px_rgba(255,209,5,0.3)] scale-[1.02]' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                      >
                        <Italic size={18} />
                        <span className="text-[10px] font-black uppercase">Cursiva</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Alineación</label>
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                      {(['left', 'center', 'justify'] as const).map(align => (
                        <button 
                          key={align}
                          onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { alignment: align })}
                          className={`flex-1 py-3 rounded-xl border flex items-center justify-center transition-all ${layoutAssets.find(a => a.id === selectedLayoutAssetId)?.alignment === align ? 'bg-[#FFD105] text-black border-[#FFD105] shadow-lg' : 'bg-transparent text-white/40 border-transparent hover:bg-white/5'}`}
                        >
                          {align === 'left' ? <AlignLeft size={18} /> : align === 'center' ? <AlignCenter size={18} /> : <AlignJustify size={18} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Color del Texto</label>
                    <div className="flex flex-wrap gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/5">
                      {['#000000', '#2563eb', '#dc2626', '#16a34a', '#8b5cf6', '#ffffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => handleUpdateLayoutAsset(selectedLayoutAssetId, { color })}
                          className={`w-7 h-7 rounded-full border-2 transition-all relative ${layoutAssets.find(a => a.id === selectedLayoutAssetId)?.color === color ? 'border-[#FFD105] scale-110 shadow-[0_0_15px_rgba(255,209,5,0.5)]' : 'border-white/10'}`}
                          style={{ backgroundColor: color }}
                        >
                           {layoutAssets.find(a => a.id === selectedLayoutAssetId)?.color === color && (
                             <div className="absolute inset-0 flex items-center justify-center">
                               <Check size={10} className={color === '#ffffff' ? 'text-black' : 'text-white'} />
                             </div>
                           )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Common Frame Settings */}
              <div className="flex flex-col gap-3">
                <label className="text-[11px] text-white/40 font-black uppercase tracking-wider">Opción de Marco</label>
                <button 
                  onClick={() => {
                    const current = layoutAssets.find(a => a.id === selectedLayoutAssetId);
                    const hasBorder = (current?.borderWidth || 0) > 0;
                    handleUpdateLayoutAsset(selectedLayoutAssetId, { 
                      borderWidth: hasBorder ? 0 : 2,
                      borderColor: hasBorder ? 'transparent' : '#000000'
                    });
                  }}
                  className={`w-full py-5 rounded-2xl border flex items-center justify-center gap-4 transition-all ${(layoutAssets.find(a => a.id === selectedLayoutAssetId)?.borderWidth || 0) > 0 ? 'bg-[#FFD105] text-black border-[#FFD105] shadow-[0_0_20px_rgba(255,209,5,0.4)] font-black' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                >
                  <BoxSelect size={20} />
                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                    {(layoutAssets.find(a => a.id === selectedLayoutAssetId)?.borderWidth || 0) > 0 ? 'ELIMINAR MARCO' : 'AÑADIR MARCO'}
                  </span>
                </button>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setLayoutAssets(prev => prev.filter(a => a.id !== selectedLayoutAssetId))}
                  className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-red-500/10"
                >
                  <Trash2 size={20} />
                  Borrar Elemento
                </button>
              </div>
            </div>
          </div>
        )}
              </div>

              {/* Área de Previsualización (A4 Sheets) */}
              <div 
                className="flex-1 bg-[#1a1a1a] overflow-y-auto custom-scrollbar relative"
                onClick={() => setSelectedLayoutAssetId(null)}
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                <div className="flex flex-col items-center p-10 gap-20 min-h-full pb-60">
                  <div className="text-white/20 text-[10px] font-black sticky top-0 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full z-[100] flex items-center gap-2 border border-white/5 shadow-2xl transition-all hover:bg-black/80">
                    <Move size={12} className="text-[#FFD105]" />
                    DISEÑA TU DOCUMENTO FINAL (PÁGINAS A4)
                  </div>
                  
                  {Array.from({ length: layoutNumPages }).map((_, pIndex) => (
                    <div 
                      key={pIndex}
                      className="relative group page-wrapper"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setActivePageIndex(pIndex);
                        const sourceAssetId = e.dataTransfer.getData('sourceAssetId');
                        if (!sourceAssetId) return;

                        const original = inventoryAssets.find(a => a.id === sourceAssetId);
                        if (!original) return;

                        const rect = e.currentTarget.getBoundingClientRect();
                        const relX = ((e.clientX - rect.left) / rect.width) * 210;
                        const relY = ((e.clientY - rect.top) / rect.height) * 297;

                        const instanceId = `${sourceAssetId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        
                        setLayoutAssets(prev => [...prev.filter(a => a.id !== instanceId), {
                          ...original,
                          id: instanceId,
                          placed: true,
                          pageIndex: pIndex,
                          x: Math.max(0, Math.min(210, relX - (original.width / 2))),
                          y: Math.max(0, Math.min(297, relY - (original.height / 2))),
                          zIndex: layoutAssets.length + 10
                        }]);
                        
                        setSelectedLayoutAssetId(instanceId);
                      }}
                    >
                      <div className="absolute -left-16 top-0 h-full flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                         <span className="text-white font-black text-6xl tracking-tighter vertical-text select-none">P{pIndex + 1}</span>
                      </div>
                      <FabricLayoutSheet 
                        pageIndex={pIndex}
                        zoom={layoutZoom}
                        selectedAssetId={selectedLayoutAssetId}
                        onSelectAsset={(id) => {
                          setSelectedLayoutAssetId(id);
                          setActivePageIndex(pIndex);
                        }}
                        assets={layoutAssets.filter(a => a.pageIndex === pIndex && a.placed)}
                        onUpdateAsset={handleUpdateLayoutAsset}
                        onDeleteAsset={(id) => setLayoutAssets(prev => prev.filter(a => a.id !== id))}
                        textBoxes={textBoxes}
                        images={images}
                        schemaNodes={schemaNodes}
                      />
                    </div>
                  ))}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLayoutNumPages(p => p + 1);
                    }}
                    className="w-full max-w-[595px] py-10 bg-white/5 border-2 border-dashed border-white/10 rounded-[30px] text-white/20 hover:text-[#FFD105] hover:bg-[#FFD105]/5 hover:border-[#FFD105]/40 transition-all flex flex-col items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[11px] group shadow-xl"
                  >
                    <PlusCircle size={32} className="group-hover:scale-110 transition-transform text-[#FFD105]" />
                    Añadir Nueva Página A4
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LienzoDeApuntes;
