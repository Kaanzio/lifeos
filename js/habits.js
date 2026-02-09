/**
 * Life OS - Habit Tracker Module v2
 * Çoklu zincir desteği ile alışkanlık takibi
 */

const HabitTracker = {
    chains: [],
    container: null,

    // Zincir emojileri
    chainEmojis: ['🔥', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '🌟', '💎', '⚡', '🎨'],

    init() {
        this.container = document.getElementById('habitTracker');
        this.loadChains();
        this.render();
    },

    loadChains() {
        this.chains = Storage.load('lifeos_habit_chains', [
            // Varsayılan bir zincir oluştur
            {
                id: 'default',
                name: 'Günlük Hedef',
                emoji: '🔥',
                completedDays: [],
                createdAt: new Date().toISOString()
            }
        ]);
    },

    saveChains() {
        Storage.save('lifeos_habit_chains', this.chains);
    },

    /**
     * Yeni zincir ekle
     */
    addChain(name, emoji) {
        const chain = {
            id: Storage.generateId(),
            name: name,
            emoji: emoji || '🔥',
            completedDays: [],
            createdAt: new Date().toISOString()
        };

        this.chains.push(chain);
        this.saveChains();
        this.render();

        Notifications.add('Yeni Zincir Eklendi', `"${name}" zinciri oluşturuldu.`, 'success');
        return chain;
    },

    /**
     * Zincir sil
     */
    removeChain(chainId) {
        if (this.chains.length <= 1) {
            Notifications.showToast('Uyarı', 'En az bir zincir olmalı!', 'warning');
            return;
        }
        this.chains = this.chains.filter(c => c.id !== chainId);
        this.saveChains();
        this.render();
    },

    /**
     * Belirli bir zincirde bugünü toggle et
     */
    toggleDay(chainId, dateStr) {
        const chain = this.chains.find(c => c.id === chainId);
        if (!chain) return;

        const today = new Date().toISOString().split('T')[0];
        // Gelecek günleri işaretleme
        if (dateStr > today) return;

        const index = chain.completedDays.indexOf(dateStr);

        if (index === -1) {
            chain.completedDays.push(dateStr);
            if (dateStr === today) {
                Notifications.showToast('Tebrikler! 🔥', 'Bugünü tamamladın!', 'success');
            }
        } else {
            chain.completedDays.splice(index, 1);
        }

        this.saveChains();
        this.render();
    },

    /**
     * Zincir için seri hesapla
     */
    calculateStreak(chain) {
        if (chain.completedDays.length === 0) return 0;

        const sortedDates = [...chain.completedDays].sort().reverse();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let checkDate = new Date(today);

        // Bugün tamamlanmamışsa dünden başla
        const todayStr = today.toISOString().split('T')[0];
        if (!chain.completedDays.includes(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (chain.completedDays.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Son 28 günü al
     */
    getLast28Days() {
        const days = [];
        const today = new Date();

        for (let i = 27; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push({
                date: date,
                dateStr: date.toISOString().split('T')[0],
                day: date.getDate(),
                isToday: i === 0
            });
        }

        return days;
    },

    /**
     * Zincir ekleme modalı
     */
    showAddChainModal() {
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = 'Yeni Zincir Oluştur';
        modalBody.innerHTML = `
            <form id="chainForm">
                <div class="form-group">
                    <label class="form-label">Zincir Adı *</label>
                    <input type="text" class="form-input" name="name" required placeholder="Örn: Günlük Egzersiz, Kitap Okuma">
                </div>
                <div class="form-group">
                    <label class="form-label">Emoji Seç</label>
                    <div class="emoji-grid" style="display: grid;">
                        ${this.chainEmojis.map((e, i) => `
                            <span class="emoji-option ${i === 0 ? 'selected' : ''}" onclick="document.querySelectorAll('#chainForm .emoji-option').forEach(el => el.classList.remove('selected')); this.classList.add('selected');" data-emoji="${e}">${e}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer" style="padding: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">İptal</button>
                    <button type="submit" class="btn btn-primary">Oluştur</button>
                </div>
            </form>
        `;

        App.openModal();

        document.getElementById('chainForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const selectedEmoji = document.querySelector('#chainForm .emoji-option.selected');
            this.addChain(formData.get('name'), selectedEmoji?.dataset.emoji || '🔥');
            App.closeModal();
        });
    },

    render() {
        if (!this.container) return;

        const days = this.getLast28Days();
        const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

        let html = '<div class="habit-chains-list">';

        // Her zincir için kart oluştur
        this.chains.forEach(chain => {
            const streak = this.calculateStreak(chain);

            html += `
                <div class="habit-chain-card">
                    <div class="habit-chain-header">
                        <div class="habit-chain-name">
                            <span class="habit-chain-emoji">${chain.emoji}</span>
                            <span>${chain.name}</span>
                        </div>
                        <div class="habit-chain-actions">
                            <span class="habit-streak" style="margin-right: 8px;">${streak} gün</span>
                            ${this.chains.length > 1 ? `
                                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" 
                                        onclick="if(confirm('Bu zinciri silmek istiyor musunuz?')) HabitTracker.removeChain('${chain.id}')">
                                    🗑️
                                </button>
                            ` : ''}
                        </div>
                    </div>

                    <div class="habit-calendar">
                        ${dayLabels.map(d => `<div class="habit-day-label">${d}</div>`).join('')}
                        ${days.map(d => {
                const isCompleted = chain.completedDays.includes(d.dateStr);
                return `
                                <div class="habit-day ${isCompleted ? 'completed' : ''} ${d.isToday ? 'today' : ''}" 
                                     onclick="HabitTracker.toggleDay('${chain.id}', '${d.dateStr}')"
                                     title="${d.dateStr}">
                                    ${d.day}
                                </div>
                            `;
            }).join('')}
                    </div>

                    <div class="habit-stats">
                        <div class="habit-stat">
                            <div class="habit-stat-value">${streak}</div>
                            <div class="habit-stat-label">Mevcut Seri</div>
                        </div>
                        <div class="habit-stat">
                            <div class="habit-stat-value">${chain.completedDays.length}</div>
                            <div class="habit-stat-label">Toplam Gün</div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Yeni zincir ekleme butonu
        html += `
            <button class="add-chain-btn" onclick="HabitTracker.showAddChainModal()">
                <span>➕</span> Yeni Zincir Ekle
            </button>
        `;

        html += '</div>';

        this.container.innerHTML = html;
    }
};
