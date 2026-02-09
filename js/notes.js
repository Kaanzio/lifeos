/**
 * Life OS - Notes Module
 * Gelişmiş not defteri sistemi
 */

const Notes = {
    notes: [],
    currentNote: null,
    searchQuery: '',
    filterCategory: 'all',

    categories: [
        { id: 'genel', name: 'Genel', icon: '📄', color: '#6b7280' },
        { id: 'ders', name: 'Ders Notları', icon: '📚', color: '#3b82f6' },
        { id: 'is', name: 'İş / Proje', icon: '💼', color: '#8b5cf6' },
        { id: 'kisisel', name: 'Kişisel', icon: '🏠', color: '#10b981' },
        { id: 'fikir', name: 'Fikirler', icon: '💡', color: '#f59e0b' },
        { id: 'liste', name: 'Listeler', icon: '📋', color: '#ef4444' }
    ],

    init() {
        this.loadNotes();
        this.render();
    },

    loadNotes() {
        this.notes = Storage.load('lifeos_notes', []);
    },

    saveNotes() {
        Storage.save('lifeos_notes', this.notes);
    },

    /**
     * Yeni not ekle
     */
    add(noteData) {
        const note = {
            id: Storage.generateId(),
            title: noteData.title || 'Adsız Not',
            content: noteData.content || '',
            category: noteData.category || 'genel',
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.render();
        Notifications.add('Not Eklendi', `"${note.title}" oluşturuldu.`, 'success');
        return note;
    },

    /**
     * Not güncelle
     */
    update(id, updates) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            Object.assign(note, updates, { updatedAt: new Date().toISOString() });
            this.saveNotes();
            this.render();
        }
    },

    /**
     * Not sil
     */
    remove(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            this.notes = this.notes.filter(n => n.id !== id);
            this.saveNotes();
            this.currentNote = null;
            this.render();
            Notifications.add('Silindi', `"${note.title}" silindi.`, 'info');
        }
    },

    /**
     * Not sabitle/kaldır
     */
    togglePin(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.pinned = !note.pinned;
            this.saveNotes();
            this.render();
        }
    },

    /**
     * Filtrelenmiş notlar
     */
    getFiltered() {
        let filtered = [...this.notes];

        // Kategori filtresi
        if (this.filterCategory !== 'all') {
            filtered = filtered.filter(n => n.category === this.filterCategory);
        }

        // Arama filtresi
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.content.toLowerCase().includes(query)
            );
        }

        // Sabitlenmiş notları üste al
        filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        return filtered;
    },

    /**
     * Not ekleme/düzenleme modalı
     */
    showAddModal(editNote = null) {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        const isEdit = editNote !== null;

        modalTitle.textContent = isEdit ? 'Notu Düzenle' : 'Yeni Not';
        modalBody.innerHTML = `
            <form id="noteForm">
                <div class="form-group">
                    <label class="form-label">📝 Başlık</label>
                    <input type="text" class="form-input" name="title" 
                           placeholder="Notunuzun başlığı (opsiyonel)"
                           value="${isEdit ? editNote.title : ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">📁 Kategori</label>
                    <select class="form-select" name="category">
                        ${this.categories.map(c => `
                            <option value="${c.id}" ${isEdit && editNote.category === c.id ? 'selected' : ''}>
                                ${c.icon} ${c.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">✏️ Not İçeriği</label>
                    <textarea class="form-textarea" name="content" rows="10"
                              placeholder="Notunuzu buraya yazın...">${isEdit ? editNote.content : ''}</textarea>
                </div>

                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Kaydet'}</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('noteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const content = formData.get('content') || '';
            const titleInput = formData.get('title')?.trim();
            // Use provided title, or auto-generate from first line of content
            const firstLine = content.split('\n')[0].trim();
            const title = titleInput || firstLine.substring(0, 50) || 'Adsız Not';

            const data = {
                title: title,
                category: formData.get('category'),
                content: content
            };

            if (isEdit) {
                this.update(editNote.id, data);
            } else {
                this.add(data);
            }
            App.closeModal();
        });
    },

    /**
     * Not görüntüleme
     */
    viewNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.currentNote = note;
        this.render();
    },

    /**
     * Tarih formatlama
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Şimdi';
        if (minutes < 60) return `${minutes} dk önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;

        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    /**
     * Render
     */
    render() {
        const container = document.getElementById('notesContainer');
        if (!container) return;

        const filtered = this.getFiltered();
        const stats = {
            total: this.notes.length,
            pinned: this.notes.filter(n => n.pinned).length
        };

        let html = `
            <div class="notes-layout">
                <!-- Sol panel: Not listesi -->
                <div class="notes-sidebar">
                    <div class="notes-toolbar">
                        <button class="btn btn-primary" onclick="Notes.showAddModal()" style="width: 100%; margin-bottom: 12px;">
                            ➕ Yeni Not
                        </button>
                        <input type="text" class="form-input" placeholder="🔍 Ara..."
                               value="${this.searchQuery}"
                               oninput="Notes.searchQuery = this.value; Notes.render();">
                        <select class="form-select" onchange="Notes.filterCategory = this.value; Notes.render();" style="margin-top: 8px;">
                            <option value="all">📁 Tüm Kategoriler</option>
                            ${this.categories.map(c => `
                                <option value="${c.id}" ${this.filterCategory === c.id ? 'selected' : ''}>
                                    ${c.icon} ${c.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="notes-list">
                        ${filtered.length === 0 ? `
                            <div class="empty-state" style="padding: 24px; text-align: center;">
                                <span style="font-size: 32px;">📝</span>
                                <p style="margin-top: 8px; color: var(--text-muted);">Not bulunamadı</p>
                            </div>
                        ` : ''}
                        ${filtered.map(note => {
            const cat = this.categories.find(c => c.id === note.category) || this.categories[0];
            const isActive = this.currentNote?.id === note.id;
            return `
                                <div class="note-item ${isActive ? 'active' : ''}" onclick="Notes.viewNote('${note.id}')">
                                    <div class="note-item-header">
                                        <span class="note-category-badge" style="background: ${cat.color}20; color: ${cat.color};">${cat.icon}</span>
                                        ${note.pinned ? '<span style="color: var(--warning);">📌</span>' : ''}
                                    </div>
                                    <h4 class="note-item-title">${note.title}</h4>
                                    <p class="note-item-preview">${note.content.substring(0, 60)}${note.content.length > 60 ? '...' : ''}</p>
                                    <span class="note-item-date">${this.formatDate(note.updatedAt)}</span>
                                </div>
                            `;
        }).join('')}
                    </div>

                    <div class="notes-stats">
                        <span>${stats.total} not</span>
                        ${stats.pinned > 0 ? `<span>• ${stats.pinned} sabitlenmiş</span>` : ''}
                    </div>
                </div>

                <!-- Sağ panel: Not içeriği -->
                <div class="notes-content">
                    ${this.currentNote ? this.renderNoteContent(this.currentNote) : `
                        <div class="notes-empty-content">
                            <span style="font-size: 64px; opacity: 0.5;">📝</span>
                            <h3 style="margin-top: 16px; color: var(--text-muted);">Bir not seçin</h3>
                            <p style="color: var(--text-muted);">veya yeni bir not oluşturun</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Not içeriği render - gelişmiş düzenleyici
     */
    renderNoteContent(note) {
        const cat = this.categories.find(c => c.id === note.category) || this.categories[0];
        const wordCount = note.content ? note.content.trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        const charCount = note.content ? note.content.length : 0;
        const lineCount = note.content ? note.content.split('\n').length : 0;

        // Color options for note background
        const colors = [
            { id: 'default', name: 'Varsayılan', bg: 'transparent' },
            { id: 'yellow', name: 'Sarı', bg: 'rgba(250, 204, 21, 0.1)' },
            { id: 'green', name: 'Yeşil', bg: 'rgba(34, 197, 94, 0.1)' },
            { id: 'blue', name: 'Mavi', bg: 'rgba(59, 130, 246, 0.1)' },
            { id: 'purple', name: 'Mor', bg: 'rgba(139, 92, 246, 0.1)' },
            { id: 'pink', name: 'Pembe', bg: 'rgba(236, 72, 153, 0.1)' }
        ];
        const currentColor = colors.find(c => c.id === note.color) || colors[0];

        return `
            <div class="note-view" style="background: ${currentColor.bg};">
                <div class="note-view-header">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                            <select class="form-select" style="width: auto; padding: 4px 24px 4px 8px; font-size: 12px;"
                                    onchange="Notes.update('${note.id}', {category: this.value})">
                                ${this.categories.map(c => `
                                    <option value="${c.id}" ${note.category === c.id ? 'selected' : ''}>
                                        ${c.icon} ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                            <select class="form-select" style="width: auto; padding: 4px 24px 4px 8px; font-size: 12px;"
                                    onchange="Notes.update('${note.id}', {color: this.value}); Notes.viewNote('${note.id}');">
                                ${colors.map(c => `
                                    <option value="${c.id}" ${note.color === c.id ? 'selected' : ''}>
                                        ${c.name}
                                    </option>
                                `).join('')}
                            </select>
                            <span style="color: var(--text-muted); font-size: 11px;">
                                📅 ${this.formatDate(note.updatedAt)}
                            </span>
                        </div>
                        <input type="text" class="note-title-input" value="${note.title}" 
                               placeholder="Başlık..."
                               onchange="Notes.update('${note.id}', {title: this.value})"
                               onkeydown="if(event.key==='Enter'){this.blur();}">
                    </div>
                    <div class="note-view-actions">
                        <button class="btn btn-secondary" onclick="Notes.togglePin('${note.id}')" title="${note.pinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}">
                            ${note.pinned ? '📌' : '📍'}
                        </button>
                        <button class="btn btn-secondary" onclick="Notes.duplicateNote('${note.id}')" title="Kopyala">
                            📋
                        </button>
                        <button class="btn btn-secondary" onclick="if(confirm('Bu notu silmek istiyor musunuz?')) Notes.remove('${note.id}')" title="Sil">
                            🗑️
                        </button>
                    </div>
                </div>

                <!-- Formatting Toolbar -->
                <div class="note-toolbar">
                    <button class="note-tool-btn" onclick="Notes.insertFormat('**', '**')" title="Kalın">
                        <strong>B</strong>
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('*', '*')" title="İtalik">
                        <em>I</em>
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('~~', '~~')" title="Üstü Çizili">
                        <s>S</s>
                    </button>
                    <span class="note-tool-divider"></span>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('# ', '')" title="Başlık">
                        H1
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('## ', '')" title="Alt Başlık">
                        H2
                    </button>
                    <span class="note-tool-divider"></span>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('- [ ] ', '')" title="Yapılacak (Checkbox)">
                        ☐
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('- ', '')" title="Liste">
                        •
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('1. ', '')" title="Numaralı Liste">
                        1.
                    </button>
                    <span class="note-tool-divider"></span>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('> ', '')" title="Alıntı">
                        ❝
                    </button>
                    <button class="note-tool-btn" onclick="Notes.insertFormat('\x60', '\x60')" title="Kod">
                        &lt;/&gt;
                    </button>
                </div>

                <div class="note-view-content">
                    <textarea class="note-content-editor" id="noteEditor"
                              placeholder="Notunuzu buraya yazın...

💡 İpuçları:
• **kalın** yazı için yıldız kullan
• *italik* yazı için tek yıldız
• - [ ] ile yapılacaklar listesi
• # ile başlık ekle"
                              oninput="Notes.handleEditorInput('${note.id}', this.value)">${note.content}</textarea>
                </div>

                <!-- Statistics Bar -->
                <div class="note-stats-bar">
                    <span>📝 ${wordCount} kelime</span>
                    <span>📊 ${charCount} karakter</span>
                    <span>📄 ${lineCount} satır</span>
                    <span style="margin-left: auto; font-size: 10px; color: var(--text-muted);">
                        Oluşturma: ${new Date(note.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                </div>
            </div>
        `;
    },

    /**
     * Not kopyala
     */
    duplicateNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            this.add({
                title: note.title + ' (Kopya)',
                content: note.content,
                category: note.category,
                color: note.color
            });
        }
    },

    /**
     * Editör input handler (debounced save)
     */
    handleEditorInput(id, value) {
        // Clear existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        // Auto-save after 500ms of no typing
        this.saveTimeout = setTimeout(() => {
            const note = this.notes.find(n => n.id === id);
            if (note) {
                note.content = value;
                note.updatedAt = new Date().toISOString();
                this.saveNotes();
            }
        }, 500);
    },

    /**
     * Format ekle (toolbar için)
     */
    insertFormat(before, after) {
        const editor = document.getElementById('noteEditor');
        if (!editor) return;

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const text = editor.value;
        const selected = text.substring(start, end);

        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        editor.value = newText;

        // Update cursor position
        const newPos = start + before.length + selected.length + after.length;
        editor.setSelectionRange(newPos, newPos);
        editor.focus();

        // Trigger save
        if (this.currentNote) {
            this.handleEditorInput(this.currentNote.id, newText);
        }
    }
};

