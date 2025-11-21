// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Download extension function
async function downloadExtension() {
    try {
        // Télécharger directement le ZIP
        window.location.href = '/download-extension';
        
        // Afficher un message de confirmation puis le tutoriel
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div>
                        <div style="font-weight: 600;">Download Started!</div>
                        <div style="font-size: 0.875rem; opacity: 0.9;">Check your downloads folder</div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
            
            // Afficher le tutoriel après 1 seconde
            setTimeout(() => {
                showInstallationModal();
            }, 1000);
        }, 500);
        
    } catch (error) {
        console.error('Download failed:', error);
        showInstallationModal();
    }
}

function showInstallationModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border-radius: 24px;
        padding: 50px;
        max-width: 700px;
        border: 2px solid rgba(102, 126, 234, 0.3);
        box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        animation: slideUp 0.4s ease;
    `;
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin-bottom: 20px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                    <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                    <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            </div>
            <h2 style="margin: 0; font-size: 2.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Installation Guide</h2>
            <p style="color: #86868b; margin-top: 10px; font-size: 1.1rem;">Follow these simple steps to get started</p>
        </div>
        
        <div class="tutorial-step" style="margin-bottom: 30px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-left: 4px solid #667eea; border-radius: 12px; animation: slideInLeft 0.5s ease 0.1s both;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 1.3rem;">📦 Extract the ZIP File</h3>
                    <p style="color: #d1d1d6; line-height: 1.6; margin: 0;">
                        Locate <strong style="color: white;">taskflow-extension.zip</strong> in your downloads folder and extract it to a location you'll remember (e.g., Desktop or Documents).
                    </p>
                </div>
            </div>
        </div>
        
        <div class="tutorial-step" style="margin-bottom: 30px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-left: 4px solid #764ba2; border-radius: 12px; animation: slideInLeft 0.5s ease 0.2s both;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="background: #764ba2; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #764ba2; font-size: 1.3rem;">🌐 Open Chrome Extensions</h3>
                    <p style="color: #d1d1d6; line-height: 1.6; margin: 0 0 10px 0;">
                        In Chrome, navigate to:
                    </p>
                    <code style="display: block; background: rgba(0,0,0,0.4); padding: 12px 16px; border-radius: 8px; color: #667eea; font-size: 1rem; letter-spacing: 0.5px;">chrome://extensions</code>
                    <p style="color: #86868b; margin: 10px 0 0 0; font-size: 0.9rem;">Or: Menu (⋮) → Extensions → Manage Extensions</p>
                </div>
            </div>
        </div>
        
        <div class="tutorial-step" style="margin-bottom: 30px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-left: 4px solid #667eea; border-radius: 12px; animation: slideInLeft 0.5s ease 0.3s both;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 1.3rem;">⚙️ Enable Developer Mode</h3>
                    <p style="color: #d1d1d6; line-height: 1.6; margin: 0;">
                        Toggle the <strong style="color: white;">"Developer mode"</strong> switch in the top-right corner of the page.
                    </p>
                </div>
            </div>
        </div>
        
        <div class="tutorial-step" style="margin-bottom: 30px; padding: 20px; background: rgba(102, 126, 234, 0.1); border-left: 4px solid #764ba2; border-radius: 12px; animation: slideInLeft 0.5s ease 0.4s both;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="background: #764ba2; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #764ba2; font-size: 1.3rem;">📂 Load Extension</h3>
                    <p style="color: #d1d1d6; line-height: 1.6; margin: 0;">
                        Click <strong style="color: white;">"Load unpacked"</strong> and select the extracted <strong style="color: white;">taskflow-extension</strong> folder.
                    </p>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; margin-bottom: 20px; animation: fadeIn 0.5s ease 0.6s both;">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎉</div>
            <p style="color: #10b981; font-weight: 600; margin: 0; font-size: 1.1rem;">You're all set! The extension is now active.</p>
        </div>
        
        <button id="closeBtn" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: 600;
            width: 100%;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)';">
            Got it, let's go! 🚀
        </button>
    `;
    
    // Add animations to style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close button handler
    document.getElementById('closeBtn').addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    });
}

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        nav.style.background = 'rgba(0, 0, 0, 0.8)';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
