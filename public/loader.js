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
    iframe.src = 'http://localhost:3000/browser/';
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
            }, 'http://localhost:3000');
        }
    }

    // Send context after iframe loads
    iframe.addEventListener('load', sendPageContext);

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