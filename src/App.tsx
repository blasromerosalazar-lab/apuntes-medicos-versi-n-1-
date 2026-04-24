/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookPlus, 
  Clock, 
  BookOpen, 
  Box,
  Diamond,
  AlertCircle,
  X,
  FolderSync,
  MoreVertical,
  Trash2,
  Eye,
  List,
  CheckSquare,
  Square,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LienzoDeApuntes from './components/LienzoDeApuntes';

interface Note {
  id: string;
  title: string;
  colorId?: string;
}

interface Subject {
  id: string;
  name: string;
  gradient: string;
  colorId: string;
  notes: Note[];
}

const AutoFileStorage = () => {
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intentar reconectar si ya se había dado permiso
  useEffect(() => {
    const initStorage = async () => {
      // NOTE: FileSystemDirectoryHandle is not automatically restored across sessions without user interaction
      // in most generic implementations, but we check flag. If future browser support handles persistent IDs, 
      // we'd use idb-keyval. For now we wait for user click if handle is lost.
    };
    initStorage();
  }, []);

  // 1. Vincular carpeta (Solo se hace una vez)
  const connectFolder = async () => {
    try {
      setErrorMsg(null);
      const handle = await (window as any).showDirectoryPicker({
        id: 'mednotes_backup',
        mode: 'readwrite'
      });
      setDirHandle(handle);
      localStorage.setItem('folder_linked', 'true');
    } catch (err: any) {
      console.error("Acceso denegado a la carpeta", err);
      if (err.name === 'SecurityError' || err.message?.includes('Cross origin') || err.message?.includes('sub frames')) {
        const msg = '⚠️ Para usar la sincronización local, debes abrir la aplicación en una pestaña nueva.\n\nHaz clic en el icono "Open in new tab" en la esquina superior derecha.';
        alert(msg);
        setErrorMsg('Debes abrir la app en una Pestaña Nueva para habilitar el guardado local.');
      } else {
        setErrorMsg('Acceso denegado o cancelado.');
      }
    }
  };

  // 2. Función de Guardado Automático Real
  const performAutoSave = async (content: string, fileName: string) => {
    if (!dirHandle) return;

    setStatus('SAVING');
    try {
      // fileName is passed dynamically from the event
      const fileHandle = await dirHandle.getFileHandle(`${fileName}.json`, { create: true });
      const writable = await fileHandle.createWritable();
      
      const data = {
        id: crypto.randomUUID(),
        content: content,
        lastUpdate: new Date().toISOString(),
        device: "Redmi Pad SE"
      };

      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      
      setTimeout(() => setStatus('IDLE'), 1000);
    } catch (error) {
      console.error("Error en autosave:", error);
      setStatus('ERROR');
    }
  };

  // 3. Manejador de cambios (Debounce para fluidez) a través de evento global
  useEffect(() => {
    const handleAutoSaveRequest = (e: CustomEvent) => {
      if (!dirHandle) return;
      
      const { content, fileName } = e.detail;
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      // Espera 800ms sin escribir para ejecutar el guardado físico
      saveTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(() => performAutoSave(content, fileName));
      }, 800);
    };

    const handleConnectRequest = () => {
      connectFolder();
    };

    window.addEventListener('request-auto-save', handleAutoSaveRequest as EventListener);
    window.addEventListener('request-connect-folder', handleConnectRequest as EventListener);
    return () => {
      window.removeEventListener('request-auto-save', handleAutoSaveRequest as EventListener);
      window.removeEventListener('request-connect-folder', handleConnectRequest as EventListener);
    };
  }, [dirHandle]);

  return (
    <div className="fixed bottom-[100px] right-4 flex flex-col items-end gap-2 z-[10000] pointer-events-none">
      {errorMsg && (
        <div className="pointer-events-auto bg-red-600/90 text-white text-xs p-3 rounded-lg max-w-[250px] shadow-lg backdrop-blur-md border border-red-400">
          ⚠️ {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="ml-2 underline font-bold">OK</button>
        </div>
      )}
      {dirHandle && (
        <div className={`pointer-events-auto text-xs px-3 py-1.5 rounded-full shadow-lg ${status === 'SAVING' ? 'bg-[#FFD105] text-black' : 'bg-[#188A0B] text-white'} font-bold transition-colors`}>
          {status === 'SAVING' ? '💾 Guardando en tablet...' : '✅ Sincronizado'}
        </div>
      )}
    </div>
  );
};


