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
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 9999;
    `;
    
    // Add to page
    document.body.appendChild(iframe);
    
    console.log('DocNow Chatbot loaded');
})(); 