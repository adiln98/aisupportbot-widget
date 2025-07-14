// Minimal loader to embed the Angular chatbot
(function() {
    'use strict';
    
    // Check if widget already exists
    if (document.getElementById('docnow-chatbot-widget')) {
        return;
    }
    
    // Create iframe to load the Angular app
    const iframe = document.createElement('iframe');
    iframe.id = 'docnow-chatbot-widget';
    // Development URL (commented for reference)
    iframe.src = 'http://localhost:3000/browser/';
    // Production URL of widget
    // iframe.src = 'https://your-chatbot-domain.com/browser/';
    iframe.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 20px;
        width: 400px;
        height: 500px;
        border: none;
        z-index: 1000;
        background: transparent;
    `;
    
    // Add to page
    document.body.appendChild(iframe);

    // Function to send page context to iframe
    function sendPageContext() {
        if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'PAGE_CONTEXT',
                page_context: window.location.pathname
            // Development URL (commented for reference)
            }, 'http://localhost:3000');
            // Production URL of widget
            // }, 'https://your-chatbot-domain.com');
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
                    // Development URL (commented for reference)
                    }, 'http://localhost:3000');
                    // Production URL of widget
                    // }, 'https://your-chatbot-domain.com');
                    console.log('[Loader] Sent accessToken to chatbot');
                }
            }
        }
    }

    // Send context and token after iframe loads
    iframe.addEventListener('load', function() {
        sendPageContext();
        sendAccessToken();
    });

    // SPA navigation support: listen for popstate and override pushState/replaceState
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
    hookHistoryEvents();
    window.addEventListener('locationchange', sendPageContext);

    console.log('DocNow Chatbot loaded');
})(); 