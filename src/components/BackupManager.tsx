import React, { useEffect } from 'react';

const BackupManager = ({ allNotes, onImport }: { allNotes: any[]; onImport: (data: any[]) => void }) => {
  // Función para exportar TODO a un archivo físico .json
  const exportBackup = () => {
    try {
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        device: "Redmi Pad SE",
        data: allNotes
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `MedNotes_Backup_${new Date().getMilliseconds()}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Limpieza de memoria (importante en tablets)
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  useEffect(() => {
    const handleExportRequest = () => {
      exportBackup();
    };
    window.addEventListener('request-export-backup', handleExportRequest);
    return () => window.removeEventListener('request-export-backup', handleExportRequest);
  }, [allNotes]);


  // Función para importar y sobreescribir la base de datos local
  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData && importedData.data) {
          console.log("Datos recuperados:", importedData.data);
          // Llamar a la función de guardado masivo para restaurar las notas
          onImport(importedData.data);
          alert("¡Respaldo cargado con éxito!");
        } else {
            alert("El archivo de respaldo no tiene el formato correcto.");
        }
      } catch (err) {
        alert("El archivo de respaldo está dañado.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-[#232323] rounded-2xl border border-white/10 mt-6 mx-8">
      <h3 className="text-white font-bold text-lg">Gestión de Datos</h3>
      
      <div className="flex gap-4">
        <button 
          onClick={exportBackup}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl active:scale-95 transition-all text-sm font-semibold"
        >
          📤 Crear Respaldo
        </button>

        <label className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-xl text-center cursor-pointer active:scale-95 transition-all text-sm font-semibold">
          📥 Cargar Respaldo
          <input 
            type="file" 
            accept=".json" 
            onChange={importBackup} 
            className="hidden" 
          />
        </label>
      </div>
    </div>
  );
};

export default BackupManager;
