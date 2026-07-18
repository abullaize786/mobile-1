// Service Worker Registration Script
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Prevent zoom on input focus (mobile optimization)
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, false);

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Detect if running as PWA (standalone)
if (window.navigator.standalone === true) {
    document.documentElement.classList.add('standalone-app');

    // Handle navigation for standalone apps
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="/"]');
        if (link && link.target !== '_blank') {
            e.preventDefault();
            window.location.href = link.href;
        }
    });
}

// Prevent overscroll bounce on iOS
document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.scrollable')) {
        return;
    }
    e.preventDefault();
}, { passive: false });

// Handle viewport height changes (mobile address bar)
function updateVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', updateVH);
updateVH();

// Track if app is installed
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    // Show install button or banner here if needed
});

window.addEventListener('appinstalled', () => {
    console.log('AgriRide app installed successfully');
    localStorage.setItem('agriride_app_installed', 'true');
});

// Mobile-specific optimizations
if (matchMedia('(hover: none) and (pointer: coarse)').matches) {
    // Touch device - remove hover effects
    document.documentElement.classList.add('touch-device');

    // Add active state styling
    document.addEventListener('touchstart', function(e) {
        const target = e.target.closest('button, a, [role="button"]');
        if (target) {
            target.classList.add('active');
        }
    });

    document.addEventListener('touchend', function(e) {
        const target = e.target.closest('button, a, [role="button"]');
        if (target) {
            target.classList.remove('active');
        }
    });
}

// Optimize for slow connections
if (navigator.connection && navigator.connection.effectiveType === '4g') {
    document.documentElement.classList.add('slow-network');
}

// Monitor connection changes
if (navigator.connection) {
    navigator.connection.addEventListener('change', () => {
        const effectiveType = navigator.connection.effectiveType;
        document.documentElement.classList.remove('slow-network', 'fast-network');

        if (effectiveType === '4g') {
            document.documentElement.classList.add('slow-network');
        } else {
            document.documentElement.classList.add('fast-network');
        }
    });
}

// Handle app visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // App is backgrounded
        console.log('App backgrounded');
    } else {
        // App is foregrounded
        console.log('App foregrounded');
    }
});