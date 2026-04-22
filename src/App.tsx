/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BookPlus, 
  Clock, 
  BookOpen, 
  Box,
  Diamond,
  AlertCircle,
  X
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
  const [error, setError] = useState<string | null>(null);

  const handleCreateSubject = () => {
    try {
      if (!newSubjectName.trim()) return;

      const selectedColor = COLORS.find(c => c.id === selectedColorId);
      const newSubject: Subject = {
        id: `subject-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
          return {
            ...s,
            notes: [...s.notes, { id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, title: newNoteTitle.toUpperCase() }]
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
      <LienzoDeApuntes 
        id={selectedNote.id}
        title={selectedNote.title} 
        color={colorConfig.color}
        gradient={colorConfig.gradient}
        onBack={() => setSelectedNote(null)} 
      />
    );
  }

  if (selectedSubjectId && selectedSubject) {
    return (
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
        <header className="subject-header">
          <div className="back-button" onClick={() => setSelectedSubjectId(null)}>
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="subject-title ml-12">{selectedSubject.name}</h1>
        </header>

        <main className="notes-grid">
          <AnimatePresence>
            {selectedSubject.notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="note-card lava-effect"
                style={getLavaStyle(selectedSubject.colorId)}
                onClick={() => setSelectedNote(note)}
              >
                <div className="card-content">
                  <Diamond className="note-icon fill-white text-white" />
                  <span className="note-title">{note.title}</span>
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
        </nav>
      </div>
    );
  }

  return (
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
                  className="recientes-card lava-effect"
                  style={getLavaStyle(note.subjectColorId)}
                  onClick={() => setSelectedNote({ id: note.id, title: note.title })}
                >
                  <div className="card-content">
                    <Diamond className="card-diamond" />
                    <span className="card-title">{note.title}</span>
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
      </nav>
    </div>
  );
}
