import React, { useState, useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, useDragControls } from 'motion/react';
import TextBoxComponent from './TextBoxComponent';
import LottieComponent from './LottieComponent';
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
  Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';

interface LienzoDeApuntesProps {
  title: string;
  color: string;
  gradient: string;
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
}

interface LottieAnimation {
  id: string;
  x: number;
  y: number;
  scale: number;
  data: any;
  isPlaying: boolean;
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

const LienzoDeApuntes: React.FC<LienzoDeApuntesProps> = ({ title, color, gradient, onBack }) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showIconsPanel, setShowIconsPanel] = useState(false);
  const [showLinesMenu, setShowLinesMenu] = useState(false);
  const [showLineColorPalette, setShowLineColorPalette] = useState(false);
  const [isCurveMode, setIsCurveMode] = useState(false);
  const [activeProperty, setActiveProperty] = useState<string | null>('T');
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [lottieAnimations, setLottieAnimations] = useState<LottieAnimation[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const currentPathRef = useRef<{ x: number, y: number }[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [lineType, setLineType] = useState<'line' | 'arrow' | 'zigzag' | 'curve'>('line');
  const [showArrowHead, setShowArrowHead] = useState(false);
  const [showDoubleArrowHead, setShowDoubleArrowHead] = useState(false);
  const [isOrthogonalMode, setIsOrthogonalMode] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [selectedLottieId, setSelectedLottieId] = useState<string | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [isHandMode, setIsHandMode] = useState(false);
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [selectedLottieIds, setSelectedLottieIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
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
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [selectedDrawingIdForPoint, setSelectedDrawingIdForPoint] = useState<string | null>(null);
  const [geminiQuery, setGeminiQuery] = useState('');
  const [geminiResponse, setGeminiResponse] = useState('');
  const [selectedGeminiText, setSelectedGeminiText] = useState('');
  const geminiDragControls = useDragControls();
  
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
      id: Date.now().toString(),
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

  const updateTextBox = (id: string, updates: any) => {
    setTextBoxes(prev => prev.map(box => box.id === id ? { ...box, ...updates } : box));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (wasDragging.current || isHandMode) return;
    
    if (isSelectionMode) {
      // Check for double click to deselect
      if (e.detail === 2) {
        setSelectedBoxIds([]);
      }
      return;
    }

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
    const isBackground = e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS' || (e.target as HTMLElement).tagName === 'svg';
    const isMiddleButton = e.button === 1;
    const isNavigationMode = !showTextMenu && !selectedBoxId && !showLinesMenu;

    if (isBackground) {
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      // Only clear selection, don't turn off the mode itself
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

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
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
          id: Date.now().toString(),
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
              setSelectedDrawingIds(prev => prev.includes(drawing.id) ? prev.filter(id => id !== drawing.id) : [...prev, drawing.id]);
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

  const handleAction = (action: string) => {
    console.log(`${action} clicado`);
    if (action === 'Texto') {
      const nextShowTextMenu = !showTextMenu;
      setShowTextMenu(nextShowTextMenu);
      setIsSelectionMode(false);
      setShowLinesMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      
      if (nextShowTextMenu) {
        setShowStylePanel(false);
        setShowIconsPanel(false);
        setShowFontSizePanel(false);
      } else {
        setIsHighlighterActive(false);
      }
    } else if (action === 'Forma') {
      const next = !showIconsPanel;
      setShowIconsPanel(next);
      if (next) {
        setShowLinesMenu(false);
        setIsVectorizing(false);
        setEditingDrawingIds([]);
        setSelectedPointIndex(null);
        setSelectedDrawingIdForPoint(null);
        setSelectedLottieId(null);
        setShowStylePanel(false);
        setShowFontSizePanel(false);
        setShowTextMenu(false);
        setIsSelectionMode(false);
      }
    } else if (action === 'Selección') {
      setIsSelectionMode(!isSelectionMode);
      setIsHandMode(false);
      setShowLinesMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      if (!isSelectionMode) {
        setSelectedBoxIds([]);
        setSelectedLottieIds([]);
      }
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
    } else if (action === 'Mano') {
      setIsHandMode(!isHandMode);
      setIsSelectionMode(false);
      setShowLinesMenu(false);
      setIsVectorizing(false);
      setEditingDrawingIds([]);
      setSelectedPointIndex(null);
      setSelectedDrawingIdForPoint(null);
      setSelectedLottieId(null);
      setShowTextMenu(false);
      setShowStylePanel(false);
      setShowIconsPanel(false);
      setIsHighlighterActive(false);
    } else if (action === 'Eliminar') {
      if (selectedBoxIds.length > 0) {
        setTextBoxes(prev => prev.filter(box => !selectedBoxIds.includes(box.id)));
        setSelectedBoxIds([]);
      } else if (selectedLottieIds.length > 0) {
        setLottieAnimations(prev => prev.filter(l => !selectedLottieIds.includes(l.id)));
        setSelectedLottieIds([]);
      } else if (selectedBoxId) {
        setTextBoxes(prev => prev.filter(box => box.id !== selectedBoxId));
        setSelectedBoxId(null);
      } else if (selectedLottieId) {
        setLottieAnimations(prev => prev.filter(l => l.id !== selectedLottieId));
        setSelectedLottieId(null);
      } else if (editingDrawingIds.length > 0 || selectedPointIndex !== null) {
        deleteSelectedDrawings();
      }
    } else if (action === 'Gemini') {
      handleGeminiQuery();
    } else if (action === 'Flecha') {
      const next = !showLinesMenu;
      setShowLinesMenu(next);
      if (next) {
        setIsVectorizing(false);
        setEditingDrawingIds([]);
        setSelectedPointIndex(null);
        setSelectedDrawingIdForPoint(null);
        setSelectedLottieId(null);
        setShowIconsPanel(false);
        setShowStylePanel(false);
        setShowFontSizePanel(false);
        setShowTextMenu(false);
        setIsSelectionMode(false);
      }
    } else if (action === 'Imagen') {
      fileInputRef.current?.click();
    } else if (action === 'Objetivo' || action === 'Borrador') {
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

  const handleGeminiQuery = async () => {
    const selectedBoxes = textBoxes.filter(box => 
      selectedBoxIds.includes(box.id) || box.id === selectedBoxId
    );

    if (!geminiQuery.trim()) {
      alert("Por favor, ingresa una pregunta o petición.");
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
      
      const context = selectedBoxes.length > 0 
        ? `Contexto de mis notas:\n\n${selectedBoxes.map(box => box.text).join('\n\n')}\n\n` 
        : "";
      
      // Usamos gemini-3-flash-preview que es el modelo recomendado y más reciente
      const response = await (genAI.models as any).generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `${context}Pregunta/Investigación del usuario: ${geminiQuery}` }] }]
      });
      
      let fullText = '';
      for await (const chunk of response) {
        // En este SDK, el chunk tiene una propiedad text (getter)
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setGeminiResponse(fullText);
        }
      }
    } catch (error: any) {
      console.error("Error al consultar a Gemini:", error);
      const errorMsg = error?.message || JSON.stringify(error);
      alert(`Hubo un error al consultar a Gemini: ${errorMsg}`);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleImportToCanvas = () => {
    const textToImport = selectedGeminiText || geminiResponse;
    if (!textToImport) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? rect.width / 2 : 100;
    const y = rect ? rect.height / 2 : 100;
    
    const newBox: TextBox = {
      id: Date.now().toString(),
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
    setSelectedBoxIds([]);
    
    // Clear selection after import
    setSelectedGeminiText('');
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedGeminiText(selection.toString().trim());
    } else {
      setSelectedGeminiText('');
    }
  };

  const handleToggleMultiSelect = (id: string) => {
    if (textBoxes.find(b => b.id === id)) {
      setSelectedBoxIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else if (lottieAnimations.find(l => l.id === id)) {
      setSelectedLottieIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleGroupDrag = (id: string, delta: { x: number, y: number }) => {
    if (selectedBoxIds.includes(id) || selectedLottieIds.includes(id)) {
      // Dispatch a custom event for other boxes to update their motion values
      // This is much faster than React state updates during drag
      window.dispatchEvent(new CustomEvent('group-drag', { 
        detail: { senderId: id, delta } 
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const lottieData = JSON.parse(event.target?.result as string);
          const newLottie: LottieAnimation = {
            id: Date.now().toString(),
            x: 100,
            y: 100,
            scale: 1,
            data: lottieData,
            isPlaying: false
          };
          setLottieAnimations(prev => [...prev, newLottie]);
        } catch (error) {
          console.error("Error parsing Lottie JSON:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const updateLottieAnimation = (id: string, updates: any) => {
    setLottieAnimations(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
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
        .sub-menu-lineas-contenedor-flex {
          position: absolute !important;
          bottom: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          margin-bottom: 12px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 4px !important;
          z-index: 1000 !important;
          background-color: transparent !important;
          border: none !important;
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
          margin-bottom: 5px !important;
          background-color: #1a1a1a !important;
          padding: 15px !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          z-index: 1000 !important;
          width: 320px !important;
          display: block !important;
          margin-left: 0 !important;
          height: auto !important;
        }
        .control-container {
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
          height: 48px !important;
          margin-left: 1px !important;
          margin-top: 0px !important;
          margin-bottom: 2px !important;
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
          padding: 0 16px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        }
        .div-4,
        .control-container .div-4,
        div#root div.div-4 {
          height: 48px !important;
          margin-left: 16px !important;
          margin-top: 0px !important;
          margin-bottom: 3px !important;
          margin-right: -3px !important;
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
          border: 2px solid #FFD105 !important;
          border-radius: 40px !important;
          padding: 0 16px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
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
          align-items: center !important;
        }
      `}</style>
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
        <div className="ml-auto flex items-center gap-2">
          <button 
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isGeminiLoading ? 'animate-pulse' : 'hover:bg-white/10'}`}
            onClick={() => setShowGeminiModal(true)}
            title="Consultar a Gemini"
            style={{ border: `1px solid ${isGeminiLoading ? '#FFD105' : '#8e44ad'}` }}
          >
            <Sparkles size={20} color={isGeminiLoading ? '#FFD105' : '#8e44ad'} />
          </button>
        </div>
      </div>

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
          style={{ 
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: isPanning ? 'none' : 'auto',
            willChange: 'transform',
            zIndex: 2
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
            {drawings.map(renderDrawing)}
          </svg>
          {textBoxes.map((box) => (
            <TextBoxComponent
              key={box.id}
              {...box}
              isSelected={selectedBoxId === box.id}
              isMultiSelected={selectedBoxIds.includes(box.id)}
              isSelectionMode={isSelectionMode}
              canEdit={showTextMenu}
              onSelect={() => {
                setSelectedBoxId(box.id);
                setSelectedLottieId(null);
              }}
              onToggleMultiSelect={handleToggleMultiSelect}
              onUpdate={updateTextBox}
              onGroupDrag={handleGroupDrag}
              onGroupDragEnd={() => {}}
              onEditingChange={(isEditing) => {
                if (isEditing) setShowTextMenu(true);
              }}
              canvasScale={transform.scale}
              isHandMode={isHandMode}
            />
          ))}
          {lottieAnimations.map((lottie) => (
            <LottieComponent
              key={lottie.id}
              {...lottie}
              isSelected={selectedLottieId === lottie.id}
              isMultiSelected={selectedLottieIds.includes(lottie.id)}
              isSelectionMode={isSelectionMode}
              isHandMode={isHandMode}
              onSelect={() => {
                setSelectedLottieId(lottie.id);
                setSelectedBoxId(null);
              }}
              onToggleMultiSelect={handleToggleMultiSelect}
              onUpdate={updateLottieAnimation}
              onGroupDrag={handleGroupDrag}
              onGroupDragEnd={() => {}}
              canvasScale={transform.scale}
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
      <div className="frame frame-insert-lines" style={{ position: 'fixed', bottom: '10px', left: '0', width: '100%', height: 'auto', pointerEvents: 'none', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="control-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
          
          {/* Sub-menús reubicados dentro de sus botones correspondientes */}
          
          {showTextMenu ? (
            <div className="div-4" style={{ 
              marginLeft: '16px', 
              marginTop: '0px', 
              marginRight: '-3px', 
              marginBottom: '3px' 
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
                      minWidth: '320px', 
                      maxWidth: '420px',
                      overflowX: 'auto', 
                      whiteSpace: 'nowrap', 
                      padding: '0 120px', 
                      scrollbarWidth: 'none',
                      cursor: isDraggingFontSize.current ? 'grabbing' : 'grab',
                      outline: 'none',
                      scrollSnapType: 'x mandatory'
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
                className={textStyle.bold ? 'propiedad-activada' : 'propiedad'}
                onClick={() => {
                  toggleProperty('fontWeight', 'bold', 'normal');
                  setShowStylePanel(false);
                  setShowIconsPanel(false);
                }}
              >
                <Bold size={20} color={textStyle.bold ? '#FFD105' : 'white'} strokeWidth={1.5} />
              </button>
              <button 
                className={textStyle.italic ? 'propiedad-activada' : 'propiedad'}
                onClick={() => {
                  toggleProperty('fontStyle', 'italic', 'normal');
                  setShowStylePanel(false);
                  setShowIconsPanel(false);
                }}
              >
                <Italic size={20} color={textStyle.italic ? '#FFD105' : 'white'} strokeWidth={1.5} />
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
                    <button className="ellipse-yellow" title="Amarillo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#FFD105')}></button>
                    <button className="ellipse-green" title="Verde" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#00ff00')}></button>
                    <button className="ellipse-2-instance" title="Morado" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#7500c9')}></button>
                    <button className="ellipse-3" title="Rosa" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#fe19fa')}></button>
                    <button className="ellipse-4" title="Cian" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#0bf5e6')}></button>
                    <button className="ellipse-5" title="Rojo" onClick={() => applyPropertyToSelected(isHighlighterActive ? 'backgroundColor' : 'color', '#ff2c2c')}></button>
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
                  <div className="div-4 sub-menu-formas-flotante" 
                    onMouseDown={(e) => e.preventDefault()} 
                  >
                    <div className="icons-grid" 
                      onMouseDown={(e) => e.preventDefault()} 
                      style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                    >
                      {[
                        { id: 'vector-4', icon: <Activity size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-5', icon: <ArrowUp size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-6', icon: <ArrowDown size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-7', icon: <ArrowRight size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-8', icon: <ArrowLeft size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-9', icon: <Hexagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-10', icon: <MessageSquare size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-11', icon: <MessageCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-12', icon: <Calendar size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-13', icon: <CalendarCheck size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-14', icon: <Brain size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-15', icon: <BrainCircuit size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-16', icon: <User size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-17', icon: <Crown size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-18', icon: <Ghost size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-19', icon: <Castle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-20', icon: <CircleUser size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-21', icon: <GraduationCap size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-22', icon: <Cherry size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-23', icon: <ArrowLeftCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-24', icon: <ArrowUpCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-25', icon: <ArrowDownCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-26', icon: <ArrowRightCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-27', icon: <Clock size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-28', icon: <Star size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-29', icon: <FlaskConicalOff size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-30', icon: <Heart size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-31', icon: <HeartCrack size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-32', icon: <Box size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-33', icon: <Zap size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-34', icon: <Columns size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-35', icon: <AlertOctagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-36', icon: <Circle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-37', icon: <Octagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-38', icon: <Leaf size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-39', icon: <Triangle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-40', icon: <Radiation size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-41', icon: <Skull size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-42', icon: <Sword size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-43', icon: <TestTube size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-44', icon: <Zap size={14} color="black" strokeWidth={1.5} /> },
                      ].map((item) => (
                        <span 
                          key={item.id} 
                          className={`${item.id} ${activeShape === item.id ? 'propiedad-activada' : ''}`}
                          style={activeShape === item.id ? { border: '1px solid #FFD105' } : {}}
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
                        </span>
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
          ) : (
            <div className="barra-de-botones" style={{ 
              marginLeft: '1px', 
              marginTop: '0px', 
              marginBottom: '2px', 
              marginRight: '1px' 
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
                    <div className="sub-menu-lineas-contenedor-flex">
                      {showLineColorPalette && (
                        <div className="paleta-colores-lineas">
                          <button className="ellipse-black" onClick={() => { setStrokeColor('#000000'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-yellow" onClick={() => { setStrokeColor('#FFD105'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-green" onClick={() => { setStrokeColor('#00ff00'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-purple" onClick={() => { setStrokeColor('#7500c9'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-pink" onClick={() => { setStrokeColor('#fe19fa'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-cyan" onClick={() => { setStrokeColor('#0bf5e6'); setShowLineColorPalette(false); }}></button>
                          <button className="ellipse-red" onClick={() => { setStrokeColor('#ff2c2c'); setShowLineColorPalette(false); }}></button>
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
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Imagen')} title="Insertar Lottie">
                <span className="icon-instance-node"><Plus size={20} /></span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleFileChange}
              />
              <button className="boton-de-eliminar" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Eliminar')} title="Eliminar">
                <span className="icon-instance-node"><Trash2 size={20} /></span>
              </button>
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Objetivo')} title="Objetivo">
                <span className="icon-instance-node"><Target size={20} /></span>
              </button>
              <button className="BOTON-DE-INSERTAR" onMouseDown={(e) => e.preventDefault()} onClick={() => handleAction('Borrador')} title="Borrador">
                <span className="icon-instance-node"><Eraser size={20} /></span>
              </button>
              <div className="contenedor-fijo-formas" style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                  className={`BOTON-DE-INSERTAR anadir-formas-2 ${showIconsPanel ? 'bg-[#FFD105]/20 border-[#FFD105]' : ''}`} 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAction('Forma')} 
                  title="Forma"
                >
                  <span className="icon-instance-node"><Diamond size={20} color={showIconsPanel ? '#FFD105' : 'currentColor'} /></span>
                </button>
                {showIconsPanel && !showTextMenu && (
                  <div className="div-4 sub-menu-formas-flotante" 
                    onMouseDown={(e) => e.preventDefault()} 
                  >
                    <div className="icons-grid" 
                      onMouseDown={(e) => e.preventDefault()} 
                      style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}
                    >
                      {[
                        { id: 'vector-4', icon: <Activity size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-5', icon: <ArrowUp size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-6', icon: <ArrowDown size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-7', icon: <ArrowRight size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-8', icon: <ArrowLeft size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-9', icon: <Hexagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-10', icon: <MessageSquare size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-11', icon: <MessageCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-12', icon: <Calendar size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-13', icon: <CalendarCheck size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-14', icon: <Brain size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-15', icon: <BrainCircuit size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-16', icon: <User size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-17', icon: <Crown size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-18', icon: <Ghost size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-19', icon: <Castle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-20', icon: <CircleUser size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-21', icon: <GraduationCap size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-22', icon: <Cherry size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-23', icon: <ArrowLeftCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-24', icon: <ArrowUpCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-25', icon: <ArrowDownCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-26', icon: <ArrowRightCircle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-27', icon: <Clock size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-28', icon: <Star size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-29', icon: <FlaskConicalOff size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-30', icon: <Heart size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-31', icon: <HeartCrack size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-32', icon: <Box size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-33', icon: <Zap size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-34', icon: <Columns size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-35', icon: <AlertOctagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-36', icon: <Circle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-37', icon: <Octagon size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-38', icon: <Leaf size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-39', icon: <Triangle size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-40', icon: <Radiation size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-41', icon: <Skull size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-42', icon: <Sword size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-43', icon: <TestTube size={18} color="black" strokeWidth={1.5} /> },
                        { id: 'vector-44', icon: <Zap size={14} color="black" strokeWidth={1.5} /> },
                      ].map((item) => (
                        <span 
                          key={item.id} 
                          className={`${item.id} ${activeShape === item.id ? 'propiedad-activada' : ''}`}
                          style={activeShape === item.id ? { border: '1px solid #FFD105' } : {}}
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
                        </span>
                      ))}
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

      {/* Ventana Flotante de Gemini */}
      {showGeminiModal && (
        <motion.div 
          drag
          dragControls={geminiDragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0.05}
          className="fixed top-24 right-8 z-[1000] w-[360px] flex flex-col rounded-b-2xl shadow-2xl"
          style={{ 
            backgroundColor: '#232323',
            border: '2px solid #8e44ad',
            maxHeight: 'calc(100vh - 150px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            touchAction: 'none'
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileDrag={{ cursor: 'grabbing' }}
        >
          {/* Handle de arrastre (Igual que en los cuadros de texto) */}
          <div 
            className="absolute -top-5 left-[-2px] right-[-2px] h-5 bg-[#8e44ad] rounded-t-sm flex items-center justify-center cursor-move z-[1002]"
            onPointerDown={(e) => geminiDragControls.start(e)}
            style={{ touchAction: 'none' }}
          >
            <div className="w-8 h-1 bg-white/40 rounded-full" />
          </div>

          <div className="flex flex-col w-full h-full overflow-hidden rounded-b-2xl">
            {/* Header de la ventana */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles size={18} color="#8e44ad" />
              <span className="text-white font-semibold text-sm">Consultar a Gemini</span>
            </div>
            <button 
              onClick={() => {
                setShowGeminiModal(false);
                setGeminiResponse('');
                setGeminiQuery('');
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={18} color="white" />
            </button>
          </div>

          {/* Cuerpo de la ventana (Respuestas) */}
          <div 
            className="flex-1 min-h-[300px] overflow-y-auto p-4 custom-scrollbar relative"
            onMouseUp={handleTextSelection}
          >
            {geminiResponse ? (
              <>
                <div className="text-white/90 prose prose-invert prose-sm max-w-none">
                  <Markdown>{geminiResponse}</Markdown>
                </div>
                <button
                  onClick={handleImportToCanvas}
                  className="sticky bottom-0 mt-4 ml-auto flex items-center gap-2 px-3 py-2 bg-[#8e44ad] hover:bg-[#9b59b6] text-white text-xs font-medium rounded-lg transition-all shadow-lg animate-in fade-in slide-in-from-bottom-2"
                  title={selectedGeminiText ? "Importar fragmento seleccionado" : "Importar respuesta completa"}
                >
                  <Plus size={14} />
                  {selectedGeminiText ? "Importar Selección" : "Importar al Lienzo"}
                </button>
              </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/40 gap-3 py-12">
                  <BrainCircuit size={40} strokeWidth={1} />
                  <p className="text-center text-xs px-6">
                    {textBoxes.filter(b => selectedBoxIds.includes(b.id) || b.id === selectedBoxId).length > 0 
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
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="grid grid-cols-[1fr_auto] gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/10 focus-within:border-[#8e44ad] transition-all">
              <textarea
                value={geminiQuery}
                onChange={(e) => setGeminiQuery(e.target.value)}
                placeholder="Pregunta algo..."
                className="w-full bg-transparent border-none px-3 py-2 text-white text-xs outline-none resize-none h-[40px] custom-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGeminiQuery();
                  }
                }}
              />
              <button 
                onClick={handleGeminiQuery}
                disabled={isGeminiLoading || !geminiQuery.trim()}
                className="w-10 h-10 bg-[#8e44ad] hover:bg-[#9b59b6] disabled:opacity-30 disabled:hover:bg-[#8e44ad] rounded-xl transition-all shadow-lg flex items-center justify-center"
              >
                {isGeminiLoading ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <Send size={18} color="white" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-white/30 mt-2 text-center">
              Investiga o usa tus notas como contexto.
            </p>
          </div>
        </div>
      </motion.div>
      )}
    </div>
  );
};

export default LienzoDeApuntes;
