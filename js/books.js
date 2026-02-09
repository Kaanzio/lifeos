/**
 * Life OS - Books Module v2
 * Kitap takibi yönetimi - Liste görünümü ve kategori filtreleme
 */

const Books = {
    books: [],
    container: null,
    viewMode: 'grid',
    filterCategory: 'all',
    filterStatus: 'all',

    categories: ['Roman', 'Bilim', 'Kişisel Gelişim', 'Tarih', 'Felsefe', 'Teknik', 'Genel'],

    init() {
        this.container = document.getElementById('booksGrid');
        this.loadBooks();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addBookBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadBooks() {
        this.books = Storage.load('lifeos_books', []);
    },

    saveBooks() {
        Storage.save('lifeos_books', this.books);
    },

    add(bookData) {
        const book = {
            id: Storage.generateId(),
            title: bookData.title,
            author: bookData.author || '',
            category: bookData.category || 'Genel',
            icon: bookData.icon || '📖',
            totalPages: parseInt(bookData.totalPages) || 300,
            currentPage: 0,
            status: 'toRead',
            notes: bookData.notes || '',
            rating: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.books.push(book);
        this.saveBooks();
        this.render();
        Dashboard.render();

        Notifications.add('Yeni Kitap Eklendi', `"${book.title}" kitap listenize eklendi.`, 'success');
        return book;
    },

    update(id, updates) {
        const book = this.books.find(b => b.id === id);
        if (book) {
            Object.assign(book, updates, { updatedAt: new Date().toISOString() });

            if (book.currentPage >= book.totalPages && book.status !== 'completed') {
                book.status = 'completed';
                Notifications.add('Tebrikler! 🎉', `"${book.title}" kitabını bitirdiniz!`, 'success');
            }

            this.saveBooks();
            this.render();
            Dashboard.render();
        }
    },

    remove(id) {
        this.books = this.books.filter(b => b.id !== id);
        this.saveBooks();
        this.render();
        Dashboard.render();
    },

    getStats() {
        const totalPagesRead = this.books.reduce((sum, b) => sum + (b.currentPage || 0), 0);
        return {
            total: this.books.length,
            reading: this.books.filter(b => b.status === 'reading').length,
            completed: this.books.filter(b => b.status === 'completed').length,
            pagesRead: totalPagesRead
        };
    },

    getFilteredBooks() {
        return this.books.filter(b => {
            const catMatch = this.filterCategory === 'all' || b.category === this.filterCategory;
            const statusMatch = this.filterStatus === 'all' || b.status === this.filterStatus;
            return catMatch && statusMatch;
        });
    },

    render() {
        const stats = this.getStats();

        document.getElementById('bookStatTotal').textContent = stats.total;
        document.getElementById('bookStatReading').textContent = stats.reading;
        document.getElementById('bookStatCompleted').textContent = stats.completed;

        const pagesEl = document.getElementById('bookStatPages');
        if (pagesEl) pagesEl.textContent = stats.pagesRead;

        const filteredBooks = this.getFilteredBooks();
        let html = this.renderToolbar();

        if (this.books.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">📖</span>
                    <h3>Henüz kitap eklenmedi</h3>
                    <p>Okumak istediğiniz kitapları ekleyerek takip edin</p>
                </div>
            `;
        } else if (filteredBooks.length === 0) {
            html += `<p class="empty-state" style="grid-column: 1/-1;">Bu filtreyle eşleşen kitap yok</p>`;
        } else if (this.viewMode === 'list') {
            html += this.renderListView(filteredBooks);
        } else {
            html += this.renderGridView(filteredBooks);
        }

        this.container.innerHTML = html;
        this.bindCardEvents();
        this.bindToolbarEvents();
    },

    renderToolbar() {
        const catOptions = this.categories.map(c =>
            `<option value="${c}" ${this.filterCategory === c ? 'selected' : ''}>${c}</option>`
        ).join('');

        return `
            <div class="module-toolbar" style="grid-column: 1/-1; display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
                <select class="form-select" id="bookCategoryFilter" style="flex: 0 0 auto; min-width: 150px;">
                    <option value="all" ${this.filterCategory === 'all' ? 'selected' : ''}>📚 Tüm Kategoriler</option>
                    ${catOptions}
                </select>
                <select class="form-select" id="bookStatusFilter" style="flex: 0 0 auto; min-width: 140px;">
                    <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>📊 Tüm Durumlar</option>
                    <option value="toRead" ${this.filterStatus === 'toRead' ? 'selected' : ''}>📋 Okunacak</option>
                    <option value="reading" ${this.filterStatus === 'reading' ? 'selected' : ''}>📖 Okunuyor</option>
                    <option value="completed" ${this.filterStatus === 'completed' ? 'selected' : ''}>✅ Tamamlandı</option>
                </select>
                <div style="flex: 1;"></div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-icon" id="bookGridView" style="${this.viewMode === 'grid' ? 'background: var(--accent-purple); color: white;' : ''}">▦</button>
                    <button class="btn btn-secondary btn-icon" id="bookListView" style="${this.viewMode === 'list' ? 'background: var(--accent-purple); color: white;' : ''}">☰</button>
                </div>
            </div>
        `;
    },

    renderGridView(books) {
        const statusLabels = { toRead: 'Okunacak', reading: 'Okunuyor', completed: 'Tamamlandı' };

        return books.map(book => {
            const progress = Math.round((book.currentPage / book.totalPages) * 100);
            return `
                <div class="module-card" data-id="${book.id}">
                    <div class="module-card-header">
                        <div class="module-card-icon">${book.icon}</div>
                        <div class="module-card-actions">
                            <button class="module-card-btn edit-book" title="Düzenle">✏️</button>
                            <button class="module-card-btn delete-book" title="Sil">🗑️</button>
                        </div>
                    </div>
                    <h4 class="module-card-title">${book.title}</h4>
                    <p class="module-card-subtitle">${book.author || 'Yazar belirtilmedi'}</p>
                    <span style="display: inline-block; padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px; color: var(--text-secondary);">${statusLabels[book.status]}</span>
                    <div class="module-card-progress">
                        <div class="progress-header">
                            <span class="progress-label">${book.currentPage} / ${book.totalPages} sayfa</span>
                            <span class="progress-value">%${progress}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" style="width: 100%; margin-top: 16px;" onclick="Books.updateProgress('${book.id}')">
                        📖 Okuma İlerlemesi
                    </button>
                </div>
            `;
        }).join('');
    },

    renderListView(books) {
        const statusLabels = { toRead: '📋 Okunacak', reading: '📖 Okunuyor', completed: '✅ Tamamlandı' };

        // Kategoriye göre grupla
        const grouped = {};
        books.forEach(book => {
            const cat = book.category || 'Genel';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(book);
        });

        let html = '<div style="grid-column: 1/-1; display: flex; flex-direction: column; gap: 24px;">';

        for (const category of Object.keys(grouped)) {
            const catBooks = grouped[category];
            html += `
                <div class="list-group">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px;">
                        📚 ${category} <span style="font-weight: 400; color: var(--text-muted);">(${catBooks.length})</span>
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${catBooks.map(book => {
                const progress = Math.round((book.currentPage / book.totalPages) * 100);
                return `
                                <div class="list-item" data-id="${book.id}" style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                    <span style="font-size: 24px;">${book.icon}</span>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; margin-bottom: 4px;">${book.title}</div>
                                        <div style="font-size: 13px; color: var(--text-muted);">${book.author || 'Yazar belirtilmedi'}</div>
                                    </div>
                                    <div style="width: 100px;">
                                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">%${progress}</div>
                                        <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px;">
                                            <div style="height: 100%; width: ${progress}%; background: var(--gradient-primary); border-radius: 2px;"></div>
                                        </div>
                                    </div>
                                    <span style="padding: 4px 12px; background: var(--bg-tertiary); border-radius: 20px; font-size: 12px;">${statusLabels[book.status]}</span>
                                    <div style="display: flex; gap: 4px;">
                                        <button class="btn btn-secondary btn-icon edit-book" style="width: 36px; height: 36px;">✏️</button>
                                        <button class="btn btn-secondary btn-icon delete-book" style="width: 36px; height: 36px;">🗑️</button>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    bindToolbarEvents() {
        document.getElementById('bookCategoryFilter')?.addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.render();
        });

        document.getElementById('bookStatusFilter')?.addEventListener('change', (e) => {
            this.filterStatus = e.target.value;
            this.render();
        });

        document.getElementById('bookGridView')?.addEventListener('click', () => {
            this.viewMode = 'grid';
            this.render();
        });

        document.getElementById('bookListView')?.addEventListener('click', () => {
            this.viewMode = 'list';
            this.render();
        });
    },

    bindCardEvents() {
        // Grid & List items
        this.container.querySelectorAll('.module-card, .list-item').forEach(item => {
            const id = item.dataset.id;
            item.querySelector('.edit-book')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(id);
            });
            item.querySelector('.delete-book')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Bu kitabı silmek istediğinizden emin misiniz?')) this.remove(id);
            });
        });
    },

    updateProgress(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Okuma İlerlemesi';

        modalBody.innerHTML = `
            <form id="progressForm">
                <div class="form-group">
                    <label class="form-label">Şu anki sayfa</label>
                    <input type="number" class="form-input" name="currentPage" min="0" max="${book.totalPages}" value="${book.currentPage}">
                </div>
                <div class="form-group">
                    <label class="form-label">Durum</label>
                    <select class="form-select" name="status">
                        <option value="toRead" ${book.status === 'toRead' ? 'selected' : ''}>📚 Okunacak</option>
                        <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>📖 Okunuyor</option>
                        <option value="completed" ${book.status === 'completed' ? 'selected' : ''}>✅ Tamamlandı</option>
                    </select>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('progressForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                currentPage: parseInt(formData.get('currentPage')),
                status: formData.get('status')
            });
            App.closeModal();
        });
    },

    showAddModal() {
        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Yeni Kitap Ekle';

        const catOptions = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');

        modalBody.innerHTML = `
            <form id="bookForm">
                <div class="form-group">
                    <label class="form-label">Kitap Adı *</label>
                    <input type="text" class="form-input" name="title" required placeholder="Örn: Sefiller">
                </div>
                <div class="form-group">
                    <label class="form-label">Yazar</label>
                    <input type="text" class="form-input" name="author" placeholder="Örn: Victor Hugo">
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select class="form-select" name="category">
                        ${catOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">İkon</label>
                    <select class="form-select" name="icon">
                        <option value="📖">📖 Kitap</option>
                        <option value="📚">📚 Kitaplar</option>
                        <option value="📕">📕 Kırmızı</option>
                        <option value="📗">📗 Yeşil</option>
                        <option value="📘">📘 Mavi</option>
                        <option value="📙">📙 Turuncu</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Toplam Sayfa</label>
                    <input type="number" class="form-input" name="totalPages" min="1" value="300">
                </div>
                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes" placeholder="Kitap hakkında notlar..."></textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Ekle</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('bookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.add({
                title: formData.get('title'),
                author: formData.get('author'),
                category: formData.get('category'),
                icon: formData.get('icon'),
                totalPages: formData.get('totalPages'),
                notes: formData.get('notes')
            });
            App.closeModal();
        });
    },

    showEditModal(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;

        const modalBody = document.getElementById('modalBody');
        document.getElementById('modalTitle').textContent = 'Kitap Düzenle';

        modalBody.innerHTML = `
            <form id="bookEditForm">
                <div class="form-group">
                    <label class="form-label">Kitap Adı *</label>
                    <input type="text" class="form-input" name="title" required value="${book.title}">
                </div>
                <div class="form-group">
                    <label class="form-label">Yazar</label>
                    <input type="text" class="form-input" name="author" value="${book.author}">
                </div>
                <div class="form-group">
                    <label class="form-label">Toplam Sayfa</label>
                    <input type="number" class="form-input" name="totalPages" min="1" value="${book.totalPages}">
                </div>
                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes">${book.notes || ''}</textarea>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Kaydet</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('bookEditForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            this.update(id, {
                title: formData.get('title'),
                author: formData.get('author'),
                totalPages: parseInt(formData.get('totalPages')),
                notes: formData.get('notes')
            });
            App.closeModal();
        });
    }
};
