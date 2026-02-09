/**
 * Life OS - Planning Module
 * Görev ve planlama yönetimi - Enhanced with Multiple Views
 */

const Planning = {
    tasks: [],
    currentWeekOffset: 0,
    currentMonthOffset: 0,
    currentView: 'weekly', // 'weekly', 'monthly', 'all'
    statusFilter: 'all',
    priorityFilter: 'all',

    /**
     * Modülü başlat
     */
    init() {
        this.loadTasks();
        this.bindEvents();
        this.render();
        this.updateCalendarTitle();
        this.updateStats();
    },

    /**
     * Event listener'ları bağla
     */
    bindEvents() {
        // Yeni görev ekle butonu
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        // Takvim navigasyonu - Haftalık
        document.getElementById('prevWeek').addEventListener('click', () => {
            this.currentWeekOffset--;
            this.updateCalendarTitle();
            this.render();
        });

        document.getElementById('nextWeek').addEventListener('click', () => {
            this.currentWeekOffset++;
            this.updateCalendarTitle();
            this.render();
        });

        // Takvim navigasyonu - Aylık
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentMonthOffset--;
            this.updateMonthTitle();
            this.renderMonthView();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentMonthOffset++;
            this.updateMonthTitle();
            this.renderMonthView();
        });

        // Görünüm seçici
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Filtreler
        document.getElementById('taskStatusFilter')?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.renderAllTasksView();
        });

        document.getElementById('taskPriorityFilter')?.addEventListener('change', (e) => {
            this.priorityFilter = e.target.value;
            this.renderAllTasksView();
        });
    },

    /**
     * Görünüm değiştir
     */
    switchView(view) {
        this.currentView = view;

        // Aktif buton güncelle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Görünümleri göster/gizle
        document.getElementById('weeklyView').style.display = view === 'weekly' ? 'block' : 'none';
        document.getElementById('monthlyView').style.display = view === 'monthly' ? 'block' : 'none';
        document.getElementById('allTasksView').style.display = view === 'all' ? 'block' : 'none';

        // İlgili görünümü render et
        if (view === 'weekly') {
            this.render();
        } else if (view === 'monthly') {
            this.updateMonthTitle();
            this.renderMonthView();
        } else if (view === 'all') {
            this.renderAllTasksView();
        }
    },

    /**
     * Görevleri yükle
     */
    loadTasks() {
        this.tasks = Storage.load(Storage.KEYS.TASKS, []);
    },

    /**
     * Görevleri kaydet
     */
    saveTasks() {
        Storage.save(Storage.KEYS.TASKS, this.tasks);
    },

    /**
     * Yeni görev ekle
     */
    add(taskData) {
        const task = {
            id: Storage.generateId(),
            title: taskData.title,
            description: taskData.description || '',
            priority: taskData.priority || 'medium', // high, medium, low
            status: 'todo', // todo, inProgress, done
            dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
            dueTime: taskData.dueTime || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderCurrentView();
        this.updateStats();

        Notifications.add(
            'Yeni Görev Eklendi',
            `"${task.title}" görev listenize eklendi.`,
            'success'
        );

        return task;
    },

    /**
     * Görev güncelle
     */
    update(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const oldStatus = task.status;
            Object.assign(task, updates, { updatedAt: new Date().toISOString() });

            // Tamamlandığında bildirim
            if (updates.status === 'done' && oldStatus !== 'done') {
                Notifications.add(
                    'Görev Tamamlandı! ✅',
                    `"${task.title}" tamamlandı.`,
                    'success'
                );

                // Streak güncelle
                this.updateStreak();
            }

            this.saveTasks();
            this.renderCurrentView();
            this.updateStats();
        }
    },

    /**
     * Mevcut görünümü render et
     */
    renderCurrentView() {
        if (this.currentView === 'weekly') {
            this.render();
        } else if (this.currentView === 'monthly') {
            this.renderMonthView();
        } else if (this.currentView === 'all') {
            this.renderAllTasksView();
        }
    },

    /**
     * Görev durumunu değiştir
     */
    changeStatus(id, newStatus) {
        this.update(id, { status: newStatus });
    },

    /**
     * Görev sil
     */
    remove(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderCurrentView();
            this.updateStats();
        }
    },

    /**
     * İstatistikleri güncelle
     */
    updateStats() {
        const total = this.tasks.length;
        const todo = this.tasks.filter(t => t.status === 'todo').length;
        const inProgress = this.tasks.filter(t => t.status === 'inProgress').length;
        const done = this.tasks.filter(t => t.status === 'done').length;

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('planningStatTotal', total);
        setEl('planningStatTodo', todo);
        setEl('planningStatInProgress', inProgress);
        setEl('planningStatDone', done);
    },

    /**
     * Streak güncelle
     */
    updateStreak() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (settings.lastCompletionDate === today) {
            // Bugün zaten görev tamamlanmış
            return;
        } else if (settings.lastCompletionDate === yesterday) {
            // Streak devam ediyor
            settings.streak = (settings.streak || 0) + 1;
        } else {
            // Streak sıfırlandı
            settings.streak = 1;
        }

        settings.lastCompletionDate = today;
        Storage.save(Storage.KEYS.SETTINGS, settings);
    },

    /**
     * Bu haftanın tarih aralığını al
     */
    getWeekRange() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (this.currentWeekOffset * 7));

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return { start: monday, end: sunday };
    },

    /**
     * Takvim başlığını güncelle (Haftalık)
     */
    updateCalendarTitle() {
        const { start, end } = this.getWeekRange();
        const options = { day: 'numeric', month: 'short' };

        let title;
        if (this.currentWeekOffset === 0) {
            title = 'Bu Hafta';
        } else if (this.currentWeekOffset === -1) {
            title = 'Geçen Hafta';
        } else if (this.currentWeekOffset === 1) {
            title = 'Gelecek Hafta';
        } else {
            title = `${start.toLocaleDateString('tr-TR', options)} - ${end.toLocaleDateString('tr-TR', options)}`;
        }

        document.getElementById('calendarTitle').textContent = title;
    },

    /**
     * Ay başlığını güncelle
     */
    updateMonthTitle() {
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() + this.currentMonthOffset, 1);
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        document.getElementById('monthTitle').textContent =
            `${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    },

    /**
     * Bu haftanın görevlerini filtrele
     */
    getWeekTasks() {
        const { start, end } = this.getWeekRange();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate >= start && taskDate <= end;
        });
    },

    /**
     * İstatistikleri getir
     */
    getStats() {
        const weekTasks = this.getWeekTasks();
        return {
            total: this.tasks.length,
            todo: weekTasks.filter(t => t.status === 'todo').length,
            inProgress: weekTasks.filter(t => t.status === 'inProgress').length,
            done: weekTasks.filter(t => t.status === 'done').length
        };
    },

    /**
     * Bugünün görevlerini getir
     */
    getTodayTasks() {
        const today = new Date().toDateString();
        return this.tasks.filter(t => {
            const taskDate = new Date(t.dueDate).toDateString();
            return taskDate === today;
        });
    },

    /**
     * Haftalık Render (Kanban)
     */
    render() {
        const weekTasks = this.getWeekTasks();
        const stats = this.getStats();

        // Counts güncelle
        document.getElementById('todoCount').textContent = stats.todo;
        document.getElementById('inProgressCount').textContent = stats.inProgress;
        document.getElementById('doneCount').textContent = stats.done;

        // Kolonları render et
        this.renderColumn('todoList', weekTasks.filter(t => t.status === 'todo'));
        this.renderColumn('inProgressList', weekTasks.filter(t => t.status === 'inProgress'));
        this.renderColumn('doneList', weekTasks.filter(t => t.status === 'done'));
    },

    /**
     * Kolon render et
     */
    renderColumn(containerId, tasks) {
        const container = document.getElementById(containerId);

        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">Görev yok</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="kanban-card" data-id="${task.id}">
                <div class="kanban-card-header">
                    <span class="kanban-card-title">${task.title}</span>
                    <span class="kanban-card-priority ${task.priority}" title="${this.getPriorityLabel(task.priority)}"></span>
                </div>
                ${task.description ? `<p style="font-size: 13px; color: var(--text-muted); margin: 8px 0;">${task.description}</p>` : ''}
                <div class="kanban-card-date">📅 ${this.formatDate(task.dueDate)}${task.dueTime ? ` ⏰ ${task.dueTime}` : ''}</div>
                <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                    ${task.status === 'todo' ? `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="Planning.changeStatus('${task.id}', 'inProgress')">▶ Başla</button>` : ''}
                    ${task.status === 'inProgress' ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="Planning.changeStatus('${task.id}', 'done')">✓ Tamamla</button>` : ''}
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="Planning.showEditModal('${task.id}')">✏️</button>
                    <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="if(confirm('Silmek istediğinizden emin misiniz?')) Planning.remove('${task.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Aylık Takvim Render
     */
    renderMonthView() {
        const container = document.getElementById('monthlyCalendar');
        if (!container) return;

        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() + this.currentMonthOffset, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Pazartesi başlangıçlı hafta için ayarlama
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Gün başlıkları
        const dayHeaders = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        let html = dayHeaders.map(d => `<div class="calendar-header">${d}</div>`).join('');

        // Önceki ayın günleri
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${dayNum}</span></div>`;
        }

        // Bu ayın günleri
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.getTime() === today.getTime();

            // Bu güne ait görevler
            const dayTasks = this.tasks.filter(t => t.dueDate === dateStr);

            html += `
                <div class="calendar-day${isToday ? ' today' : ''}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    <div class="calendar-tasks">
                        ${dayTasks.slice(0, 3).map(t => `
                            <div class="calendar-task ${t.status}" title="${t.title}">${t.title}</div>
                        `).join('')}
                        ${dayTasks.length > 3 ? `<div class="calendar-more">+${dayTasks.length - 3} daha</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Sonraki ayın günleri
        const totalCells = startDay + lastDay.getDate();
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${i}</span></div>`;
        }

        container.innerHTML = html;

        // Gün tıklama olayları
        container.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    this.showDayTasks(date);
                }
            });
        });
    },

    /**
     * Belirli bir günün görevlerini göster
     */
    showDayTasks(dateStr) {
        const dayTasks = this.tasks.filter(t => t.dueDate === dateStr);
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = formattedDate;

        if (dayTasks.length === 0) {
            modalBody.innerHTML = `
                <div class="empty-state-large">
                    <div class="empty-icon">📅</div>
                    <h3>Görev Yok</h3>
                    <p>Bu güne ait görev bulunmuyor.</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="App.closeModal(); Planning.showAddModalWithDate('${dateStr}')">+ Görev Ekle</button>
                </div>
            `;
        } else {
            modalBody.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${dayTasks.map(task => `
                        <div class="task-list-item ${task.status}">
                            <div class="task-list-priority ${task.priority}"></div>
                            <div class="task-list-content">
                                <div class="task-list-title">${task.title}</div>
                                <div class="task-list-meta">
                                    ${task.dueTime ? `<span>⏰ ${task.dueTime}</span>` : ''}
                                    <span>${this.getPriorityLabel(task.priority)}</span>
                                </div>
                            </div>
                            <span class="task-list-status ${task.status}">${this.getStatusLabel(task.status)}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary" style="margin-top: 20px; width: 100%;" onclick="App.closeModal(); Planning.showAddModalWithDate('${dateStr}')">+ Yeni Görev Ekle</button>
            `;
        }

        App.openModal();
    },

    /**
     * Belirli bir tarihle görev ekleme modalı
     */
    showAddModalWithDate(dateStr) {
        this.showAddModal(dateStr);
    },

    /**
     * Tüm Görevler Listesi Render
     */
    renderAllTasksView() {
        const container = document.getElementById('allTasksList');
        if (!container) return;

        let filteredTasks = [...this.tasks];

        // Durum filtresi
        if (this.statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.status === this.statusFilter);
        }

        // Öncelik filtresi
        if (this.priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.priority === this.priorityFilter);
        }

        // Tarihe göre sırala
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state-large">
                    <div class="empty-icon">📋</div>
                    <h3>Görev Bulunamadı</h3>
                    <p>Seçili filtrelere uygun görev yok.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => `
            <div class="task-list-item ${task.status}">
                <div class="task-list-priority ${task.priority}"></div>
                <div class="task-list-content">
                    <div class="task-list-title">${task.title}</div>
                    <div class="task-list-meta">
                        <span>📅 ${this.formatDate(task.dueDate)}</span>
                        ${task.dueTime ? `<span>⏰ ${task.dueTime}</span>` : ''}
                        <span>${this.getPriorityLabel(task.priority)}</span>
                    </div>
                </div>
                <span class="task-list-status ${task.status}">${this.getStatusLabel(task.status)}</span>
                <div class="task-list-actions">
                    ${task.status === 'todo' ? `<button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" onclick="Planning.changeStatus('${task.id}', 'inProgress')">▶</button>` : ''}
                    ${task.status === 'inProgress' ? `<button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px;" onclick="Planning.changeStatus('${task.id}', 'done')">✓</button>` : ''}
                    <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" onclick="Planning.showEditModal('${task.id}')">✏️</button>
                    <button class="btn btn-secondary" style="padding: 8px 12px; font-size: 12px;" onclick="if(confirm('Silmek istediğinizden emin misiniz?')) Planning.remove('${task.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Durum etiketi
     */
    getStatusLabel(status) {
        const labels = {
            todo: 'Yapılacak',
            inProgress: 'Devam Eden',
            done: 'Tamamlandı'
        };
        return labels[status] || status;
    },

    /**
     * Öncelik label'ı
     */
    getPriorityLabel(priority) {
        const labels = {
            high: 'Yüksek Öncelik',
            medium: 'Orta Öncelik',
            low: 'Düşük Öncelik'
        };
        return labels[priority] || 'Bilinmiyor';
    },

    /**
     * Tarihi formatla
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Bugün';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Yarın';
        } else {
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        }
    },

    /**
     * Görev ekleme modalını göster
     */
    showAddModal(defaultDate) {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        const today = defaultDate || new Date().toISOString().split('T')[0];

        modalTitle.textContent = 'Yeni Görev Ekle';
        modalBody.innerHTML = `
            <form id="taskForm">
                <div class="form-group">
                    <label class="form-label">Görev Adı *</label>
                    <input type="text" class="form-input" name="title" required placeholder="Ne yapılacak?">
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description" placeholder="Detaylar..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Öncelik</label>
                    <select class="form-select" name="priority">
                        <option value="high">🔴 Yüksek</option>
                        <option value="medium" selected>🟡 Orta</option>
                        <option value="low">🟢 Düşük</option>
                    </select>
                </div>
                <div class="datetime-group">
                    <div class="form-group">
                        <label class="form-label">Bitiş Tarihi</label>
                        <input type="date" class="form-input" name="dueDate" value="${today}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Saat (İsteğe bağlı)</label>
                        <input type="time" class="form-input" name="dueTime">
                    </div>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.add({
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                dueDate: formData.get('dueDate'),
                dueTime: formData.get('dueTime')
            });
            App.closeModal();
        });
    },

    /**
     * Görev düzenleme modalını göster
     */
    showEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = 'Görev Düzenle';
        modalBody.innerHTML = `
            <form id="taskEditForm">
                <div class="form-group">
                    <label class="form-label">Görev Adı *</label>
                    <input type="text" class="form-input" name="title" required value="${task.title}">
                </div>
                <div class="form-group">
                    <label class="form-label">Açıklama</label>
                    <textarea class="form-textarea" name="description">${task.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Öncelik</label>
                    <select class="form-select" name="priority">
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 Yüksek</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Orta</option>
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Düşük</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select class="form-select" name="status">
                        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>📋 Yapılacak</option>
                        <option value="inProgress" ${task.status === 'inProgress' ? 'selected' : ''}>🔄 Devam Eden</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>✅ Tamamlanan</option>
                    </select>
                </div>
                <div class="datetime-group">
                    <div class="form-group">
                        <label class="form-label">Bitiş Tarihi</label>
                        <input type="date" class="form-input" name="dueDate" value="${task.dueDate}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Saat</label>
                        <input type="time" class="form-input" name="dueTime" value="${task.dueTime || ''}">
                    </div>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('taskEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                dueDate: formData.get('dueDate'),
                dueTime: formData.get('dueTime')
            });
            App.closeModal();
        });
    }
};
