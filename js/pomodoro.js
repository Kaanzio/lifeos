/**
 * Life OS - Pomodoro Module
 * Pomodoro tekniği ile zaman yönetimi
 */

const Pomodoro = {
    timerInterval: null,
    isRunning: false,
    isPaused: false,
    timeRemaining: 25 * 60, // seconds
    currentMode: 'work', // work, shortBreak, longBreak
    completedPomodoros: 0,
    totalMinutes: 0,
    dailyStreak: 0,

    settings: {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15
    },

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
    },

    loadData() {
        const data = Storage.load('lifeos_pomodoro', {
            completedPomodoros: 0,
            totalMinutes: 0,
            dailyStreak: 0,
            lastDate: null,
            settings: this.settings
        });

        this.completedPomodoros = data.completedPomodoros || 0;
        this.totalMinutes = data.totalMinutes || 0;
        this.dailyStreak = data.dailyStreak || 0;
        this.settings = data.settings || this.settings;

        // Reset daily streak if new day
        const today = new Date().toDateString();
        if (data.lastDate !== today) {
            this.dailyStreak = 0;
        }

        // Apply settings to inputs
        const workInput = document.getElementById('pomodoroWorkTime');
        const shortInput = document.getElementById('pomodoroShortBreak');
        const longInput = document.getElementById('pomodoroLongBreak');

        if (workInput) workInput.value = this.settings.workTime;
        if (shortInput) shortInput.value = this.settings.shortBreak;
        if (longInput) longInput.value = this.settings.longBreak;

        this.timeRemaining = this.settings.workTime * 60;
    },

    saveData() {
        Storage.save('lifeos_pomodoro', {
            completedPomodoros: this.completedPomodoros,
            totalMinutes: this.totalMinutes,
            dailyStreak: this.dailyStreak,
            lastDate: new Date().toDateString(),
            settings: this.settings
        });
    },

    bindEvents() {
        document.getElementById('pomodoroStart')?.addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pomodoroPause')?.addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('pomodoroReset')?.addEventListener('click', () => {
            this.reset();
        });

        // Settings change
        document.getElementById('pomodoroWorkTime')?.addEventListener('change', (e) => {
            this.settings.workTime = parseInt(e.target.value) || 25;
            if (this.currentMode === 'work' && !this.isRunning) {
                this.timeRemaining = this.settings.workTime * 60;
                this.updateDisplay();
            }
            this.saveData();
        });

        document.getElementById('pomodoroShortBreak')?.addEventListener('change', (e) => {
            this.settings.shortBreak = parseInt(e.target.value) || 5;
            this.saveData();
        });

        document.getElementById('pomodoroLongBreak')?.addEventListener('change', (e) => {
            this.settings.longBreak = parseInt(e.target.value) || 15;
            this.saveData();
        });
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        document.getElementById('pomodoroStart').style.display = 'none';
        document.getElementById('pomodoroPause').style.display = 'inline-flex';

        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    },

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timerInterval);

        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroStart').textContent = '▶ Devam';
        document.getElementById('pomodoroPause').style.display = 'none';
    },

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        if (this.currentMode === 'work') {
            this.timeRemaining = this.settings.workTime * 60;
        } else if (this.currentMode === 'shortBreak') {
            this.timeRemaining = this.settings.shortBreak * 60;
        } else {
            this.timeRemaining = this.settings.longBreak * 60;
        }

        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroStart').textContent = '▶ Başlat';
        document.getElementById('pomodoroPause').style.display = 'none';

        this.updateDisplay();
    },

    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.updateDisplay();
        } else {
            this.complete();
        }
    },

    complete() {
        clearInterval(this.timerInterval);
        this.isRunning = false;

        // Play notification sound (browser beep)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBSyb1+zTdzUMLobL8NyLNwYnkcny15IpAi6e2/PekS0GM5bT8d6PLAQxnt3035AsBC+a1PHfjy0EL5jR8d+NLAAumtXy4Y8qAC+U0fHdkSoALpbV8uOQKwAvlM/x3I8rADGW0fPekCsAMJXR896QLAAyl9Hz3o8qADGU0fLdkCsAMZfP8tyOKgAxl8/z3Y8qADCVz/LcjyoAMJfR892PKgAwlc/y3I8qADCVz/LcjioAMJXP8tyOKgAwlc/y3I4qADCVz/LcjykAMJXP8tyOKQAvlc/y248pAC+Vz/LbjikAL5XP8tuOKQAvlc/y248pAC+Vz/LbjikA');
            audio.play().catch(() => { });
        } catch (e) { }

        if (this.currentMode === 'work') {
            this.completedPomodoros++;
            this.totalMinutes += this.settings.workTime;
            this.dailyStreak++;
            this.saveData();
            this.updateStats();

            Notifications.add(
                'Pomodoro Tamamlandı! 🍅',
                'Harika iş! Şimdi mola zamanı.',
                'success'
            );

            // Switch to break
            if (this.completedPomodoros % 4 === 0) {
                this.currentMode = 'longBreak';
                this.timeRemaining = this.settings.longBreak * 60;
            } else {
                this.currentMode = 'shortBreak';
                this.timeRemaining = this.settings.shortBreak * 60;
            }
        } else {
            Notifications.add(
                'Mola Bitti! 💪',
                'Çalışmaya devam etme zamanı.',
                'info'
            );

            this.currentMode = 'work';
            this.timeRemaining = this.settings.workTime * 60;
        }

        this.updateDisplay();

        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroStart').textContent = '▶ Başlat';
        document.getElementById('pomodoroPause').style.display = 'none';
    },

    updateDisplay() {
        const timerEl = document.getElementById('pomodoroTimer');
        const statusEl = document.getElementById('pomodoroStatus');

        if (timerEl) {
            const minutes = Math.floor(this.timeRemaining / 60);
            const seconds = this.timeRemaining % 60;
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            // Update color class
            timerEl.classList.remove('work', 'break');
            timerEl.classList.add(this.currentMode === 'work' ? 'work' : 'break');
        }

        if (statusEl) {
            const statusLabels = {
                work: 'Çalışma Zamanı',
                shortBreak: 'Kısa Mola',
                longBreak: 'Uzun Mola'
            };
            statusEl.textContent = statusLabels[this.currentMode];
        }
    },

    updateStats() {
        const completedEl = document.getElementById('pomodoroCompleted');
        const minutesEl = document.getElementById('pomodoroTotalMinutes');
        const streakEl = document.getElementById('pomodoroStreak');

        if (completedEl) completedEl.textContent = this.completedPomodoros;
        if (minutesEl) minutesEl.textContent = this.totalMinutes;
        if (streakEl) streakEl.textContent = this.dailyStreak;
    },

    /**
     * Tüm verileri sıfırla
     */
    resetAllData() {
        if (!confirm('Tüm Pomodoro verilerini sıfırlamak istediğinize emin misiniz?\n\nBu işlem geri alınamaz!')) {
            return;
        }

        this.completedPomodoros = 0;
        this.totalMinutes = 0;
        this.dailyStreak = 0;
        this.currentMode = 'work';
        this.timeRemaining = this.settings.workTime * 60;
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);

        this.saveData();
        this.updateDisplay();
        this.updateStats();

        document.getElementById('pomodoroStart').style.display = 'inline-flex';
        document.getElementById('pomodoroStart').textContent = '▶ Başlat';
        document.getElementById('pomodoroPause').style.display = 'none';

        Notifications.add('Veriler Sıfırlandı', 'Pomodoro istatistikleri temizlendi.', 'info');
    },

    render() {
        this.updateDisplay();
        this.updateStats();
    }
};
