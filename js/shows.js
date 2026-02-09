const Shows = {
    shows: [],
    container: null,
    filterType: 'all',
    filterStatus: 'all',
    filterGenre: 'all',
    searchQuery: '',

    // Türler
    types: [
        { id: 'dizi', name: 'Dizi', icon: '📺' },
        { id: 'film', name: 'Film', icon: '🎬' },
        { id: 'anime', name: 'Anime', icon: '🎌' },
        { id: 'belgesel', name: 'Belgesel', icon: '🎥' }
    ],

    // Durum
    statuses: [
        { id: 'izleniyor', name: 'İzleniyor', color: '#3b82f6' },
        { id: 'tamamlandi', name: 'Tamamlandı', color: '#10b981' },
        { id: 'beklemede', name: 'Beklemede', color: '#f59e0b' },
        { id: 'birakildi', name: 'Bırakıldı', color: '#6b7280' }
    ],

    // Kategoriler
    genres: [
        'Aksiyon', 'Komedi', 'Dram', 'Korku', 'Romantik',
        'Bilim Kurgu', 'Fantastik', 'Gerilim', 'Animasyon', 'Suç'
    ],

    // Streaming Platformları
    platforms: [
        { id: 'netflix', name: 'Netflix', icon: '🔴', color: '#e50914' },
        { id: 'disney', name: 'Disney+', icon: '🔵', color: '#113ccf' },
        { id: 'amazon', name: 'Prime Video', icon: '🔷', color: '#00a8e1' },
        { id: 'blutv', name: 'BluTV', icon: '🟣', color: '#2d0a65' },
        { id: 'exxen', name: 'Exxen', icon: '🟡', color: '#f7b500' },
        { id: 'gain', name: 'Gain', icon: '🟢', color: '#00b341' },
        { id: 'mubi', name: 'MUBI', icon: '⚫', color: '#000000' },
        { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#ff0000' },
        { id: 'other', name: 'Diğer', icon: '📺', color: '#6b7280' }
    ],

    init() {
        this.container = document.getElementById('showsGrid');
        this.loadShows();
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('addShowBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },

    loadShows() {
        this.shows = Storage.load('lifeos_shows', []);
    },

    saveShows() {
        Storage.save('lifeos_shows', this.shows);
    },

    /**
     * Yeni dizi/film ekle
     */
    add(showData) {
        const show = {
            id: Storage.generateId(),
            title: showData.title,
            type: showData.type || 'dizi',
            genre: showData.genre || 'Dram',
            status: showData.status || 'beklemede',
            rating: parseFloat(showData.rating) || 0,
            year: parseInt(showData.year) || new Date().getFullYear(),
            currentEpisode: parseInt(showData.currentEpisode) || 0,
            totalEpisodes: parseInt(showData.totalEpisodes) || 1,
            currentSeason: parseInt(showData.currentSeason) || 1,
            totalSeasons: parseInt(showData.totalSeasons) || 1,
            platform: showData.platform || '',
            notes: showData.notes || '',
            poster: showData.poster || '',
            createdAt: new Date().toISOString()
        };

        this.shows.push(show);
        this.saveShows();
        this.render();

        Notifications.add('Eklendi', `"${show.title}" listenize eklendi.`, 'success');
        return show;
    },

    /**
     * Güncelle
     */
    update(id, updates) {
        const show = this.shows.find(s => s.id === id);
        if (show) {
            Object.assign(show, updates);
            this.saveShows();
            this.render();
        }
    },

    /**
     * Sil
     */
    remove(id) {
        const show = this.shows.find(s => s.id === id);
        if (show) {
            this.shows = this.shows.filter(s => s.id !== id);
            this.saveShows();
            this.render();
            Notifications.add('Silindi', `"${show.title}" silindi.`, 'info');
        }
    },

    /**
     * Bölüm ilerlet
     */
    nextEpisode(id) {
        const show = this.shows.find(s => s.id === id);
        if (show && show.currentEpisode < show.totalEpisodes) {
            show.currentEpisode++;
            if (show.currentEpisode >= show.totalEpisodes && show.currentSeason >= show.totalSeasons) {
                show.status = 'tamamlandi';
                Notifications.add('Tebrikler! 🎉', `"${show.title}" tamamlandı!`, 'success');
            }
            this.saveShows();
            this.render();
        }
    },

    /**
     * Filtrelenmiş liste
     */
    getFiltered() {
        return this.shows.filter(s => {
            const typeMatch = this.filterType === 'all' || s.type === this.filterType;
            const statusMatch = this.filterStatus === 'all' || s.status === this.filterStatus;
            const genreMatch = this.filterGenre === 'all' || s.genre === this.filterGenre;
            const searchMatch = !this.searchQuery ||
                s.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (s.genre && s.genre.toLowerCase().includes(this.searchQuery.toLowerCase()));
            return typeMatch && statusMatch && genreMatch && searchMatch;
        });
    },

    /**
     * İstatistikler
     */
    getStats() {
        return {
            total: this.shows.length,
            watching: this.shows.filter(s => s.status === 'izleniyor').length,
            completed: this.shows.filter(s => s.status === 'tamamlandi').length
        };
    },

    /**
     * Modal ekle/düzenle
     */
    showAddModal(editShow = null) {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        const isEdit = editShow !== null;

        modalTitle.textContent = isEdit ? 'Düzenle' : 'Dizi / Film Ekle';
        modalBody.innerHTML = `
            <form id="showForm">
                <div class="form-group">
                    <label class="form-label">Başlık *</label>
                    <input type="text" class="form-input" name="title" required 
                           placeholder="Örn: Breaking Bad" value="${isEdit ? editShow.title : ''}">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Tür</label>
                        <select class="form-select" name="type">
                            ${this.types.map(t => `
                                <option value="${t.id}" ${isEdit && editShow.type === t.id ? 'selected' : ''}>
                                    ${t.icon} ${t.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Kategori</label>
                        <select class="form-select" name="genre">
                            ${this.genres.map(g => `
                                <option value="${g}" ${isEdit && editShow.genre === g ? 'selected' : ''}>${g}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Durum</label>
                        <select class="form-select" name="status">
                            ${this.statuses.map(s => `
                                <option value="${s.id}" ${isEdit && editShow.status === s.id ? 'selected' : ''}>
                                    ${s.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Yıl</label>
                        <input type="number" class="form-input" name="year" 
                               value="${isEdit ? editShow.year : new Date().getFullYear()}" min="1900" max="2100">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Sezon</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="number" class="form-input" name="currentSeason" min="1" 
                                   value="${isEdit ? editShow.currentSeason : 1}" style="width: 70px;">
                            <span>/</span>
                            <input type="number" class="form-input" name="totalSeasons" min="1" 
                                   value="${isEdit ? editShow.totalSeasons : 1}" style="width: 70px;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bölüm</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="number" class="form-input" name="currentEpisode" min="0" 
                                   value="${isEdit ? editShow.currentEpisode : 0}" style="width: 70px;">
                            <span>/</span>
                            <input type="number" class="form-input" name="totalEpisodes" min="1" 
                                   value="${isEdit ? editShow.totalEpisodes : 10}" style="width: 70px;">
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Puan (0-10)</label>
                        <input type="number" class="form-input" name="rating" min="0" max="10" step="0.1"
                               value="${isEdit ? editShow.rating : 0}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Platform</label>
                        <select class="form-select" name="platform">
                            ${this.platforms.map(p => `
                                <option value="${p.id}" ${isEdit && editShow.platform === p.id ? 'selected' : ''}>
                                    ${p.icon} ${p.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notlar</label>
                    <textarea class="form-textarea" name="notes" 
                              placeholder="Notlarınız...">${isEdit ? editShow.notes || '' : ''}</textarea>
                </div>

                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Ekle'}</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('showForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            const data = {
                title: formData.get('title'),
                type: formData.get('type'),
                genre: formData.get('genre'),
                status: formData.get('status'),
                year: formData.get('year'),
                currentSeason: formData.get('currentSeason'),
                totalSeasons: formData.get('totalSeasons'),
                currentEpisode: formData.get('currentEpisode'),
                totalEpisodes: formData.get('totalEpisodes'),
                rating: formData.get('rating'),
                platform: formData.get('platform'),
                notes: formData.get('notes')
            };

            if (isEdit) {
                this.update(editShow.id, data);
            } else {
                this.add(data);
            }
            App.closeModal();
        });
    },

    /**
     * Render
     */
    render() {
        const stats = this.getStats();

        const statTotal = document.getElementById('showStatTotal');
        const statWatching = document.getElementById('showStatWatching');
        const statCompleted = document.getElementById('showStatCompleted');

        if (statTotal) statTotal.textContent = stats.total;
        if (statWatching) statWatching.textContent = stats.watching;
        if (statCompleted) statCompleted.textContent = stats.completed;

        if (!this.container) return;

        let html = `
            <div class="shows-toolbar" style="display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center;">
                <input type="text" class="form-input" placeholder="🔍 Ara..." 
                       style="width: 200px;" value="${this.searchQuery}"
                       oninput="Shows.searchQuery = this.value; Shows.render();">
                <select class="form-select" onchange="Shows.filterType = this.value; Shows.render();" style="width: auto;">
                    <option value="all">📺 Tüm Türler</option>
                    ${this.types.map(t => `
                        <option value="${t.id}" ${this.filterType === t.id ? 'selected' : ''}>
                            ${t.icon} ${t.name}
                        </option>
                    `).join('')}
                </select>
                <select class="form-select" onchange="Shows.filterStatus = this.value; Shows.render();" style="width: auto;">
                    <option value="all">📊 Tüm Durumlar</option>
                    ${this.statuses.map(s => `
                        <option value="${s.id}" ${this.filterStatus === s.id ? 'selected' : ''}>
                            ${s.name}
                        </option>
                    `).join('')}
                </select>
                <select class="form-select" onchange="Shows.filterGenre = this.value; Shows.render();" style="width: auto;">
                    <option value="all">🏷️ Tüm Kategoriler</option>
                    ${this.genres.map(g => `
                        <option value="${g}" ${this.filterGenre === g ? 'selected' : ''}>${g}</option>
                    `).join('')}
                </select>
                <div style="margin-left: auto; display: flex; gap: 8px;">
                    <span style="color: var(--text-muted); font-size: 13px;">${this.shows.length} içerik</span>
                </div>
            </div>
        `;

        const filtered = this.getFiltered();

        if (this.shows.length === 0) {
            html += `
                <div class="empty-state-large">
                    <span class="empty-icon">🎬</span>
                    <h3>Henüz dizi veya film eklenmedi</h3>
                    <p>İzlediğiniz veya izlemek istediğiniz yapımları ekleyin</p>
                </div>
            `;
        } else if (filtered.length === 0) {
            html += `<div class="empty-state" style="text-align: center; padding: 48px;">Bu filtreyle eşleşen içerik yok</div>`;
        } else {
            html += `<div class="shows-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">`;
            filtered.forEach(show => {
                html += this.renderCard(show);
            });
            html += `</div>`;
        }

        this.container.innerHTML = html;
    },

    /**
     * Kart render
     */
    renderCard(show) {
        const typeInfo = this.types.find(t => t.id === show.type) || { icon: '📺', name: 'Dizi' };
        const statusInfo = this.statuses.find(s => s.id === show.status) || { color: '#6b7280', name: 'Beklemede' };
        const platformInfo = this.platforms.find(p => p.id === show.platform) || this.platforms.find(p => p.id === 'other');
        const progress = show.totalEpisodes > 0 ? Math.round((show.currentEpisode / show.totalEpisodes) * 100) : 0;

        return `
            <div class="show-card" style="background: var(--bg-card); border-radius: var(--border-radius); padding: 20px; border: 1px solid var(--border-color); display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 24px;">${typeInfo.icon}</span>
                        ${platformInfo ? `<span style="font-size: 14px; padding: 2px 8px; background: ${platformInfo.color}20; color: ${platformInfo.color}; border-radius: 8px; font-weight: 500;">${platformInfo.icon} ${platformInfo.name}</span>` : ''}
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="Shows.showAddModal(Shows.shows.find(s => s.id === '${show.id}'))" title="Düzenle">✏️</button>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                onclick="if(confirm('Silmek istiyor musunuz?')) Shows.remove('${show.id}')" title="Sil">🗑️</button>
                    </div>
                </div>

                <h4 style="margin-bottom: 8px; font-size: 16px; font-weight: 700;">${show.title}</h4>
                
                <div style="display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span style="background: ${statusInfo.color}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">${statusInfo.name}</span>
                    <span style="background: var(--bg-tertiary); padding: 3px 10px; border-radius: 12px; font-size: 11px;">${show.genre}</span>
                    <span style="color: var(--text-muted); font-size: 12px; display: flex; align-items: center;">📅 ${show.year}</span>
                </div>

                ${show.type !== 'film' ? `
                    <div style="margin-bottom: 12px; flex: 1;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">
                            <span>Sezon ${show.currentSeason} • Bölüm ${show.currentEpisode}/${show.totalEpisodes}</span>
                            <span style="font-weight: 600; color: ${statusInfo.color};">${progress}%</span>
                        </div>
                        <div style="height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${progress}%; background: ${statusInfo.color}; transition: width 0.3s;"></div>
                        </div>
                    </div>
                ` : '<div style="flex: 1;"></div>'}

                <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <div style="display: flex; gap: 12px;">
                        ${show.rating > 0 ? `<span style="font-size: 13px;">⭐ ${show.rating}/10</span>` : ''}
                    </div>
                    ${show.type !== 'film' && show.status === 'izleniyor' ? `
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;" onclick="Shows.nextEpisode('${show.id}')">
                            ▶️ Sonraki
                        </button>
                    ` : ''}
                    ${show.status === 'beklemede' ? `
                        <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="Shows.update('${show.id}', {status: 'izleniyor'}); Shows.render();">
                            ▶️ İzlemeye Başla
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
};
