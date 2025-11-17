// FormaText — Ajustes finales: la paleta tiene colores visuales, pero NUNCA se aplican al documento.
// El documento (editor) es pulcro y usa Times New Roman con márgenes/espaciado APA para la vista y la exportación.
// Deshacer/Rehacer incluido y '@' abre eduardonunez.pages.dev.
// developed by @_eduardo.nunez

document.addEventListener('DOMContentLoaded', () => {
  // Short selectors
  const $id = id => document.getElementById(id);
  const editor = $id('editor');
  const components = document.querySelectorAll('.component');
  const templatesSelect = $id('templates');
  const applyTemplateBtn = $id('applyTemplate');
  const exportPdfBtn = $id('exportPdf');
  const resetBtn = $id('reset');
  const undoBtn = $id('undoBtn');
  const redoBtn = $id('redoBtn');
  const docTitleInput = $id('docTitle');

  // History for undo/redo
  const history = { stack: [], index: -1, max: 80 };
  function snapshot() {
    const state = editor.innerHTML;
    if (history.index >= 0 && history.stack[history.index] === state) return;
    history.stack = history.stack.slice(0, history.index + 1);
    history.stack.push(state);
    if (history.stack.length > history.max) history.stack.shift();
    history.index = history.stack.length - 1;
    updateUndoRedoButtons();
  }
  function undo() {
    if (history.index <= 0) return;
    history.index--;
    editor.innerHTML = history.stack[history.index];
    sanitizeAfterRestore();
    updateUndoRedoButtons();
  }
  function redo() {
    if (history.index >= history.stack.length - 1) return;
    history.index++;
    editor.innerHTML = history.stack[history.index];
    sanitizeAfterRestore();
    updateUndoRedoButtons();
  }
  function updateUndoRedoButtons() {
    undoBtn.disabled = history.index <= 0;
    redoBtn.disabled = history.index >= history.stack.length - 1 || history.index === -1;
  }
  function sanitizeAfterRestore() {
    editor.querySelectorAll('.editor-tip').forEach(n=>n.remove());
    editor.querySelectorAll('[contenteditable]').forEach(n => n.setAttribute('contenteditable','true'));
    placeCaretAtEnd(editor);
  }
  function initHistory() { history.stack = []; history.index = -1; snapshot(); }

  // Caret helpers
  function placeCaretAtEnd(el) {
    el = el || editor;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function insertNodeAtCaret(node) {
    let sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(node);
      editor.appendChild(document.createElement('p'));
      placeCaretAtEnd(node);
      snapshot();
      return;
    }
    const range = sel.getRangeAt(0);
    range.collapse(false);
    range.insertNode(node);
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    node.parentNode.insertBefore(p, node.nextSibling);
    placeCaretAtEnd(p);
    snapshot();
  }

  // Create clean component (NO styles/colors that affect document)
  function createComponent(type) {
    let el;
    switch (type) {
      case 'title':
        el = document.createElement('div');
        el.className = 'ft-title';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Título centrado';
        break;
      case 'heading':
        el = document.createElement('div');
        el.className = 'ft-heading';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Encabezado';
        break;
      case 'paragraph':
        el = document.createElement('div');
        el.className = 'ft-paragraph';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Escribe tu párrafo aquí...';
        break;
      case 'quote':
        el = document.createElement('blockquote');
        el.className = 'ft-quote';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Cita — escribe la cita aquí.';
        break;
      case 'abstract':
        el = document.createElement('div');
        el.className = 'ft-abstract';
        el.setAttribute('contenteditable', 'true');
        el.innerHTML = '<strong>Abstract</strong><div contenteditable="true">Resumen breve...</div>';
        break;
      case 'reference':
        el = document.createElement('div');
        el.className = 'ft-reference';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Apellido, A. A. (2020). Título. Editorial.';
        break;
      default:
        el = document.createElement('div');
        el.className = 'ft-paragraph';
        el.setAttribute('contenteditable', 'true');
        el.innerText = 'Contenido';
    }
    // IMPORTANT: do NOT add visual color/borders to document nodes.
    return el;
  }

  // Drag & drop — palette items carry color only for the palette visual.
  components.forEach(item => {
    const color = item.dataset.color;
    if (color) item.style.setProperty('--comp-color', color); // palette visual only
    item.addEventListener('dragstart', (e) => {
      const type = item.dataset.type;
      // Transfer only the type; color stays visual in the palette (not applied to document)
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copy';
      const ghost = item.cloneNode(true);
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 20, 20);
      setTimeout(()=> document.body.removeChild(ghost), 0);
    });
  });

  editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    editor.classList.add('dragover');
    e.dataTransfer.dropEffect = 'copy';
  });
  editor.addEventListener('dragleave', () => editor.classList.remove('dragover'));
  editor.addEventListener('drop', (e) => {
    e.preventDefault();
    editor.classList.remove('dragover');
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    const comp = createComponent(type);

    // Insert at drop caret position if possible
    let range;
    try {
      if (document.caretRangeFromPoint) range = document.caretRangeFromPoint(e.clientX, e.clientY);
      else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    } catch (err) { range = null; }

    if (range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      insertNodeAtCaret(comp);
    } else {
      insertNodeAtCaret(comp);
    }
    snapshot();
  });

  // Templates (create components WITHOUT any color/border)
  function applyTemplate(name) {
    editor.innerHTML = '';
    if (name === 'simple') {
      editor.appendChild(createComponent('title'));
      editor.appendChild(createComponent('paragraph'));
      editor.appendChild(createComponent('heading'));
      editor.appendChild(createComponent('paragraph'));
      const refsHeading = document.createElement('div');
      refsHeading.className = 'ft-heading';
      refsHeading.setAttribute('contenteditable', 'true');
      refsHeading.innerText = 'References';
      editor.appendChild(refsHeading);
      editor.appendChild(createComponent('reference'));
    } else if (name === 'lab') {
      editor.appendChild(createComponent('title'));
      editor.appendChild(createComponent('abstract'));
      const intro = createComponent('heading'); intro.innerText = 'Introducción'; editor.appendChild(intro);
      editor.appendChild(createComponent('paragraph'));
      const method = createComponent('heading'); method.innerText = 'Método'; editor.appendChild(method);
      editor.appendChild(createComponent('paragraph'));
      const results = createComponent('heading'); results.innerText = 'Resultados'; editor.appendChild(results);
      editor.appendChild(createComponent('paragraph'));
      const refsHeading = document.createElement('div'); refsHeading.className = 'ft-heading';
      refsHeading.setAttribute('contenteditable', 'true'); refsHeading.innerText = 'Referencias';
      editor.appendChild(refsHeading);
      editor.appendChild(createComponent('reference'));
    } else if (name === 'short') {
      editor.appendChild(createComponent('title'));
      editor.appendChild(createComponent('paragraph'));
      const refsHeading = document.createElement('div'); refsHeading.className = 'ft-heading';
      refsHeading.setAttribute('contenteditable', 'true'); refsHeading.innerText = 'Referencias';
      editor.appendChild(refsHeading);
      editor.appendChild(createComponent('reference'));
    } else {
      editor.innerHTML = '<div class="editor-tip">Selecciona una plantilla y haz clic en Aplicar.</div>';
    }
    snapshot();
    placeCaretAtEnd(editor);
  }
  applyTemplateBtn.addEventListener('click', () => applyTemplate(templatesSelect.value));

  // Export to PDF — ensure output is clean APA (Times New Roman, 12pt, double-spaced)
  exportPdfBtn.addEventListener('click', async () => {
    const printWrap = document.createElement('div');
    // Apply APA-like page styling
    printWrap.style.background = '#fff';
    printWrap.style.padding = '36px';
    printWrap.style.fontFamily = '"Times New Roman", Times, serif';
    printWrap.style.fontSize = '12pt';
    printWrap.style.lineHeight = '2';
    printWrap.style.color = '#000';

    const titleText = docTitleInput.value.trim();
    if (titleText) {
      const t = document.createElement('div');
      t.style.textAlign = 'center';
      t.style.fontFamily = '"Times New Roman", Times, serif';
      t.style.fontWeight = '700';
      t.style.fontSize = '18pt';
      t.style.marginBottom = '18px';
      t.innerText = titleText;
      printWrap.appendChild(t);
    }

    // Clone editor content and sanitize (remove any UI-only attributes)
    const clone = editor.cloneNode(true);
    // Remove editor tips and any empty UI nodes
    clone.querySelectorAll('.editor-tip').forEach(n => n.remove());
    // Remove contenteditable attributes so html2pdf renders plain text
    clone.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'));

    // Remove any inline styles that might be UI-only (none should exist, but be safe)
    clone.querySelectorAll('*').forEach(node => {
      node.removeAttribute('data-ft'); // harmless
      // preserve text and semantic classes (ft-title, ft-paragraph, etc.)
      // remove style attributes
      node.removeAttribute('style');
    });

    // Append the sanitized clone
    printWrap.appendChild(clone);

    const opt = {
      margin:       [40, 24],
      filename:     (titleText || 'documento') + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    exportPdfBtn.disabled = true;
    const prevText = exportPdfBtn.innerHTML;
    exportPdfBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Preparando';

    try {
      await html2pdf().from(printWrap).set(opt).save();
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Ocurrió un error generando el PDF. Revisa la consola.');
    } finally {
      exportPdfBtn.disabled = false;
      exportPdfBtn.innerHTML = prevText;
    }
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    editor.innerHTML = '<div class="editor-tip">Haz clic aquí y empieza a escribir o arrastra un "Título" desde la paleta.</div>';
    templatesSelect.value = '';
    docTitleInput.value = '';
    initHistory();
  });

  // Undo/redo buttons
  undoBtn.addEventListener('click', () => undo());
  redoBtn.addEventListener('click', () => redo());

  // Keyboard: undo/redo/export
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) { e.preventDefault(); redo(); }
    if (mod && e.key === 'Enter') { e.preventDefault(); exportPdfBtn.click(); }
  });



  // On input snapshot (debounced)
  let dt;
  editor.addEventListener('input', () => {
    if (dt) clearTimeout(dt);
    dt = setTimeout(() => { snapshot(); dt = null; }, 400);
  });

  // Paste as plain text
  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // Init with a small template and history
  function normalizeEditor() {
    if (!editor.firstChild) {
      const p = document.createElement('p'); p.innerHTML = '<br>'; editor.appendChild(p);
    }
  }
  applyTemplate(templatesSelect.value || 'simple'); // default simple
  initHistory();
  normalizeEditor();

  // expose minimal API for debugging
  window.FormaText = { createComponent, applyTemplate, undo, redo, snapshot };
});
