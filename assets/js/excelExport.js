/* ==========================================================================
   excelExport.js
   Genera y descarga un archivo Excel (.xlsx) con la base de estudiantes,
   usando la librería SheetJS cargada vía CDN en index.html.
   ========================================================================== */

const ExcelExport = {
  download(students) {
    if (typeof XLSX === 'undefined') {
      alert('No se pudo cargar la librería de Excel. Verifica tu conexión a internet e intenta de nuevo.');
      return;
    }

    const rows = students.map(s => ({
      'Nombre': s.name,
      'Identificación': s.studentId,
      'Modalidad': s.modality,
      'Estado documentación': s.status === 'completa' ? 'Completa' : 'Incompleta',
      'Documentos faltantes': (s.missingDocuments || []).join(', '),
      'Notas': s.notes || '',
      'Fecha de registro': new Date(s.registeredAt).toLocaleDateString('es-CO'),
      'Última actualización': new Date(s.updatedAt).toLocaleDateString('es-CO')
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 26 }, // Nombre
      { wch: 16 }, // Identificación
      { wch: 24 }, // Modalidad
      { wch: 20 }, // Estado
      { wch: 40 }, // Documentos faltantes
      { wch: 24 }, // Notas
      { wch: 16 }, // Fecha registro
      { wch: 18 }  // Última actualización
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `documentacion_practicas_${today}.xlsx`);
  }
};
