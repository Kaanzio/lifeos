/**
 * Life OS - Storage Module
 * LocalStorage yönetimi ve veri persistence
 */

const Storage = {
    // Storage Keys
    KEYS: {
        LESSONS: 'lifeos_lessons',
        TASKS: 'lifeos_tasks',
        NOTIFICATIONS: 'lifeos_notifications',
        SETTINGS: 'lifeos_settings',
        STATS: 'lifeos_stats'
    },

    // Current User Prefix
    userPrefix: '',

    /**
     * Aktif kullanıcıyı ayarla
     */
    setUser(username) {
        this.userPrefix = username ? `user_${username}_` : '';
    },

    /**
     * Veri kaydet
     */
    save(key, data) {
        try {
            const storageKey = this.userPrefix + key;
            const jsonData = JSON.stringify(data);
            localStorage.setItem(storageKey, jsonData);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    /**
     * Veri yükle
     */
    load(key, defaultValue = null) {
        try {
            const storageKey = this.userPrefix + key;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Veri sil
     */
    remove(key) {
        try {
            const storageKey = this.userPrefix + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Tüm verileri temizle
     */
    /**
     * Tüm verileri temizle (Sadece aktif kullanıcı için)
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                const storageKey = this.userPrefix + key;
                localStorage.removeItem(storageKey);
            });

            // Ayrıca hardcoded keyleri de temizle (varsa)
            const specificKeys = ['lifeos_pomodoro', 'lifeos_schedule', 'lifeos_shows', 'lifeos_notes', 'lifeos_profile'];
            specificKeys.forEach(key => {
                const storageKey = this.userPrefix + key;
                localStorage.removeItem(storageKey);
            });

            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    /**
     * Benzersiz ID oluştur
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Tüm verileri JSON olarak dışa aktar
     */
    exportData() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name.toLowerCase()] = this.load(key, []);
        });
        return JSON.stringify(data, null, 2);
    },

    /**
     * Dosyaya Dışa Aktar (İndir)
     */
    exportToFile() {
        const data = this.exportData();
        const date = new Date().toISOString().split('T')[0];
        const filename = `lifeos_backup_${date}.json`;

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        Notifications.showToast('Yedek İndirildi', 'Dosyayı diğer cihaza gönderip yükleyebilirsiniz.', 'success');
    },

    /**
     * Dosyadan İçe Aktar
     */
    importFromFile(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            if (this.importData(content)) {
                Notifications.showToast('Başarılı', 'Veriler geri yüklendi. Uygulama yenileniyor...', 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                Notifications.showToast('Hata', 'Dosya formatı geçersiz.', 'error');
            }
        };
        reader.readAsText(file);
    },

    /**
     * JSON verilerini içe aktar
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.entries(this.KEYS).forEach(([name, key]) => {
                if (data[name.toLowerCase()]) {
                    this.save(key, data[name.toLowerCase()]);
                }
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    },

    /**
     * İlk kullanım için varsayılan veri oluştur
     */
    initializeDefaults() {
        // Varsayılan ayarlar
        if (!this.load(this.KEYS.SETTINGS)) {
            this.save(this.KEYS.SETTINGS, {
                theme: 'dark',
                notifications: true,
                streak: 0,
                lastVisit: new Date().toISOString()
            });
        }

        // Boş listeler
        if (!this.load(this.KEYS.LESSONS)) {
            this.save(this.KEYS.LESSONS, []);
        }

        if (!this.load(this.KEYS.TASKS)) {
            this.save(this.KEYS.TASKS, []);
        }

        if (!this.load(this.KEYS.NOTIFICATIONS)) {
            this.save(this.KEYS.NOTIFICATIONS, []);
        }

        // İstatistikler
        if (!this.load(this.KEYS.STATS)) {
            this.save(this.KEYS.STATS, {
                dailyProgress: {},
                weeklyGoals: {},
                totalCompleted: 0
            });
        }
    }
};

// Sayfa yüklendiğinde varsayılanları başlat
document.addEventListener('DOMContentLoaded', () => {
    Storage.initializeDefaults();
});