const COLORS = [
  { 
    id: 'cyan', 
    gradient: 'linear-gradient(180deg, rgba(6, 143, 134, 0.61) 11%, rgba(11, 245, 230, 0.61) 100%)', 
    color: '#068F86',
    lava: { c1: '#073b3a', c2: '#12a8a1', c3: '#0b6b69' }
  },
  { 
    id: 'red', 
    gradient: 'linear-gradient(90deg, rgba(153, 27, 27, 1) 0%, rgba(255, 44, 44, 1) 100%)', 
    color: '#991B1B',
    lava: { c1: '#450a0a', c2: '#991b1b', c3: '#7f1d1d' }
  },
  { 
    id: 'purple', 
    gradient: 'linear-gradient(90deg, rgba(152, 15, 150, 1) 0%, rgba(254, 25, 250, 1) 100%)', 
    color: '#980F96',
    lava: { c1: '#4c0519', c2: '#980f96', c3: '#701a75' }
  },
  { 
    id: 'green', 
    gradient: 'linear-gradient(90deg, rgba(24, 138, 11, 1) 0%, rgba(41, 240, 19, 1) 100%)', 
    color: '#188A0B',
    lava: { c1: '#064e3b', c2: '#188a0b', c3: '#14532d' }
  },
  { 
    id: 'yellow', 
    gradient: 'linear-gradient(90deg, rgba(153, 138, 25, 1) 0%, rgba(255, 230, 41, 1) 100%)', 
    color: '#998A19',
    lava: { c1: '#422006', c2: '#998a19', c3: '#713f12' }
  },
  { 
    id: 'deep-purple', 
    gradient: 'linear-gradient(90deg, rgba(58, 0, 99, 1) 0%, rgba(118, 0, 201, 1) 100%)', 
    color: '#3A0063',
    lava: { c1: '#2e1065', c2: '#3a0063', c3: '#4c1d95' }
  },
];

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [selectedColorId, setSelectedColorId] = useState(COLORS[0].id);
  const [activeTab, setActiveTab] = useState<'recientes' | 'materias' | '3d'>('materias');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [activeNoteMenu, setActiveNoteMenu] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSelected = async () => {
    if (selectedNoteIds.length === 0) return;
    setIsExporting(true);
    
    const db = (window as any).db;
    const exportResults = [];

    try {
      for (const noteId of selectedNoteIds) {
        const noteInfo = selectedSubject?.notes.find(n => n.id === noteId);
        if (!noteInfo) continue;

        let noteContent = {
          userNotes: '',
          tasks: [],
          textBoxes: [],
          drawings: [],
          lottieAnimations: [],
          model3DAnimations: [],
          canvasShapes: [],
          images: [],
          schemaNodes: []
        };

        // If DB exists, try to get full content
        if (db?.notas) {
          try {
            const doc = await db.notas.get(noteId);
            if (doc) {
              noteContent = { ...noteContent, ...doc };
            }
          } catch (e) {
            console.error(`Error loading note ${noteId} from DB:`, e);
          }
        }

        exportResults.push({
          id: noteId,
          title: noteInfo.title,
          ...noteContent
        });
      }

      const exportData = {
        app: "MedNotes_UCV",
        exportType: "MULTI_EXPORT",
        version: "1.0",
        timestamp: new Date().toISOString(),
        notesCount: exportResults.length,
        notes: exportResults
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedNotes_Export_${selectedSubject?.name.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Feedback visual
      setIsSelectionMode(false);
      setSelectedNoteIds([]);
    } catch (err) {
      console.error("Error al exportar múltiples notas:", err);
      setError("Error al exportar las notas seleccionadas.");
    } finally {
      setIsExporting(false);
    }
  };
  const [error, setError] = useState<string | null>(null);

  // Auto-guardado global de materias
  useEffect(() => {
    if (subjects.length > 0) {
      window.dispatchEvent(new CustomEvent('request-auto-save', {
        detail: {
          content: subjects,
          fileName: 'Catálogo_Materias'
        }
      }));
    }
  }, [subjects]);

  const handleCreateSubject = () => {
    try {
      if (!newSubjectName.trim()) return;

      const selectedColor = COLORS.find(c => c.id === selectedColorId);
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newSubject: Subject = {
        id: `subject-${uuid}`,
        name: newSubjectName.toUpperCase(),
        gradient: selectedColor?.gradient || COLORS[0].gradient,
        colorId: selectedColorId,
        notes: [],
      };

      setSubjects([...subjects, newSubject]);
      setNewSubjectName('');
      setIsModalOpen(false);
    } catch (err) {
      setError('No se pudo crear la materia. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
  };

  const handleCreateNote = () => {
    try {
      if (!newNoteTitle.trim() || !selectedSubjectId) return;

      const updatedSubjects = subjects.map(s => {
        if (s.id === selectedSubjectId) {
          const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          return {
            ...s,
            notes: [...s.notes, { id: `note-${uuid}`, title: newNoteTitle.toUpperCase() }]
          };
        }
        return s;
      });

      setSubjects(updatedSubjects);
      setNewNoteTitle('');
      setIsNoteModalOpen(false);
    } catch (err) {
      setError('No se pudo crear la nota. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setSubjects(prev => prev.map(s => {
      const idx = s.notes.findIndex(n => n.id === noteId);
      if (idx !== -1) {
        const newNotes = [...s.notes];
        newNotes.splice(idx, 1);
        return { ...s, notes: newNotes };
      }
      return s;
    }));
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Derived state for Recientes: Flatten all notes from all subjects and sort by ID (timestamp) descending
  const notasRecientes = subjects.flatMap(subject => 
    subject.notes.map(note => ({
      ...note,
      subjectName: subject.name,
      gradient: subject.gradient,
      subjectId: subject.id,
      subjectColorId: subject.colorId
    }))
  ).sort((a, b) => {
    // Extract timestamp from ID: "note-TIMESTAMP-RANDOM"
    const timeA = Number(a.id.split('-')[1]) || 0;
    const timeB = Number(b.id.split('-')[1]) || 0;
    return timeB - timeA;
  });

  const getLavaStyle = (colorId: string) => {
    const colorConfig = COLORS.find(c => c.id === colorId);
    if (!colorConfig?.lava) return {};
    return {
      '--lava-c1': colorConfig.lava.c1,
      '--lava-c2': colorConfig.lava.c2,
      '--lava-c3': colorConfig.lava.c3,
    } as React.CSSProperties;
  };

  if (selectedNote) {
    const subject = subjects.find(s => s.notes.some(n => n.id === selectedNote.id));
    const colorConfig = COLORS.find(c => c.id === (subject?.colorId || 'cyan')) || COLORS[0];

    return (
      <>
        <LienzoDeApuntes 
          id={selectedNote.id}
          title={selectedNote.title} 
          color={colorConfig.color}
          gradient={colorConfig.gradient}
          isViewOnly={isViewOnlyMode}
          onBack={() => {
            setSelectedNote(null);
            setIsViewOnlyMode(false);
          }} 
        />
        <AutoFileStorage />
      </>
    );
  }

  if (selectedSubjectId && selectedSubject) {
    return (
      <>
        <div className="subject-detail-container">
          <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <header className="w-full flex items-center justify-between px-6 h-[85px] sticky top-0 bg-[#060000] z-[50] border-b border-white/5 shadow-2xl">
          <div className="flex items-center">
            <div className="cursor-pointer hover:bg-white/10 p-3 rounded-full transition-all active:scale-90" onClick={() => {
              setSelectedSubjectId(null);
              setIsSelectionMode(false);
              setSelectedNoteIds([]);
            }}>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="ml-4 color-white font-istok text-[30px] font-black uppercase tracking-tighter truncate max-w-[150px] sm:max-w-md">{selectedSubject.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {isSelectionMode && selectedNoteIds.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleExportSelected}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-xl ${isExporting ? 'opacity-50' : 'hover:bg-blue-700'}`}
              >
                <FileDown size={18} />
                <span className="hidden sm:inline">{isExporting ? 'Exportando...' : `Exportar (${selectedNoteIds.length})`}</span>
                <span className="sm:hidden">{selectedNoteIds.length}</span>
              </motion.button>
            )}
            
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedNoteIds([]);
              }}
              className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all border-2 active:scale-95 ${isSelectionMode ? 'bg-[#FFD105] border-[#FFD105] text-black' : 'bg-transparent border-white/40 text-white hover:border-white hover:bg-white/10'}`}
              title="Selección Múltiple"
              id="multi-select-trigger"
            >
              <MoreVertical size={24} />
            </button>
          </div>
        </header>

        <main className="notes-grid">
          <AnimatePresence mode="popLayout">
            {selectedSubject.notes.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center opacity-30"
              >
                <BookOpen size={48} className="mx-auto mb-4" />
                <p className="text-white font-medium uppercase tracking-widest text-xs">Aún no hay notas en esta materia</p>
              </motion.div>
            )}
            {selectedSubject.notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className={`note-card lava-effect relative ${isSelectionMode && selectedNoteIds.includes(note.id) ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''}`}
                style={getLavaStyle(selectedSubject.colorId)}
                onClick={() => {
                  if (isSelectionMode) {
                    setSelectedNoteIds(prev => 
                      prev.includes(note.id) 
                        ? prev.filter(id => id !== note.id) 
                        : [...prev, note.id]
                    );
                  } else {
                    setSelectedNote(note);
                  }
                }}
              >
                <div className="absolute top-[17px] right-3 z-20 flex items-center gap-2">
                  {isSelectionMode ? (
                    <div className="text-white">
                      {selectedNoteIds.includes(note.id) ? (
                        <CheckSquare className="w-6 h-6 text-blue-400 fill-blue-400/20" />
                      ) : (
                        <Square className="w-6 h-6 text-white/30" />
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNoteMenu(activeNoteMenu === note.id ? null : note.id);
                      }}
                      className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                  )}
                  
                  <AnimatePresence>
                    {!isSelectionMode && activeNoteMenu === note.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-1 bg-[#232323] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100] min-w-[120px]"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNote(note);
                            setIsViewOnlyMode(true);
                            setActiveNoteMenu(null);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                        >
                          <Eye size={16} /> Visor
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                            setActiveNoteMenu(null);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-white/10 transition-colors"
                        >
                          <Trash2 size={16} /> Borrar
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="card-content">
                  <Diamond className="note-icon fill-white text-white" />
                  <span className="note-title pr-6">{note.title}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>

        <button 
          className="fab-button" 
          onClick={() => setIsNoteModalOpen(true)}
        >
          <BookPlus className="fab-icon text-white" strokeWidth={1.5} />
        </button>

        <AnimatePresence>
          {isNoteModalOpen && (
            <div className="modal-overlay" onClick={() => setIsNoteModalOpen(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="note-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="note-modal-title">Crear nota</h2>
                
                <div className="note-input-wrapper">
                  <input 
                    type="text" 
                    className="note-input"
                    placeholder="Ej;Carbohidratos"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <button className="note-create-button" onClick={handleCreateNote}>
                  <span className="note-create-text">Crear</span>
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <nav className="bottom-nav">
          <button className="nav-item" onClick={() => { setSelectedSubjectId(null); setActiveTab('recientes'); }}>
            <div className="relative flex flex-col items-center justify-center">
              {/* Base Layer (White) */}
              <div className="flex flex-col items-center justify-center text-white">
                <Clock className="nav-icon" />
                <span className="nav-text">Recientes</span>
              </div>
              {/* Active Layer (Yellow Sweep) */}
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
                initial={false}
                animate={{ 
                  clipPath: activeTab === 'recientes' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' 
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Clock className="nav-icon" />
                <span className="nav-text">Recientes</span>
              </motion.div>
            </div>
          </button>
          <button className="nav-item" onClick={() => setSelectedSubjectId(null)}>
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center text-white">
                <BookOpen className="nav-icon" />
                <span className="nav-text">Materias</span>
              </div>
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
                initial={false}
                animate={{ 
                  clipPath: 'inset(0 0% 0 0)' 
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <BookOpen className="nav-icon" />
                <span className="nav-text">Materias</span>
              </motion.div>
            </div>
          </button>
          <button className="nav-item" onClick={() => { setSelectedSubjectId(null); setActiveTab('3d'); }}>
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center text-white">
                <Box className="nav-icon" />
                <span className="nav-text">3D/Animaciones</span>
              </div>
              <motion.div 
                className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
                initial={false}
                animate={{ 
                  clipPath: activeTab === '3d' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' 
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Box className="nav-icon" />
                <span className="nav-text">3D/Animaciones</span>
              </motion.div>
            </div>
          </button>
          
          <button className="nav-item" onClick={() => window.dispatchEvent(new CustomEvent('request-connect-folder'))}>
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center text-white text-opacity-70 hover:text-opacity-100 transition-opacity">
                <FolderSync className="nav-icon" />
                <span className="nav-text">Sync Local</span>
              </div>
            </div>
          </button>
        </nav>
      </div>
      <AutoFileStorage />
    </>
    );
  }

  return (
    <>
      <div className="app-container">
        <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="header-frame">
        <h1 className="title-text">
          {activeTab === 'recientes' ? 'Recientes' : activeTab === 'materias' ? 'Tus materias' : '3D/Animaciones'}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'materias' && (
          <div className="subject-list">
            <AnimatePresence>
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="subject-bar lava-effect"
                  style={getLavaStyle(subject.colorId)}
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  <Diamond className="subject-icon fill-white text-white" />
                  <span className="subject-name">{subject.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'recientes' && (
          <div className="recientes-grid">
            <AnimatePresence>
              {notasRecientes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="recientes-card lava-effect relative"
                  style={getLavaStyle(note.subjectColorId)}
                  onClick={() => setSelectedNote({ id: note.id, title: note.title })}
                >
                  <div className="absolute top-[17px] right-3 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNoteMenu(activeNoteMenu === note.id ? null : note.id);
                      }}
                      className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    <AnimatePresence>
                      {activeNoteMenu === note.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 bg-[#232323] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100] min-w-[120px]"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNote({ id: note.id, title: note.title });
                              setIsViewOnlyMode(true);
                              setActiveNoteMenu(null);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                          >
                            <Eye size={16} /> Visor
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                              setActiveNoteMenu(null);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-white/10 transition-colors"
                          >
                            <Trash2 size={16} /> Borrar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="card-content">
                    <Diamond className="card-diamond" />
                    <span className="card-title pr-6">{note.title}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === '3d' && (
          <div className="flex items-center justify-center h-full opacity-50">
            <p className="text-xl font-istok">Próximamente...</p>
          </div>
        )}
      </main>

      {/* FAB */}
      {activeTab === 'materias' && (
        <button 
          className="fab-button" 
          onClick={() => setIsModalOpen(true)}
          aria-label="Añadir materia"
        >
          <BookPlus className="fab-icon text-white" strokeWidth={1.5} />
        </button>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="modal-title">Nombre de la materia</h2>
              
              <div className="input-wrapper">
                <input 
                  type="text" 
                  className="subject-input"
                  placeholder="Ej. BIOQUÍMICA"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="color-selection">
                  {COLORS.map((color) => (
                    <div 
                      key={color.id}
                      className={`color-circle ${selectedColorId === color.id ? 'selected' : ''}`}
                      style={{ backgroundColor: color.color }}
                      onClick={() => setSelectedColorId(color.id)}
                    />
                  ))}
                </div>

                <button className="create-button" onClick={handleCreateSubject}>
                  <span className="create-button-text">Crear</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'recientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recientes')}
        >
          <div className="relative flex flex-col items-center justify-center">
            {/* Base Layer (White) */}
            <div className="flex flex-col items-center justify-center text-white">
              <Clock className="nav-icon" />
              <span className="nav-text">Recientes</span>
            </div>
            {/* Active Layer (Yellow Sweep) */}
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
              initial={false}
              animate={{ 
                clipPath: activeTab === 'recientes' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' 
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Clock className="nav-icon" />
              <span className="nav-text">Recientes</span>
            </motion.div>
          </div>
        </button>
        <button 
          className={`nav-item ${activeTab === 'materias' ? 'active' : ''}`}
          onClick={() => setActiveTab('materias')}
        >
          <div className="relative flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center text-white">
              <BookOpen className="nav-icon" />
              <span className="nav-text">Materias</span>
            </div>
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
              initial={false}
              animate={{ 
                clipPath: activeTab === 'materias' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' 
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <BookOpen className="nav-icon" />
              <span className="nav-text">Materias</span>
            </motion.div>
          </div>
        </button>
        <button 
          className={`nav-item ${activeTab === '3d' ? 'active' : ''}`}
          onClick={() => setActiveTab('3d')}
        >
          <div className="relative flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center text-white">
              <Box className="nav-icon" />
              <span className="nav-text">3D/Animaciones</span>
            </div>
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center text-[#FFD105] overflow-hidden pointer-events-none"
              initial={false}
              animate={{ 
                clipPath: activeTab === '3d' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' 
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Box className="nav-icon" />
              <span className="nav-text">3D/Animaciones</span>
            </motion.div>
          </div>
        </button>
        <button 
          className="nav-item"
          onClick={() => window.dispatchEvent(new CustomEvent('request-connect-folder'))}
        >
          <div className="relative flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center text-white text-opacity-70 hover:text-opacity-100 transition-opacity">
              <FolderSync className="nav-icon" />
              <span className="nav-text">Sync Local</span>
            </div>
          </div>
        </button>
      </nav>
      </div>
      <AutoFileStorage />
    </>
  );
}
