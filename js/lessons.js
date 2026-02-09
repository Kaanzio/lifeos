/**
 * Life OS - Lessons Module v5.0
 * Dönem dersleri yönetimi - Sınıf/Dönem bazlı, dosya ekleme desteği
 */

const Lessons = {
    lessons: [],
    container: null,
    filterSemester: 'all',
    filterGrade: 'all',

    // Akademik yıl ve dönem
    academicYear: '2024-2025',
    currentSemester: 'Güz',

    // Dönemler
    semesters: [
        { id: 'guz', name: 'Güz Dönemi', icon: '🍂' },
        { id: 'bahar', name: 'Bahar Dönemi', icon: '🌸' },
        { id: 'yaz', name: 'Yaz Okulu', icon: '☀️' }
    ],

    // Sınıflar
    grades: [
        { id: '1', name: '1. Sınıf', icon: '🎓' },
        { id: '2', name: '2. Sınıf', icon: '📖' },
        { id: '3', name: '3. Sınıf', icon: '🔬' },
        { id: '4', name: '4. Sınıf', icon: '🎯' },
        { id: 'yuksek', name: 'Yüksek Lisans', icon: '🎓' },
        { id: 'doktora', name: 'Doktora', icon: '📚' }
    ],

    // Ders türleri
    types: [
        { id: 'zorunlu', name: 'Zorunlu', color: '#ef4444' },
        { id: 'secmeli', name: 'Seçmeli', color: '#8b5cf6' },
        { id: 'bolum', name: 'Bölüm Seçmeli', color: '#06b6d4' },
        { id: 'ust', name: 'Üst Yarıyıl', color: '#f59e0b' }
    ],

    init() {
        this.container = document.getElementById('lessonsGrid');
        this.loadLessons();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addLessonBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadLessons() {
        this.lessons = Storage.load('lifeos_lessons_v5', []);
    },

    saveLessons() {
        Storage.save('lifeos_lessons_v5', this.lessons);
    },

    /**
     * Yeni ders ekle
     */
    add(lessonData) {
        const lesson = {
            id: Storage.generateId(),
            name: lessonData.name,
            code: lessonData.code || '',
            semester: lessonData.semester || 'guz',
            grade: lessonData.grade || '1',
            type: lessonData.type || 'zorunlu',
            credits: parseInt(lessonData.credits) || 3,
            ects: parseInt(lessonData.ects) || 5,
            instructor: lessonData.instructor || '',
            location: lessonData.location || '',
            notes: lessonData.notes || '',
            files: [],
            createdAt: new Date().toISOString()
        };

        this.lessons.push(lesson);
        this.saveLessons();
        this.render();

        Notifications.add('Ders Eklendi', `"${lesson.name}" eklendi.`, 'success');
        return lesson;
    },

    /**
     * Ders güncelle
     */
    update(id, updates) {
        const lesson = this.lessons.find(l => l.id === id);
        if (lesson) {
            Object.assign(lesson, updates);
            this.saveLessons();
            this.render();
        }
    },

    /**
     * Ders sil
     */
    remove(id) {
        const lesson = this.lessons.find(l => l.id === id);
        if (lesson) {
            this.lessons = this.lessons.filter(l => l.id !== id);
            this.saveLessons();
            this.render();
            Notifications.add('Ders Silindi', `"${lesson.name}" silindi.`, 'info');
        }
    },

    /**
     * Dosya ekle (Base64 olarak kaydet)
     */
    addFile(lessonId, file) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = {
                id: Storage.generateId(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result,
                addedAt: new Date().toISOString()
            };

            lesson.files.push(fileData);
            this.saveLessons();
            this.render();
            Notifications.showToast('Dosya Eklendi', file.name, 'success');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Dosya sil
     */
    removeFile(lessonId, fileId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (lesson) {
            lesson.files = lesson.files.filter(f => f.id !== fileId);
            this.saveLessons();
            this.render();
        }
    },

    /**
     * Dosya indir
     */
    downloadFile(lessonId, fileId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const file = lesson.files.find(f => f.id === fileId);
        if (!file) return;

        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
    },

    /**
     * Dosya boyutunu formatla
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /**
     * Dosya için icon al
     */
    getFileIcon(type) {
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
        if (type.includes('image')) return '🖼️';
        if (type.includes('video')) return '🎬';
        if (type.includes('audio')) return '🎵';
        if (type.includes('zip') || type.includes('rar')) return '📦';
        return '📁';
    },

    /**
     * Filtrelenmiş dersleri al
     */
    getFilteredLessons() {
        return this.lessons.filter(l => {
            const semesterMatch = this.filterSemester === 'all' || l.semester === this.filterSemester;
            const gradeMatch = this.filterGrade === 'all' || l.grade === this.filterGrade;
            return semesterMatch && gradeMatch;
        });
    },

    /**
     * Sınıfa göre grupla
     */
    getLessonsByGrade() {
        const grouped = {};
        const filtered = this.getFilteredLessons();

        filtered.forEach(lesson => {
            if (!grouped[lesson.grade]) {
                grouped[lesson.grade] = [];
            }
            grouped[lesson.grade].push(lesson);
        });

        return grouped;
    },

    /**
     * İstatistikler
     */
    getStats() {
        const filtered = this.getFilteredLessons();
        const totalCredits = filtered.reduce((sum, l) => sum + (l.credits || 0), 0);
        const totalEcts = filtered.reduce((sum, l) => sum + (l.ects || 0), 0);

        return {
            total: filtered.length,
            credits: totalCredits,
            ects: totalEcts,
            files: filtered.reduce((sum, l) => sum + (l.files?.length || 0), 0)
        };
    },

    /**
     * Ders ekleme/düzenleme modalı
     */
    showAddModal(editLesson = null) {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        const isEdit = editLesson !== null;

        modalTitle.textContent = isEdit ? 'Ders Düzenle' : 'Yeni Ders Ekle';
        modalBody.innerHTML = `
            <form id="lessonForm">
                <div class="form-row">
                    <div class="form-group" style="flex: 2;">
                        <label class="form-label">Ders Adı *</label>
                        <input type="text" class="form-input" name="name" required 
                               placeholder="Örn: Malzeme Bilimi" value="${isEdit ? editLesson.name : ''}">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label">Ders Kodu</label>
                        <input type="text" class="form-input" name="code" 
                               placeholder="Örn: MMM101" value="${isEdit ? editLesson.code || '' : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Sınıf *</label>
                        <select class="form-select" name="grade" required>
                            ${this.grades.map(g => `
                                <option value="${g.id}" ${isEdit && editLesson.grade === g.id ? 'selected' : ''}>
                                    ${g.icon} ${g.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dönem *</label>
                        <select class="form-select" name="semester" required>
                            ${this.semesters.map(s => `
                                <option value="${s.id}" ${isEdit && editLesson.semester === s.id ? 'selected' : ''}>
                                    ${s.icon} ${s.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Ders Türü</label>
                        <select class="form-select" name="type">
                            ${this.types.map(t => `
                                <option value="${t.id}" ${isEdit && editLesson.type === t.id ? 'selected' : ''}>
                                    ${t.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kredi</label>
                        <input type="number" class="form-input" name="credits" min="1" max="10" 
                               value="${isEdit ? editLesson.credits || 3 : 3}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">AKTS</label>
                        <input type="number" class="form-input" name="ects" min="1" max="30" 
                               value="${isEdit ? editLesson.ects || 5 : 5}">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Öğretim Üyesi</label>
                    <input type="text" class="form-input" name="instructor" 
                           placeholder="Örn: Prof. Dr. Ahmet Yılmaz" value="${isEdit ? editLesson.instructor || '' : ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">Ders Yeri</label>
                    <input type="text" class="form-input" name="location" 
                           placeholder="Örn: A Blok 201" value="${isEdit ? editLesson.location || '' : ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes" 
                              placeholder="Ders hakkında notlar...">${isEdit ? editLesson.notes || '' : ''}</textarea>
                </div>

                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Ekle'}</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('lessonForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const data = {
                name: formData.get('name'),
                code: formData.get('code'),
                grade: formData.get('grade'),
                semester: formData.get('semester'),
                type: formData.get('type'),
                credits: formData.get('credits'),
                ects: formData.get('ects'),
                instructor: formData.get('instructor'),
                location: formData.get('location'),
                notes: formData.get('notes')
            };

            if (isEdit) {
                this.update(editLesson.id, data);
            } else {
                this.add(data);
            }
            App.closeModal();
        });
    },

    /**
     * Dosya ekleme modalı
     */
    showFileModal(lessonId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = `📁 ${lesson.name} - Dosyalar`;
        modalBody.innerHTML = `
            <div class="file-manager">
                <div class="file-upload-area">
                    <input type="file" id="fileInput" multiple hidden 
                           accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar">
                    <div class="file-upload-btn" onclick="document.getElementById('fileInput').click()">
                        <span style="font-size: 24px;">📤</span>
                        <span>Dosya Ekle (PDF, Word, Excel, vb.)</span>
                    </div>
                </div>

                <div class="file-list" id="fileList">
                    ${lesson.files.length === 0 ? `
                        <div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-muted);">
                            Henüz dosya eklenmedi
                        </div>
                    ` : lesson.files.map(file => `
                        <div class="lesson-file">
                            <span class="lesson-file-icon">${this.getFileIcon(file.type)}</span>
                            <span class="lesson-file-name">${file.name}</span>
                            <span style="color: var(--text-muted); font-size: 12px;">${this.formatFileSize(file.size)}</span>
                            <button class="btn btn-secondary" style="padding: 4px 8px;" 
                                    onclick="Lessons.downloadFile('${lessonId}', '${file.id}')">⬇️</button>
                            <button class="lesson-file-delete" 
                                    onclick="if(confirm('Dosyayı silmek istiyor musunuz?')) Lessons.removeFile('${lessonId}', '${file.id}')">🗑️</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Kapat</button>
            </div>
        `;

        App.openModal();

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const files = e.target.files;
            for (let file of files) {
                // Max 10MB
                if (file.size > 10 * 1024 * 1024) {
                    Notifications.showToast('Hata', 'Dosya 10MB\'dan büyük olamaz', 'error');
                    continue;
                }
                this.addFile(lessonId, file);
            }
            // Modal'ı yenile
            setTimeout(() => this.showFileModal(lessonId), 500);
        });
    },

    /**
     * Render
     */
    render() {
        const stats = this.getStats();

        // Stats güncelle
        const statTotal = document.getElementById('lessonStatTotal');
        const statProgress = document.getElementById('lessonStatProgress');
        const statCompleted = document.getElementById('lessonStatCompleted');

        if (statTotal) statTotal.textContent = stats.total;
        if (statProgress) statProgress.textContent = stats.credits + ' Kredi';
        if (statCompleted) statCompleted.textContent = stats.files + ' Dosya';

        if (!this.container) return;

        // Toolbar
        let html = `
            <div class="lessons-toolbar" style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;">
                <select class="form-select" onchange="Lessons.filterSemester = this.value; Lessons.render();" style="width: auto;">
                    <option value="all" ${this.filterSemester === 'all' ? 'selected' : ''}>📅 Tüm Dönemler</option>
                    ${this.semesters.map(s => `
                        <option value="${s.id}" ${this.filterSemester === s.id ? 'selected' : ''}>
                            ${s.icon} ${s.name}
                        </option>
                    `).join('')}
                </select>
                <select class="form-select" onchange="Lessons.filterGrade = this.value; Lessons.render();" style="width: auto;">
                    <option value="all" ${this.filterGrade === 'all' ? 'selected' : ''}>🎓 Tüm Sınıflar</option>
                    ${this.grades.map(g => `
                        <option value="${g.id}" ${this.filterGrade === g.id ? 'selected' : ''}>
                            ${g.icon} ${g.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;

        const lessonsByGrade = this.getLessonsByGrade();

        if (this.lessons.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">📚</span>
                    <h3>Henüz ders eklenmedi</h3>
                    <p>Dönem derslerinizi ekleyerek başlayın</p>
                </div>
            `;
        } else if (Object.keys(lessonsByGrade).length === 0) {
            html += `
                <div class="empty-state" style="text-align: center; padding: 48px;">
                    <p>Bu filtreyle eşleşen ders bulunamadı</p>
                </div>
            `;
        } else {
            // Sınıflara göre grupla
            for (const gradeId of Object.keys(lessonsByGrade).sort()) {
                const gradeLessons = lessonsByGrade[gradeId];
                const gradeInfo = this.grades.find(g => g.id === gradeId) || { name: gradeId, icon: '📖' };

                html += `
                    <div class="lesson-grade-section" style="margin-bottom: 32px;">
                        <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                            <span>${gradeInfo.icon}</span>
                            <span>${gradeInfo.name}</span>
                            <span style="font-size: 14px; color: var(--text-muted);">(${gradeLessons.length} ders)</span>
                        </h3>
                        <div class="lessons-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                            ${gradeLessons.map(lesson => this.renderLessonCard(lesson)).join('')}
                        </div>
                    </div>
                `;
            }
        }

        this.container.innerHTML = html;
    },

    /**
     * Ders kartı render
     */
    renderLessonCard(lesson) {
        const typeInfo = this.types.find(t => t.id === lesson.type) || { name: 'Genel', color: '#6b7280' };
        const semesterInfo = this.semesters.find(s => s.id === lesson.semester) || { name: '', icon: '' };

        return `
            <div class="lesson-card" style="background: var(--bg-card); border-radius: var(--border-radius); padding: 20px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <span style="background: ${typeInfo.color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${typeInfo.name}</span>
                        ${lesson.code ? `<span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">${lesson.code}</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="Lessons.showFileModal('${lesson.id}')" title="Dosyalar">
                            📁 ${lesson.files?.length || 0}
                        </button>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="Lessons.showAddModal(Lessons.lessons.find(l => l.id === '${lesson.id}'))" title="Düzenle">✏️</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="if(confirm('Bu dersi silmek istiyor musunuz?')) Lessons.remove('${lesson.id}')" title="Sil">🗑️</button>
                    </div>
                </div>

                <h4 style="margin-bottom: 8px; font-size: 16px;">${lesson.name}</h4>
                
                <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 13px; color: var(--text-secondary);">
                    <span>${semesterInfo.icon} ${semesterInfo.name}</span>
                    <span>📊 ${lesson.credits} Kredi / ${lesson.ects} AKTS</span>
                </div>

                ${lesson.instructor ? `<div style="font-size: 13px; color: var(--text-muted);">👨‍🏫 ${lesson.instructor}</div>` : ''}
                ${lesson.location ? `<div style="font-size: 13px; color: var(--text-muted);">📍 ${lesson.location}</div>` : ''}
            </div>
        `;
    }
};
