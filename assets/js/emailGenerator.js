/* ==========================================================================
   emailGenerator.js
   Construye el texto del correo según el estado de documentación del
   estudiante, siguiendo el formato solicitado por la Oficina de Personal
   de Apoyo de UNIMINUTO.
   ========================================================================== */

const EmailGenerator = {
  /**
   * Genera el cuerpo del correo para un estudiante.
   * @param {Object} student - Registro del estudiante (ver storage.js)
   * @returns {{subject: string, body: string}}
   */
  build(student) {
    if (student.status === 'completa') {
      return this._completa(student);
    }
    return this._incompleta(student);
  },

  _completa(student) {
    const subject = `Documentación de prácticas profesionales — ${student.name}`;
    const body =
`Buenas tardes, ${student.name}.

Tras revisar detalladamente los documentos enviados, le confirmo que todo se encuentra en orden y conforme a lo requerido para su modalidad de ${student.modality.toLowerCase()}.

No se requiere ninguna acción adicional de su parte por el momento.

Cordialmente,
Oficina de Personal de Apoyo
UNIMINUTO`;
    return { subject, body };
  },

  _incompleta(student) {
    const subject = `Documentación pendiente para prácticas profesionales — ${student.name}`;
    const docs = (student.missingDocuments && student.missingDocuments.length)
      ? student.missingDocuments.map(d => `- ${d}`).join('\n')
      : '- (Sin documentos especificados; por favor edite el registro del estudiante para detallarlos)';

    const body =
`Buenas tardes, ${student.name}

Revisando tus documentos, te hacen falta varios de ellos para tu modalidad de ${student.modality.toLowerCase()}, los cuales son:

${docs}

Solo te harían falta esos documentos para estar OK con tu documentación. Gracias, quedamos atentos.

Cordialmente,
Oficina de Personal de Apoyo
UNIMINUTO`;
    return { subject, body };
  },

  /** Abre el cliente de correo predeterminado con el asunto y cuerpo prellenados. */
  openMailto(student, toEmail) {
    const { subject, body } = this.build(student);
    const mailto = `mailto:${encodeURIComponent(toEmail || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }
};
