// Minimal loader to embed the Angular chatbot
(function() {
    'use strict';
    
    // ===== CONFIGURATION - CHANGE THESE URLs FOR DIFFERENT ENVIRONMENTS =====
    // Development URLs (ACTIVE)
    const WIDGET_URL = 'http://localhost:3000/browser/';
    const WIDGET_ORIGIN = 'http://localhost:3000';
    
    // Production URLs (COMMENTED OUT)
    // const WIDGET_URL = 'https://widget.doctornow.io/browser/';
    // const WIDGET_ORIGIN = 'https://widget.doctornow.io';
    // ===== END CONFIGURATION =====
    
    // ===== INITIALIZATION =====
    // Check if widget already exists
    if (document.getElementById('docnow-chatbot-widget')) {
        return;
    }
    
    // Create iframe to load the Angular app
    const iframe = document.createElement('iframe');
    iframe.id = 'docnow-chatbot-widget';
    iframe.src = WIDGET_URL;
    iframe.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 88px;
        height: 88px;
        border: none;
        z-index: 1000;
        background: transparent;
        transition: all 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(iframe);
    
    // ===== UTILITY FUNCTIONS =====
    // Function to resize iframe
    function resizeIframe(width, height) {
        iframe.style.width = width + 'px';
        iframe.style.height = height + 'px';
    }

    // Function to send page context to iframe
    function sendPageContext() {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'PAGE_CONTEXT',
                page_context: window.location.pathname
            }, WIDGET_ORIGIN);
        }
    }

    // Function to send access token to iframe
    function sendAccessToken() {
        if (iframe.contentWindow) {
            const tokenStr = localStorage.getItem('token');
            if (tokenStr) {
                const tokenObj = JSON.parse(tokenStr);
                if (tokenObj && tokenObj.accessToken) {
                    iframe.contentWindow.postMessage({
                        type: 'ACCESS_TOKEN',
                        accessToken: tokenObj.accessToken
                    }, WIDGET_ORIGIN);
                    console.log('[Loader] Sent accessToken to chatbot');
                }
            }
        }
    }

    // Function to handle SPA navigation
    function hookHistoryEvents() {
        const origPushState = history.pushState;
        const origReplaceState = history.replaceState;
        history.pushState = function() {
            origPushState.apply(this, arguments);
            window.dispatchEvent(new Event('locationchange'));
        };
        history.replaceState = function() {
            origReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('locationchange'));
        };
        window.addEventListener('popstate', function() {
            window.dispatchEvent(new Event('locationchange'));
        });
    }
    
    // ===== EVENT LISTENERS =====
    // Listen for messages from the widget (TypeScript → JavaScript)
    window.addEventListener('message', function(event) {
        if (event.origin !== WIDGET_ORIGIN) return;
        
        if (event.data.type === 'WIDGET_STATE_CHANGE') {
            const { isOpen, isHovered } = event.data;
            
            if (isOpen) {
                // Widget is open - expand iframe for popup
                // Add extra padding to account for positioning
                resizeIframe(640, 790);
            } else if (isHovered) {
                // Widget is hovered - expand iframe for button hover
                resizeIframe(220, 88);
            } else {
                // Widget is closed - shrink iframe for button only
                resizeIframe(88, 88);
            }
        }
    });

    // Send context and token after iframe loads (JavaScript → TypeScript)
    iframe.addEventListener('load', function() {
        sendPageContext();
        sendAccessToken();
    });

    // Handle SPA navigation changes (JavaScript → TypeScript)
    hookHistoryEvents();
    window.addEventListener('locationchange', sendPageContext);
    
    // ===== INITIALIZATION COMPLETE =====
    console.log('DocNow Chatbot loaded with Smart Sizing');
})(); 