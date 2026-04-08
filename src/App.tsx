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
  Diamond
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Note {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  name: string;
  gradient: string;
  notes: Note[];
}

const COLORS = [
  { id: 'cyan', gradient: 'linear-gradient(180deg, rgba(6, 143, 134, 0.61) 11%, rgba(11, 245, 230, 0.61) 100%)', color: '#068F86' },
  { id: 'red', gradient: 'linear-gradient(90deg, rgba(153, 27, 27, 1) 0%, rgba(255, 44, 44, 1) 100%)', color: '#991B1B' },
  { id: 'purple', gradient: 'linear-gradient(90deg, rgba(152, 15, 150, 1) 0%, rgba(254, 25, 250, 1) 100%)', color: '#980F96' },
  { id: 'green', gradient: 'linear-gradient(90deg, rgba(24, 138, 11, 1) 0%, rgba(41, 240, 19, 1) 100%)', color: '#188A0B' },
  { id: 'yellow', gradient: 'linear-gradient(90deg, rgba(153, 138, 25, 1) 0%, rgba(255, 230, 41, 1) 100%)', color: '#998A19' },
  { id: 'deep-purple', gradient: 'linear-gradient(90deg, rgba(58, 0, 99, 1) 0%, rgba(118, 0, 201, 1) 100%)', color: '#3A0063' },
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

  const handleCreateSubject = () => {
    if (!newSubjectName.trim()) return;

    const selectedColor = COLORS.find(c => c.id === selectedColorId);
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: newSubjectName.toUpperCase(),
      gradient: selectedColor?.gradient || COLORS[0].gradient,
      notes: [],
    };

    setSubjects([...subjects, newSubject]);
    setNewSubjectName('');
    setIsModalOpen(false);
  };

  const handleCreateNote = () => {
    if (!newNoteTitle.trim() || !selectedSubjectId) return;

    const updatedSubjects = subjects.map(s => {
      if (s.id === selectedSubjectId) {
        return {
          ...s,
          notes: [...s.notes, { id: Date.now().toString(), title: newNoteTitle.toUpperCase() }]
        };
      }
      return s;
    });

    setSubjects(updatedSubjects);
    setNewNoteTitle('');
    setIsNoteModalOpen(false);
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Derived state for Recientes: Flatten all notes from all subjects and sort by ID (timestamp) descending
  const notasRecientes = subjects.flatMap(subject => 
    subject.notes.map(note => ({
      ...note,
      subjectName: subject.name,
      gradient: subject.gradient,
      subjectId: subject.id
    }))
  ).sort((a, b) => Number(b.id) - Number(a.id));

  const isBioquimica = (name: string) => {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === 'BIOQUIMICA';
  };

  if (selectedSubjectId && selectedSubject) {
    return (
      <div className="subject-detail-container">
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
                className={`note-card ${isBioquimica(selectedSubject.name) ? 'lava-lamp-cyan' : ''}`}
                style={isBioquimica(selectedSubject.name) ? {} : { background: selectedSubject.gradient }}
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
                className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
                className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
                className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
                  className={`subject-bar ${isBioquimica(subject.name) ? 'lava-lamp-cyan' : ''}`}
                  style={isBioquimica(subject.name) ? {} : { background: subject.gradient }}
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
                  className={`recientes-card ${isBioquimica(note.subjectName) ? 'lava-lamp-cyan' : ''}`}
                  style={isBioquimica(note.subjectName) ? {} : { background: note.gradient.replace('90deg', '180deg') }}
                  onClick={() => setSelectedSubjectId(note.subjectId)}
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
              className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
              className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
              className="absolute inset-0 flex flex-col items-center justify-center text-[#fce00b] overflow-hidden pointer-events-none"
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
