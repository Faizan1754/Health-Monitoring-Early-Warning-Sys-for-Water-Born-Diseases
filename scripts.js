// Toggle mobile navigation
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("open");
        });

        hamburger.addEventListener("keypress", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                hamburger.classList.toggle("active");
                navMenu.classList.toggle("open");
            }
        });

        // Close mobile navigation when clicking on a link
        document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("open");
        }));
    }

    // Modal functions
    window.showReportModal = function () {
        document.getElementById('reportModal').classList.add('show');
    };
    window.showIVRInfo = function () {
        document.getElementById('ivrModal').classList.add('show');
    };
    window.showSMSModal = function () {
        alert('SMS "WATER [your location]" to 773-829 to report an issue. Standard messaging rates may apply.');
    };
    window.showWebReportModal = function () {
        window.showReportModal();
    };
    window.closeModal = function (modalId) {
        document.getElementById(modalId).classList.remove('show');
    };

    // Close modal when clicking outside of it
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Offline functionality using IndexedDB
    const DB_NAME = 'JalrakshakOfflineDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'pendingReports';
    let db;

    function initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    const store = database.createObjectStore(STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async function addOfflineReport(reportData) {
        if (!db) await initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const reportWithTimestamp = {
                ...reportData,
                timestamp: new Date().getTime(),
                synced: false
            };

            const request = store.add(reportWithTimestamp);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async function getPendingReports() {
        if (!db) await initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('timestamp');
            const request = index.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async function deleteSyncedReport(id) {
        if (!db) await initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Online/offline status indicator
    function updateOnlineStatus() {
        if (navigator.onLine) {
            document.body.classList.add('online');
            document.body.classList.remove('offline');
            syncOfflineData();
        } else {
            document.body.classList.add('offline');
            document.body.classList.remove('online');
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Simulate server sync (replace with actual API calls)
    async function syncWithServer(report) {
        // This is a simulation - replace with your actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Syncing report:', report);
                resolve({ success: true, id: report.id });
            }, 1000);
        });
    }

    // Sync offline data when coming online
    async function syncOfflineData() {
        const pendingReports = await getPendingReports();
        if (pendingReports.length === 0) return;

        document.getElementById('syncModal').classList.add('show');
        const syncStatus = document.getElementById('syncStatus');
        const progressBar = document.querySelector('.progress');
        let successCount = 0;
        let errorCount = 0;

        for (const report of pendingReports) {
            try {
                const result = await syncWithServer(report);
                if (result.success) {
                    await deleteSyncedReport(report.id);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
            // Update progress
            if (progressBar) {
                const progress = ((successCount + errorCount) / pendingReports.length) * 100;
                progressBar.style.width = `${progress}%`;
            }
        }

        // Update status message
        if (errorCount === 0) {
            syncStatus.innerHTML = `<p>All data synced successfully! ${successCount} reports uploaded.</p>`;
        } else {
            syncStatus.innerHTML = `
                <p>Sync completed with some errors.</p>
                <p>Successful: ${successCount}, Failed: ${errorCount}</p>
                <p>Failed reports will be retried next time you're online.</p>
            `;
        }

        setTimeout(() => {
            window.closeModal('syncModal');
        }, 3000);
    }

    // Modify the form submission to handle offline scenario
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const location = document.getElementById('location').value;
            const issueType = document.getElementById('issueType').value;
            const description = document.getElementById('description').value;
            const contact = document.getElementById('contact').value;

            const reportData = { location, issueType, description, contact };

            if (navigator.onLine) {
                try {
                    await syncWithServer(reportData);
                    alert('Thank you for your report! Our team will look into this issue.');
                } catch (error) {
                    await addOfflineReport(reportData);
                    alert('Report saved offline. It will be sent when you reconnect.');
                }
            } else {
                await addOfflineReport(reportData);
                alert('Report saved offline. It will be sent when you reconnect.');
            }

            window.closeModal('reportModal');
            this.reset();
        });
    }

    // Initialize offline functionality when page loads
    window.addEventListener('load', async () => {
        await initDatabase();
        updateOnlineStatus();

        // Show pending badge if there are pending reports
        const pendingReports = await getPendingReports();
        if (pendingReports.length > 0) {
            const pendingBadge = document.createElement('span');
            pendingBadge.id = 'pendingReportsBadge';
            pendingBadge.className = 'pending-badge';
            pendingBadge.textContent = pendingReports.length;
            pendingBadge.title = `${pendingReports.length} reports waiting to sync`;

            const reportTab = document.querySelector('a[href="#report"]');
            if (reportTab) reportTab.appendChild(pendingBadge);
        }
    });

    // Simulate live data updates
    function updateMetrics() {
        const metrics = document.querySelectorAll('.metric-value');
        metrics.forEach(metric => {
            const currentValue = parseInt(metric.textContent);
            const randomChange = Math.floor(Math.random() * 5) + 1;
            const newValue = currentValue + randomChange;
            metric.textContent = newValue;

            const changeElement = metric.nextElementSibling;
            if (changeElement && changeElement.classList.contains('metric-change')) {
                changeElement.textContent = `+${randomChange} today`;
            }
        });
    }
    setInterval(updateMetrics, 30000);

    // Simulate alert updates
    function addNewAlert() {
        const alerts = [
            {
                type: 'high',
                title: 'High Risk Alert',
                message: 'New contamination detected in water source near Lalung village.',
                time: 'Just now'
            },
            {
                type: 'medium',
                title: 'Medium Risk Alert',
                message: 'Increased reports of stomach illness in Rangapara area.',
                time: '10 minutes ago'
            }
        ];

        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        const alertsContainer = document.querySelector('.alerts-container');

        const alertElement = document.createElement('div');
        alertElement.classList.add('alert-card', `${randomAlert.type}-alert`);
        alertElement.innerHTML = `
            <div class="alert-header">
                <h3>${randomAlert.title}</h3>
                <span class="alert-time">${randomAlert.time}</span>
            </div>
            <p>${randomAlert.message}</p>
            <div class="alert-actions">
                <button class="btn outline">Acknowledge</button>
                <button class="btn">View Details</button>
            </div>
        `;

        if (alertsContainer) {
            alertsContainer.prepend(alertElement);
            if (alertsContainer.children.length > 5) {
                alertsContainer.removeChild(alertsContainer.lastChild);
            }
        }
    }
    setInterval(addNewAlert, 60000);

    // Map village interactions
    document.querySelectorAll('.village').forEach(village => {
        village.addEventListener('click', () => {
            const villageName = village.textContent;
            const riskLevel = village.classList.contains('low-risk') ? 'low risk' :
                village.classList.contains('moderate-risk') ? 'moderate risk' : 'high risk';

            alert(`${villageName} is currently at ${riskLevel} level for water-borne diseases.`);
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').then(function (registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, function (err) {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
});