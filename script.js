(function() {
  'use strict';

  // ==================== CSV КЛЮЧ В LOCALSTORAGE ====================
  const STORAGE_KEY = 'taskTrackerCSV';

  // Стандартный заголовок CSV
  const CSV_HEADER = 'Продукт;Описание;Что сделать;Что сделано;Комментарий';

  // ==================== DOM ЭЛЕМЕНТЫ ====================
  const currentDateEl = document.getElementById('currentDate');
  const taskTableBody = document.getElementById('taskTableBody');
  const emptyMessage = document.getElementById('emptyMessage');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const taskModal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('modalTitle');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const taskForm = document.getElementById('taskForm');
  const taskIndexInput = document.getElementById('taskIndex');
  const productInput = document.getElementById('product');
  const descriptionInput = document.getElementById('description');
  const todoInput = document.getElementById('todo');
  const doneInput = document.getElementById('done');
  const commentInput = document.getElementById('comment');

  // ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С CSV ====================

  /**
   * Экранирует значение для CSV: если содержит ; или кавычки или переносы строк —
   * оборачивает в кавычки и дублирует внутренние кавычки.
   */
  function escapeCSV(value) {
    const str = String(value ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Парсит одну строку CSV с учётом кавычек.
   */
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // пропускаем удвоенную кавычку
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ';') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  /**
   * Загружает задачи из localStorage. Возвращает массив объектов задачи.
   */
  function loadTasks() {
    const rawCSV = localStorage.getItem(STORAGE_KEY);
    if (!rawCSV) return [];

    const lines = rawCSV.trim().split('\n');
    if (lines.length < 2) return []; // только заголовок или пусто

    const tasks = [];
    // Пропускаем строку заголовка (индекс 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      const cols = parseCSVLine(line);
      if (cols.length >= 5) {
        tasks.push({
          product: cols[0] || '',
          description: cols[1] || '',
          todo: cols[2] || '',
          done: cols[3] || '',
          comment: cols[4] || ''
        });
      }
    }
    return tasks;
  }

  /**
   * Сохраняет массив задач в localStorage в формате CSV.
   */
  function saveTasks(tasks) {
    const lines = [CSV_HEADER];
    for (const task of tasks) {
      const row = [
        escapeCSV(task.product),
        escapeCSV(task.description),
        escapeCSV(task.todo),
        escapeCSV(task.done),
        escapeCSV(task.comment)
      ].join(';');
      lines.push(row);
    }
    localStorage.setItem(STORAGE_KEY, lines.join('\n'));
  }

  /**
   * Формирует полный CSV-контент для скачивания.
   */
  function getFullCSVContent() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.trim() === '') {
      return CSV_HEADER;
    }
    // Убедимся, что заголовок присутствует
    if (!raw.startsWith(CSV_HEADER)) {
      return CSV_HEADER + '\n' + raw;
    }
    return raw;
  }

  // ==================== ОТОБРАЖЕНИЕ ТАБЛИЦЫ ====================
  function renderTable() {
    const tasks = loadTasks();
    taskTableBody.innerHTML = '';

    if (tasks.length === 0) {
      emptyMessage.style.display = 'block';
    } else {
      emptyMessage.style.display = 'none';
      tasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHTML(task.product)}</td>
          <td>${escapeHTML(task.description) || '—'}</td>
          <td>${escapeHTML(task.todo) || '—'}</td>
          <td>${escapeHTML(task.done) || '—'}</td>
          <td>${escapeHTML(task.comment) || '—'}</td>
          <td>
            <button class="btn btn-sm btn-edit" data-index="${index}">✏️</button>
            <button class="btn btn-sm btn-delete" data-index="${index}">🗑</button>
          </td>
        `;
        taskTableBody.appendChild(tr);
      });
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== МОДАЛЬНОЕ ОКНО ====================
  function openModal(task = null, index = -1) {
    if (task) {
      modalTitle.textContent = 'Редактировать задачу';
      taskIndexInput.value = index;
      productInput.value = task.product || '';
      descriptionInput.value = task.description || '';
      todoInput.value = task.todo || '';
      doneInput.value = task.done || '';
      commentInput.value = task.comment || '';
    } else {
      modalTitle.textContent = 'Новая задача';
      taskIndexInput.value = '-1';
      taskForm.reset();
    }
    taskModal.style.display = 'flex';
    productInput.focus();
  }

  function closeModal() {
    taskModal.style.display = 'none';
    taskForm.reset();
    taskIndexInput.value = '-1';
  }

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  // Открытие модалки для новой задачи
  addTaskBtn.addEventListener('click', () => openModal());

  // Закрытие модалки
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Сохранение задачи
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTask = {
      product: productInput.value.trim(),
      description: descriptionInput.value.trim(),
      todo: todoInput.value.trim(),
      done: doneInput.value.trim(),
      comment: commentInput.value.trim()
    };

    if (!newTask.product) {
      alert('Поле «Продукт» обязательно для заполнения.');
      productInput.focus();
      return;
    }

    const tasks = loadTasks();
    const editIndex = parseInt(taskIndexInput.value, 10);

    if (editIndex >= 0 && editIndex < tasks.length) {
      tasks[editIndex] = newTask;
    } else {
      tasks.push(newTask);
    }

    saveTasks(tasks);
    renderTable();
    closeModal();
  });

  // Кнопки в таблице (делегирование событий)
  taskTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const index = parseInt(btn.dataset.index, 10);
    const tasks = loadTasks();

    if (btn.classList.contains('btn-edit')) {
      if (index >= 0 && index < tasks.length) {
        openModal(tasks[index], index);
      }
    }

    if (btn.classList.contains('btn-delete')) {
      if (index >= 0 && index < tasks.length) {
        if (confirm(`Удалить задачу «${tasks[index].product}»?`)) {
          tasks.splice(index, 1);
          saveTasks(tasks);
          renderTable();
        }
      }
    }
  });

  // Скачивание CSV
  downloadCsvBtn.addEventListener('click', () => {
    const csvContent = getFullCSVContent();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM для Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ==================== ОТОБРАЖЕНИЕ ДАТЫ ====================
  function updateDate() {
    const now = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
    currentDateEl.textContent = now.toLocaleDateString('ru-RU', options);
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ ====================
  function init() {
    // Если localStorage пуст, создаём начальную структуру
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, CSV_HEADER);
    }
    updateDate();
    renderTable();
    setInterval(updateDate, 60000); // обновляем дату раз в минуту
  }

  init();
})();