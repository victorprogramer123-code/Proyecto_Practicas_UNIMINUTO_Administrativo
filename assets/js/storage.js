/* ==========================================================================
   storage.js
   Persistencia local (localStorage) — no requiere backend, compatible con
   GitHub Pages. Todos los datos viven en el navegador del practicante.
   ========================================================================== */

const STORAGE_KEY = 'uniminuto_practicas_estudiantes_v1';

// Lista de documentos que normalmente se solicitan según la modalidad.
// El practicante puede además escribir documentos adicionales personalizados.
const DOCUMENTOS_BASE = [
  'Fotocopia de Cédula',
  'Certificado de EPS',
  'Certificado de ARL',
  'Certificado laboral con funciones',
  'Hoja de vida actualizada',
  'Carta de aceptación de la empresa',
  'Póliza de accidentes',
  'Formato único de solicitud de práctica'
];

const MODALIDADES = [
  'Contrato de aprendizaje',
  'Vínculo laboral',
  'Práctica en escenario real',
  'Proyecto de grado / investigación',
  'Otra'
];

const Storage = {
  /** Devuelve el arreglo completo de estudiantes registrados. */
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error leyendo localStorage:', e);
      return [];
    }
  },

  /** Sobrescribe el arreglo completo. */
  saveAll(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  },

  /** Agrega un nuevo estudiante y devuelve el registro creado. */
  add(student) {
    const students = this.getAll();
    const record = {
      id: 'std_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: student.name.trim(),
      studentId: student.studentId.trim(),
      modality: student.modality,
      status: student.status, // 'completa' | 'incompleta'
      missingDocuments: student.missingDocuments || [],
      notes: student.notes || '',
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    students.unshift(record);
    this.saveAll(students);
    return record;
  },

  /** Actualiza un estudiante existente por id. */
  update(id, changes) {
    const students = this.getAll();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) return null;
    students[idx] = {
      ...students[idx],
      ...changes,
      updatedAt: new Date().toISOString()
    };
    this.saveAll(students);
    return students[idx];
  },

  /** Elimina un estudiante por id. */
  remove(id) {
    const students = this.getAll().filter(s => s.id !== id);
    this.saveAll(students);
  },

  getById(id) {
    return this.getAll().find(s => s.id === id) || null;
  },

  /** Estadísticas rápidas para las tarjetas del dashboard. */
  getStats() {
    const all = this.getAll();
    const completos = all.filter(s => s.status === 'completa').length;
    const incompletos = all.filter(s => s.status === 'incompleta').length;
    return { total: all.length, completos, incompletos };
  }
};
