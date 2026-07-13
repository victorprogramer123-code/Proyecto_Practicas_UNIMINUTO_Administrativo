/* ==========================================================================
   app.js
   Controlador principal de la SPA: navegación entre vistas, renderizado del
   dashboard, formulario de registro/edición y modales de correo/eliminación.
   ========================================================================== */

(function () {
  const PAGE_SIZE = 15;

  let state = {
    view: 'dashboard',
    editingId: null,
    selectedStatus: null,
    page: 1,
    search: '',
    filterStatus: 'todas',
    filterModality: 'todas',
    deleteTargetId: null,
    emailTargetId: null
  };

  // ---------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showToast(message, type = '') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => { toast.className = 'toast ' + type; }, 2600);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Navegación entre vistas
  // ---------------------------------------------------------------------
  function goToView(view) {
    state.view = view;
    $$('.view').forEach(v => v.classList.remove('active'));
    $('#view-' + view).classList.add('active');
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'dashboard') renderDashboard();
    if (view === 'correos') populateCorreoSelect();
  }

  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => goToView(btn.dataset.view));
  });
  $('#btn-go-registro').addEventListener('click', () => {
    resetForm();
    goToView('registro');
  });
  $('#btn-cancel-form').addEventListener('click', () => {
    resetForm();
    goToView('dashboard');
  });

  // ---------------------------------------------------------------------
  // Poblar selects de modalidad (formulario + filtro)
  // ---------------------------------------------------------------------
  function populateModalitySelects() {
    const formSelect = $('#field-modality');
    formSelect.innerHTML = MODALIDADES.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

    const filterSelect = $('#filter-modality');
    filterSelect.innerHTML = '<option value="todas">Todas las modalidades</option>' +
      MODALIDADES.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
  }

  // ---------------------------------------------------------------------
  // Checklist de documentos en el formulario
  // ---------------------------------------------------------------------
  function renderChecklist(selectedDocs) {
    const wrap = $('#doc-checklist');
    wrap.innerHTML = DOCUMENTOS_BASE.map((doc, i) => {
      const checked = selectedDocs && selectedDocs.includes(doc) ? 'checked' : '';
      return `<label class="doc-check-item">
        <input type="checkbox" value="${escapeHtml(doc)}" ${checked}> ${escapeHtml(doc)}
      </label>`;
    }).join('');
  }

  function getCheckedDocs() {
    return $$('#doc-checklist input[type=checkbox]:checked').map(el => el.value);
  }

  // ---------------------------------------------------------------------
  // Toggle de estado (completa / incompleta)
  // ---------------------------------------------------------------------
  $$('.status-option').forEach(opt => {
    opt.addEventListener('click', () => selectStatus(opt.dataset.status));
  });

  function selectStatus(status) {
    state.selectedStatus = status;
    $$('.status-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.status === status);
      o.classList.toggle(o.dataset.status, o.dataset.status === status);
    });
    $('#row-checklist').style.display = status === 'incompleta' ? 'block' : 'none';
  }

  // ---------------------------------------------------------------------
  // Formulario: reset / cargar para edición / guardar
  // ---------------------------------------------------------------------
  function resetForm() {
    state.editingId = null;
    $('#registro-title').textContent = 'Registrar estudiante';
    $('#btn-save-student').textContent = 'Guardar estudiante';
    $('#form-registro').reset();
    $('#field-id').value = '';
    renderChecklist([]);
    selectStatus(null);
    $$('.status-option').forEach(o => o.classList.remove('selected', 'completa', 'incompleta'));
    $('#row-checklist').style.display = 'none';
  }

  function loadStudentIntoForm(student) {
    state.editingId = student.id;
    $('#registro-title').textContent = 'Editar estudiante';
    $('#btn-save-student').textContent = 'Actualizar estudiante';
    $('#field-id').value = student.id;
    $('#field-name').value = student.name;
    $('#field-studentId').value = student.studentId;
    $('#field-modality').value = student.modality;
    $('#field-notes').value = student.notes || '';
    renderChecklist(student.missingDocuments);
    selectStatus(student.status);
  }

  $('#form-registro').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!state.selectedStatus) {
      showToast('Selecciona el estado de la documentación', 'error');
      return;
    }

    const payload = {
      name: $('#field-name').value,
      studentId: $('#field-studentId').value,
      modality: $('#field-modality').value,
      status: state.selectedStatus,
      missingDocuments: state.selectedStatus === 'incompleta' ? getCheckedDocs() : [],
      notes: $('#field-notes').value
    };

    if (!payload.name.trim() || !payload.studentId.trim()) {
      showToast('Nombre e identificación son obligatorios', 'error');
      return;
    }

    if (state.editingId) {
      Storage.update(state.editingId, payload);
      showToast('Estudiante actualizado correctamente', 'success');
    } else {
      Storage.add(payload);
      showToast('Estudiante registrado correctamente', 'success');
    }

    resetForm();
    goToView('dashboard');
  });

  // ---------------------------------------------------------------------
  // Dashboard: filtros, búsqueda, tabla, paginación
  // ---------------------------------------------------------------------
  $('#input-search').addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    state.page = 1;
    renderDashboard();
  });
  $('#filter-status').addEventListener('change', (e) => {
    state.filterStatus = e.target.value;
    state.page = 1;
    renderDashboard();
  });
  $('#filter-modality').addEventListener('change', (e) => {
    state.filterModality = e.target.value;
    state.page = 1;
    renderDashboard();
  });
  $('#btn-prev-page').addEventListener('click', () => {
    if (state.page > 1) { state.page--; renderDashboard(); }
  });
  $('#btn-next-page').addEventListener('click', () => {
    state.page++;
    renderDashboard();
  });
  $('#btn-export-excel').addEventListener('click', () => {
    const all = Storage.getAll();
    if (!all.length) {
      showToast('No hay estudiantes para exportar todavía', 'error');
      return;
    }
    ExcelExport.download(all);
    showToast('Excel descargado', 'success');
  });

  function getFilteredStudents() {
    let list = Storage.getAll();

    if (state.search) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(state.search) ||
        s.studentId.toLowerCase().includes(state.search)
      );
    }
    if (state.filterStatus !== 'todas') {
      list = list.filter(s => s.status === state.filterStatus);
    }
    if (state.filterModality !== 'todas') {
      list = list.filter(s => s.modality === state.filterModality);
    }
    return list;
  }

  function renderStats() {
    const stats = Storage.getStats();
    $('#stat-total').textContent = stats.total;
    $('#stat-completos').textContent = stats.completos;
    $('#stat-incompletos').textContent = stats.incompletos;
    const avance = stats.total ? Math.round((stats.completos / stats.total) * 100) : 0;
    $('#stat-avance').textContent = avance + '%';
  }

  function renderTableRow(student) {
    const missingHtml = student.status === 'incompleta'
      ? renderMissingChips(student.missingDocuments)
      : '<span style="color: var(--gray-600); font-size:12.5px;">—</span>';

    return `
      <tr data-id="${student.id}">
        <td class="cell-name">${escapeHtml(student.name)}</td>
        <td class="cell-id">${escapeHtml(student.studentId)}</td>
        <td>${escapeHtml(student.modality)}</td>
        <td><span class="badge ${student.status}">${student.status === 'completa' ? 'Completa' : 'Incompleta'}</span></td>
        <td>${missingHtml}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm act-email" title="Generar correo">Correo</button>
          <button class="btn btn-ghost btn-sm act-edit" title="Editar">Editar</button>
          <button class="btn btn-danger-ghost btn-sm act-delete" title="Eliminar">Eliminar</button>
        </td>
      </tr>`;
  }

  function renderMissingChips(docs) {
    if (!docs || !docs.length) return '<span style="color: var(--gray-600); font-size:12.5px;">Sin especificar</span>';
    const shown = docs.slice(0, 2);
    const rest = docs.length - shown.length;
    let html = shown.map(d => `<span class="missing-chip">${escapeHtml(d)}</span>`).join('');
    if (rest > 0) html += `<span class="missing-more">+${rest} más</span>`;
    return html;
  }

  function renderDashboard() {
    renderStats();
    const filtered = getFilteredStudents();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const tbody = $('#table-body');
    const emptyState = $('#empty-state');

    if (!filtered.length) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      tbody.innerHTML = pageItems.map(renderTableRow).join('');
    }

    $('#pagination-info').textContent = filtered.length
      ? `Mostrando ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} de ${filtered.length}`
      : 'Sin resultados';
    $('#btn-prev-page').disabled = state.page <= 1;
    $('#btn-next-page').disabled = state.page >= totalPages;

    attachRowEvents();
  }

  function attachRowEvents() {
    $$('.act-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        const student = Storage.getById(id);
        if (student) {
          loadStudentIntoForm(student);
          goToView('registro');
        }
      });
    });
    $$('.act-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.deleteTargetId = e.target.closest('tr').dataset.id;
        openModal('#modal-delete');
      });
    });
    $$('.act-email').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('tr').dataset.id;
        goToView('correos');
        $('#correo-select-student').value = id;
        renderCorreoPanel(id);
      });
    });
  }

  // ---------------------------------------------------------------------
  // Modales genéricos
  // ---------------------------------------------------------------------
  function openModal(sel) { $(sel).classList.add('open'); }
  function closeModal(sel) { $(sel).classList.remove('open'); }

  $('#close-delete-modal').addEventListener('click', () => closeModal('#modal-delete'));
  $('#btn-cancel-delete').addEventListener('click', () => closeModal('#modal-delete'));
  $('#btn-confirm-delete').addEventListener('click', () => {
    if (state.deleteTargetId) {
      Storage.remove(state.deleteTargetId);
      showToast('Estudiante eliminado', 'success');
      state.deleteTargetId = null;
    }
    closeModal('#modal-delete');
    renderDashboard();
    populateCorreoSelect();
  });

  // Cerrar modales al hacer click fuera del cuadro
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // ---------------------------------------------------------------------
  // Sección: Generador de correos
  // ---------------------------------------------------------------------
  function populateCorreoSelect() {
    const students = Storage.getAll();
    const select = $('#correo-select-student');
    const currentValue = select.value;

    if (!students.length) {
      $('#correo-empty').style.display = 'block';
      $('#correo-panel').style.display = 'none';
      select.innerHTML = '<option value="">Selecciona un estudiante registrado</option>';
      select.disabled = true;
      return;
    }

    select.disabled = false;
    $('#correo-empty').style.display = 'none';
    select.innerHTML = '<option value="">Selecciona un estudiante registrado</option>' +
      students.map(s => `<option value="${s.id}">${escapeHtml(s.name)} — ${escapeHtml(s.studentId)}</option>`).join('');

    if (currentValue && students.some(s => s.id === currentValue)) {
      select.value = currentValue;
    }
  }

  function renderCorreoPanel(id) {
    if (!id) {
      $('#correo-panel').style.display = 'none';
      return;
    }
    const student = Storage.getById(id);
    if (!student) {
      $('#correo-panel').style.display = 'none';
      return;
    }

    const { subject, body } = EmailGenerator.build(student);
    $('#correo-panel').style.display = 'block';
    $('#correo-status-badge').innerHTML =
      `<span class="badge ${student.status}">${student.status === 'completa' ? 'Completa' : 'Incompleta'}</span>`;
    $('#correo-subject').value = subject;
    $('#correo-preview').textContent = body;
    $('#correo-to').value = '';
  }

  $('#correo-select-student').addEventListener('change', (e) => {
    renderCorreoPanel(e.target.value);
  });

  $('#btn-copy-correo').addEventListener('click', async () => {
    const text = $('#correo-preview').textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Mensaje copiado al portapapeles', 'success');
    } catch (e) {
      showToast('No se pudo copiar automáticamente. Selecciona y copia manualmente.', 'error');
    }
  });

  $('#btn-open-correo-mailto').addEventListener('click', () => {
    const id = $('#correo-select-student').value;
    const student = Storage.getById(id);
    if (!student) return;
    const to = $('#correo-to').value.trim();
    EmailGenerator.openMailto(student, to);
  });

  // ---------------------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------------------
  populateModalitySelects();
  resetForm();
  renderDashboard();
  populateCorreoSelect();
})();
