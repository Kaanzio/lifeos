/**
 * Life OS - Notifications Module v2
 * Bildirim sistemi yönetimi - Silme özelliği ile
 */

const Notifications = {
    panel: null,
    list: null,
    badge: null,
    notifications: [],

    /**
     * Modülü başlat
     */
    init() {
        this.panel = document.getElementById('notificationsPanel');
        this.list = document.getElementById('notificationsList');
        this.badge = document.getElementById('notificationBadge');

        this.loadNotifications();
        this.updateBadge();
        this.renderNotifications();
        this.checkScheduledNotifications();
    },

    /**
     * Bildirimleri yükle
     */
    loadNotifications() {
        this.notifications = Storage.load(Storage.KEYS.NOTIFICATIONS, []);
    },

    /**
     * Bildirimleri kaydet
     */
    saveNotifications() {
        Storage.save(Storage.KEYS.NOTIFICATIONS, this.notifications);
    },

    /**
     * Yeni bildirim ekle
     */
    add(title, message, type = 'info') {
        const notification = {
            id: Storage.generateId(),
            title,
            message,
            type, // info, success, warning, error
            read: false,
            createdAt: new Date().toISOString()
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.renderNotifications();
        this.updateBadge();
        this.showToast(title, message, type);

        return notification;
    },

    /**
     * Bildirimi okundu olarak işaretle
     */
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.renderNotifications();
            this.updateBadge();
        }
    },

    /**
     * Tüm bildirimleri okundu olarak işaretle
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.renderNotifications();
        this.updateBadge();
    },

    /**
     * Bildirimi sil
     */
    remove(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.renderNotifications();
        this.updateBadge();
    },

    /**
     * Tüm bildirimleri temizle
     */
    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.renderNotifications();
        this.updateBadge();
    },

    /**
     * Badge'i güncelle
     */
    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (this.badge) {
            this.badge.textContent = unreadCount;
            this.badge.setAttribute('data-count', unreadCount);
        }
    },

    /**
     * Paneli aç/kapat
     */
    togglePanel() {
        if (this.panel) {
            this.panel.classList.toggle('open');
        }
    },

    /**
     * Paneli kapat
     */
    closePanel() {
        if (this.panel) {
            this.panel.classList.remove('open');
        }
    },

    /**
     * Bildirimleri render et
     */
    renderNotifications() {
        if (!this.list) return;

        if (this.notifications.length === 0) {
            this.list.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
                    <p>Henüz bildirim yok</p>
                </div>
            `;
            return;
        }

        this.list.innerHTML = `
            <div class="notifications-actions" style="display: flex; gap: 8px; margin-bottom: 16px;">
                <button class="btn btn-secondary" id="markAllRead" style="flex: 1; font-size: 12px;">
                    ✓ Tümünü Okundu İşaretle
                </button>
                <button class="btn btn-secondary" id="clearAllNotifications" style="font-size: 12px;">
                    🗑️ Temizle
                </button>
            </div>
            ${this.notifications.map(n => `
                <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                    <button class="notification-delete" onclick="Notifications.remove('${n.id}')" title="Sil">×</button>
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-message">${n.message || ''}</div>
                    <div class="notification-time">${this.formatTime(n.createdAt)}</div>
                </div>
            `).join('')}
        `;

        // Event bağla
        this.list.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Delete butonuna tıklanmadıysa okundu işaretle
                if (!e.target.classList.contains('notification-delete')) {
                    this.markAsRead(item.dataset.id);
                }
            });
        });

        // Mark all read button
        document.getElementById('markAllRead')?.addEventListener('click', () => {
            this.markAllAsRead();
        });

        // Clear all button
        document.getElementById('clearAllNotifications')?.addEventListener('click', () => {
            if (confirm('Tüm bildirimleri silmek istiyor musunuz?')) {
                this.clearAll();
            }
        });
    },

    /**
     * Zamanı formatla
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Şimdi';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;

        return date.toLocaleDateString('tr-TR');
    },

    /**
     * Toast bildirimi göster
     */
    showToast(title, message, type = 'info') {
        // Toast container yoksa oluştur
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 400;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;
            document.body.appendChild(container);
        }

        // Toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 16px 20px;
            background: var(--bg-secondary);
            border-radius: var(--border-radius-sm);
            border: 1px solid var(--border-color);
            box-shadow: 0 10px 40px var(--shadow-color);
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;

        const iconMap = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 20px;">${iconMap[type]}</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                    ${message ? `<div style="font-size: 14px; color: var(--text-secondary);">${message}</div>` : ''}
                </div>
            </div>
        `;

        container.appendChild(toast);

        // Animasyon için CSS ekle
        if (!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // 4 saniye sonra kaldır
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Zamanlanmış bildirimleri kontrol et
     */
    checkScheduledNotifications() {
        // Günlük kontroller
        setInterval(() => {
            this.checkDailyReminders();
        }, 60000); // Her dakika kontrol

        // İlk yüklemede de kontrol et
        this.checkDailyReminders();
    },

    /**
     * Günlük hatırlatmaları kontrol et
     */
    checkDailyReminders() {
        const settings = Storage.load(Storage.KEYS.SETTINGS, {});
        const today = new Date().toDateString();

        // Bugün zaten bildirim gönderdik mi?
        if (settings.lastReminderDate === today) return;

        const now = new Date();
        const hour = now.getHours();

        // Sabah 9'da hatırlatma
        if (hour >= 9 && hour < 10) {
            const tasks = Storage.load(Storage.KEYS.TASKS, []);
            const todayTasks = tasks.filter(t => {
                const taskDate = new Date(t.dueDate).toDateString();
                return taskDate === today && t.status !== 'done';
            });

            if (todayTasks.length > 0) {
                this.add(
                    'Günaydın! 🌅',
                    `Bugün ${todayTasks.length} görevin var.`,
                    'info'
                );
            }

            settings.lastReminderDate = today;
            Storage.save(Storage.KEYS.SETTINGS, settings);
        }
    }
};
