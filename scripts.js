// Toggle mobile navigation
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

// Close mobile navigation when clicking on a link
document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));

// Modal functions
function showReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
}

function showIVRInfo() {
    document.getElementById('ivrModal').style.display = 'flex';
}

function showSMSModal() {
    alert('SMS "WATER [your location]" to 773-829 to report an issue. Standard messaging rates may apply.');
}

function showWebReportModal() {
    showReportModal();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target === modals[i]) {
            modals[i].style.display = 'none';
        }
    }
});

// Form submission
document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const location = document.getElementById('location').value;
    const issueType = document.getElementById('issueType').value;
    const description = document.getElementById('description').value;
    
    // In a real application, you would send this data to a server
    console.log('Water issue report submitted:', { location, issueType, description });
    
    // Show success message
    alert('Thank you for your report! Our team will look into this issue.');
    
    // Close modal and reset form
    closeModal('reportModal');
    this.reset();
});

// Simulate live data updates
function updateMetrics() {
    // Randomly update metrics to simulate live data
    const metrics = document.querySelectorAll('.metric-value');
    metrics.forEach(metric => {
        const currentValue = parseInt(metric.textContent);
        const randomChange = Math.floor(Math.random() * 5) + 1;
        const newValue = currentValue + randomChange;
        metric.textContent = newValue;
        
        // Update the change indicator
        const changeElement = metric.nextElementSibling;
        if (changeElement.classList.contains('metric-change')) {
            changeElement.textContent = `+${randomChange} today`;
        }
    });
}

// Update metrics every 30 seconds
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
    alertElement.classList.add('alert-card');
    alertElement.classList.add(`${randomAlert.type}-alert`);
    
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
    
    alertsContainer.prepend(alertElement);
    
    // Remove the oldest alert if there are more than 5
    if (alertsContainer.children.length > 5) {
        alertsContainer.removeChild(alertsContainer.lastChild);
    }
}

// Add a new alert every 60 seconds
setInterval(addNewAlert, 60000);

// Initialize map village interactions
document.querySelectorAll('.village').forEach(village => {
    village.addEventListener('click', () => {
        const villageName = village.textContent;
        const riskLevel = village.classList.contains('low-risk') ? 'low risk' : 
                         village.classList.contains('moderate-risk') ? 'moderate risk' : 'high risk';
        
        alert(`${villageName} is currently at ${riskLevel} level for water-borne diseases.`);
    });
});

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});