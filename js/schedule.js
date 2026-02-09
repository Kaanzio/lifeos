/**
 * Life OS - Schedule Module
 * Haftalık ders programı yönetimi
 */

const Schedule = {
    schedule: [],
    days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'],

    // Saat seçenekleri (00 ve 30'lu)
    hours: [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
    ],

    init() {
        this.loadSchedule();
        this.render();
    },

    loadSchedule() {
        this.schedule = Storage.load('lifeos_schedule', []);
    },

    saveSchedule() {
        Storage.save('lifeos_schedule', this.schedule);
    },

    /**
     * Ders ekle
     */
    add(data) {
        const entry = {
            id: Storage.generateId(),
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime,
            lessonId: data.lessonId,
            lessonName: data.lessonName
        };
        this.schedule.push(entry);
        this.saveSchedule();
        this.render();
        Notifications.add('Ders Eklendi', `${entry.lessonName} programınıza eklendi.`, 'success');
    },

    /**
     * Ders sil
     */
    remove(id) {
        this.schedule = this.schedule.filter(s => s.id !== id);
        this.saveSchedule();
        this.render();
    },

    /**
     * Ders ekleme modalı
     */
    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        const lessons = Lessons?.lessons || [];

        modalTitle.textContent = 'Ders Programına Ekle';
        modalBody.innerHTML = `
            <form id="scheduleForm">
                <div class="form-group">
                    <label class="form-label">Gün *</label>
                    <select class="form-select" name="day" required>
                        ${this.days.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Başlangıç *</label>
                        <select class="form-select" name="startTime" required>
                            ${this.hours.map(h => `<option value="${h}">${h}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bitiş *</label>
                        <select class="form-select" name="endTime" required>
                            ${this.hours.map(h => `<option value="${h}">${h}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Ders *</label>
                    <select class="form-select" name="lessonId" id="scheduleLessonSelect" required>
                        <option value="">-- Ders Seçin --</option>
                        ${lessons.map(l => `
                            <option value="${l.id}" data-name="${l.name}">${l.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const select = document.getElementById('scheduleLessonSelect');
            const lessonName = select.options[select.selectedIndex]?.dataset.name || '';

            this.add({
                day: formData.get('day'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                lessonId: formData.get('lessonId'),
                lessonName: lessonName
            });
            App.closeModal();
        });
    },

    /**
     * Render
     */
    render() {
        const container = document.getElementById('scheduleGrid');
        if (!container) return;

        // Günlere göre grupla
        const grouped = {};
        this.days.forEach(d => grouped[d] = []);
        this.schedule.forEach(entry => {
            if (grouped[entry.day]) {
                grouped[entry.day].push(entry);
            }
        });

        // Her gün için saate göre sırala
        this.days.forEach(d => {
            grouped[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        let html = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 16px;">
                <button class="btn btn-primary" onclick="Schedule.showAddModal()">➕ Ders Ekle</button>
            </div>
            <div class="schedule-week">
        `;

        this.days.forEach(day => {
            const entries = grouped[day];
            html += `
                <div class="schedule-day-column">
                    <div class="schedule-day-header">${day}</div>
                    <div class="schedule-day-content">
                        ${entries.length === 0 ?
                    '<div class="schedule-empty">-</div>' :
                    entries.map(e => `
                                <div class="schedule-entry">
                                    <div class="schedule-entry-time">${e.startTime} - ${e.endTime}</div>
                                    <div class="schedule-entry-name">${e.lessonName}</div>
                                    <button class="schedule-entry-delete" onclick="Schedule.remove('${e.id}')" title="Sil">×</button>
                                </div>
                            `).join('')
                }
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }
};
