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
    
    console.log('DocNow Chatbot loaded');
})(); 