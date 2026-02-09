/**
 * Life OS - Exams Module
 * Sınav takibi ve canlı geri sayım
 */

const Exams = {
    exams: [],
    countdownIntervals: {},

    init() {
        this.loadExams();
        this.bindEvents();
        this.render();
        this.startAllCountdowns();
    },

    loadExams() {
        this.exams = Storage.load('lifeos_exams', []);
    },

    saveExams() {
        Storage.save('lifeos_exams', this.exams);
    },

    bindEvents() {
        document.getElementById('addExamBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    /**
     * Yeni sınav ekle
     */
    add(examData) {
        const exam = {
            id: Storage.generateId(),
            name: examData.name,
            lessonId: examData.lessonId || null,
            lessonName: examData.lessonName || '',
            date: examData.date,
            time: examData.time || '09:00',
            notes: examData.notes || '',
            createdAt: new Date().toISOString()
        };

        this.exams.push(exam);
        this.saveExams();
        this.render();
        this.startCountdown(exam.id);

        Notifications.add(
            'Sınav Eklendi 📝',
            `${exam.name} sınavı eklendi.`,
            'success'
        );

        return exam;
    },

    /**
     * Sınavı sil
     */
    remove(id) {
        // Countdown'ı durdur
        if (this.countdownIntervals[id]) {
            clearInterval(this.countdownIntervals[id]);
            delete this.countdownIntervals[id];
        }

        this.exams = this.exams.filter(e => e.id !== id);
        this.saveExams();
        this.render();
    },

    /**
     * Sınava kalan süreyi hesapla
     */
    getTimeRemaining(examDate, examTime) {
        const examDateTime = new Date(`${examDate}T${examTime}`);
        const now = new Date();
        const diff = examDateTime - now;

        if (diff <= 0) {
            return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { expired: false, days, hours, minutes, seconds };
    },

    /**
     * Tek bir sınav için countdown başlat
     */
    startCountdown(examId) {
        const exam = this.exams.find(e => e.id === examId);
        if (!exam) return;

        // Önceki interval'ı temizle
        if (this.countdownIntervals[examId]) {
            clearInterval(this.countdownIntervals[examId]);
        }

        // Her saniye güncelle
        this.countdownIntervals[examId] = setInterval(() => {
            this.updateCountdownDisplay(examId);
        }, 1000);

        // İlk güncelleme
        this.updateCountdownDisplay(examId);
    },

    /**
     * Tüm sınavlar için countdown başlat
     */
    startAllCountdowns() {
        this.exams.forEach(exam => {
            this.startCountdown(exam.id);
        });
    },

    /**
     * Countdown gösterimini güncelle
     */
    updateCountdownDisplay(examId) {
        const exam = this.exams.find(e => e.id === examId);
        if (!exam) return;

        const countdownEl = document.getElementById(`countdown-${examId}`);
        if (!countdownEl) return;

        const time = this.getTimeRemaining(exam.date, exam.time);

        if (time.expired) {
            countdownEl.innerHTML = `<span class="countdown-expired">Sınav tamamlandı!</span>`;
            clearInterval(this.countdownIntervals[examId]);
            return;
        }

        // Add urgent styling to countdown when ≤7 days remaining
        const isUrgent = time.days <= 7;
        countdownEl.classList.toggle('countdown-urgent', isUrgent);

        countdownEl.innerHTML = `
            <div class="countdown-unit">
                <span class="countdown-value">${time.days}</span>
                <span class="countdown-label">Gün</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-value">${String(time.hours).padStart(2, '0')}</span>
                <span class="countdown-label">Saat</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-value">${String(time.minutes).padStart(2, '0')}</span>
                <span class="countdown-label">Dk</span>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit">
                <span class="countdown-value">${String(time.seconds).padStart(2, '0')}</span>
                <span class="countdown-label">Sn</span>
            </div>
        `;
    },

    /**
     * Ders listesini al
     */
    getLessonOptions() {
        const lessons = Lessons?.lessons || [];
        return lessons.map(l => `<option value="${l.id}" data-name="${l.name}">${l.name}</option>`).join('');
    },

    /**
     * Sınav ekleme modalı
     */
    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        const today = new Date().toISOString().split('T')[0];

        modalTitle.textContent = 'Yeni Sınav Ekle';
        modalBody.innerHTML = `
            <form id="examForm">
                <div class="form-group">
                    <label class="form-label">Sınav Adı *</label>
                    <input type="text" class="form-input" name="name" required placeholder="Örn: Vize, Final, Quiz">
                </div>
                <div class="form-group">
                    <label class="form-label">Ders (İsteğe bağlı)</label>
                    <select class="form-select" name="lessonId" id="examLessonSelect">
                        <option value="">-- Ders Seçin --</option>
                        ${this.getLessonOptions()}
                    </select>
                </div>
                <div class="datetime-group">
                    <div class="form-group">
                        <label class="form-label">Tarih *</label>
                        <input type="date" class="form-input" name="date" required value="${today}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Saat *</label>
                        <input type="time" class="form-input" name="time" required value="09:00">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes" placeholder="Sınav hakkında notlar..."></textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('examForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const lessonSelect = document.getElementById('examLessonSelect');
            const lessonName = lessonSelect.options[lessonSelect.selectedIndex]?.dataset.name || '';

            this.add({
                name: formData.get('name'),
                lessonId: formData.get('lessonId'),
                lessonName: lessonName,
                date: formData.get('date'),
                time: formData.get('time'),
                notes: formData.get('notes')
            });
            App.closeModal();
        });
    },

    /**
     * İstatistikleri hesapla
     */
    getStats() {
        const now = new Date();
        const upcoming = this.exams.filter(e => new Date(`${e.date}T${e.time}`) > now);
        const thisWeek = upcoming.filter(e => {
            const examDate = new Date(e.date);
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return examDate <= weekFromNow;
        });

        return {
            total: this.exams.length,
            upcoming: upcoming.length,
            thisWeek: thisWeek.length
        };
    },

    /**
     * Render
     */
    render() {
        const stats = this.getStats();

        // Stats
        const statTotal = document.getElementById('examStatTotal');
        const statUpcoming = document.getElementById('examStatUpcoming');
        const statThisWeek = document.getElementById('examStatThisWeek');

        if (statTotal) statTotal.textContent = stats.total;
        if (statUpcoming) statUpcoming.textContent = stats.upcoming;
        if (statThisWeek) statThisWeek.textContent = stats.thisWeek;

        // Grid
        const grid = document.getElementById('examsGrid');
        if (!grid) return;

        if (this.exams.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-large">
                    <span class="empty-icon">📝</span>
                    <h3>Henüz sınav eklenmedi</h3>
                    <p>Sınavlarınızı ekleyerek geri sayımı başlatın</p>
                </div>
            `;
            return;
        }

        // Tarihe göre sırala (en yakın önce)
        const sortedExams = [...this.exams].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        grid.innerHTML = sortedExams.map(exam => {
            const time = this.getTimeRemaining(exam.date, exam.time);
            const isUrgent = !time.expired && time.days <= 3;
            const examDateTime = new Date(`${exam.date}T${exam.time}`);

            return `
                <div class="exam-card ${isUrgent ? 'urgent' : ''} ${time.expired ? 'expired' : ''}">
                    <div class="exam-header">
                        <h3 class="exam-name">${exam.name}</h3>
                        <button class="exam-delete" onclick="if(confirm('Bu sınavı silmek istiyor musunuz?')) Exams.remove('${exam.id}')" title="Sil">×</button>
                    </div>
                    ${exam.lessonName ? `<div class="exam-lesson">📚 ${exam.lessonName}</div>` : ''}
                    <div class="exam-datetime">
                        📅 ${examDateTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        ⏰ ${exam.time}
                    </div>
                    <div class="exam-countdown" id="countdown-${exam.id}">
                        <!-- Countdown buraya JS ile yüklenecek -->
                    </div>
                    ${exam.notes ? `<div class="exam-notes">${exam.notes}</div>` : ''}
                </div>
            `;
        }).join('');

        // Countdown'ları başlat
        this.startAllCountdowns();
    }
};
