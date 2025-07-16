// component chatbot.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ChatbotService } from './chatbotservice';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger';
import { MarkdownRendererComponent } from '../markdown-renderer/markdown-renderer.component';

// ===== INTERFACES =====
interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

interface BotResponse {
  answer: string;
  follow_up_questions?: string[];
  conversation_id?: string;
  data_types_used?: string[];
  docs?: any;
}

// ===== COMPONENT =====
@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownRendererComponent],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class ChatbotComponent implements OnDestroy {
  // ===== PUBLIC PROPERTIES =====
  showChat = false;
  isClosing = false;
  input = '';
  messages: ChatMessage[] = [
    { sender: 'bot', text: 'Welcome to DocNow! 👋 How can I help you today?', timestamp: new Date() }
  ];
  loading = false;
  documents: any[] = [];

  // ===== PRIVATE PROPERTIES =====
  private pageContext: string | null = window.location.pathname;
  private previousPageContext: string | null = null;
  private accessToken: string | null = null;
  private isInitialized = false;
  private closeTimeout?: number;
  private isHovered = false;
  private hasSearchedDocuments = false;

  // ===== CONSTRUCTOR & INITIALIZATION =====
  constructor(private chatbotService: ChatbotService) {
    // Listen for messages from parent page (JavaScript → TypeScript)
    window.addEventListener('message', (event) => {
      if (event.origin === environment.parentOrigin && event.data) {
        if (event.data.type === 'PAGE_CONTEXT' && typeof event.data.page_context === 'string') {
          const newPageContext = event.data.page_context;
          let processedPageContext = newPageContext;

          if (processedPageContext) {
            processedPageContext = processedPageContext?.slice(1, processedPageContext.length);
          }

          // Check if page context has changed
          if (this.pageContext !== processedPageContext) {
            Logger.log('Page context changed', { from: this.pageContext, to: processedPageContext });
            
            // Store the previous context and update to new context
            this.previousPageContext = this.pageContext;
            this.pageContext = processedPageContext;
            
            // Reset chatbot state for new page context
            this.resetChatbotState();
            
            // Re-run document search with new context
            this.hasSearchedDocuments = false;
            if (this.pageContext) {
              this.searchDocumentsInBackground();
            }
          } else {
            // Same page context, just update if needed
            this.pageContext = processedPageContext;
            
            // Search documents only once when page context is first received
            if (!this.hasSearchedDocuments && this.pageContext) {
              this.hasSearchedDocuments = true;
              this.searchDocumentsInBackground();
            }
          }
        }

        if (event.data.type === 'ACCESS_TOKEN' && event.data.accessToken) {
          this.accessToken = event.data.accessToken;
          Logger.log('Received access token:', this.accessToken ? 'Token received' : 'No token');
        }
      }
    });
  }

  // ===== LIFECYCLE METHODS =====
  ngOnDestroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = undefined;
    }
  }

  // ===== PUBLIC METHODS =====
  // Handle button hover events
  onButtonMouseEnter(): void {
    this.isHovered = true;
    this.notifyParentState();
  }

  onButtonMouseLeave(): void {
    this.isHovered = false;
    this.notifyParentState();
  }

  toggleChat(): void {
    if (!this.showChat && !this.isClosing) {
      this.showChat = true;
      this.isClosing = false;

      // Only initialize messages if this is the first time opening (messages array is empty)
      if (this.messages.length === 0) {
        this.messages = [
          { sender: 'bot', text: 'Hey DocNow! 👋 How can I help you today?', timestamp: new Date() }
        ];
      }

      this.validateInBackground();
      this.notifyParentState();
    } else if (this.showChat && !this.isClosing) {
      this.closeChat();
    }
  }

  sendMessage(): void {
    const userMsg = this.input.trim();
    if (!userMsg) return;

    if (!this.isInitialized) {
      Logger.warn('Chatbot not initialized, attempting to validate...');
      this.validateInBackground();
    }

    this.messages.push({
      sender: 'user',
      text: userMsg,
      timestamp: new Date()
    });
    this.input = '';
    this.loading = true;

    Logger.log('Using access token:', this.accessToken ? 'Token available' : 'No token');

    this.chatbotService.queryBot(userMsg, this.getPageContext(), this.accessToken).subscribe({
      next: (response: BotResponse) => {
        this.messages.push({
          sender: 'bot',
          text: response.answer,
          timestamp: new Date()
        });
        Logger.log('Chatbot Response', response);
        this.loading = false;
      },
      error: (error: any) => {
        this.handleError(error);
        Logger.error('Error Details', {
          status: error?.status,
          message: error?.message,
          url: error?.url
        });
      }
    });
  }

  // ===== PRIVATE METHODS =====
  // Notify parent page of widget state (TypeScript → JavaScript)
  private notifyParentState(): void {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'WIDGET_STATE_CHANGE',
          isOpen: this.showChat,
          isHovered: this.isHovered
        }, '*');
      }
    } catch (error) {
      Logger.error('Failed to notify parent of state change:', error);
    }
  }

  private closeChat(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.isClosing = true;

    this.closeTimeout = window.setTimeout(() => {
      this.showChat = false;
      this.isClosing = false;
      this.closeTimeout = undefined;
      this.notifyParentState();
    }, 150);
  }

  private async validateInBackground(): Promise<void> {
    try {
      Logger.log('Validating backend connection in background...');

      if (!this.pageContext && !this.accessToken) {
        Logger.warn('No page context or token available');
      }

      const testResponse = await firstValueFrom(this.chatbotService.validateConnection());

      if (testResponse) {
        Logger.log('Backend connection validated successfully');
        this.isInitialized = true;
      }
    } catch (error) {
      Logger.error('Failed to validate chatbot:', error);
    }
  }

    private async searchDocumentsInBackground(): Promise<void> {
    try {
      Logger.log('Searching documents in background...');

      // Add loading message
      const loadingMessageIndex = this.addLoadingMessage();

      // Convert page context to keywords array
      let keywords: string[] = [];
      if (this.pageContext) {
        // If page context contains '/', split it into an array of keywords
        if (this.pageContext.includes('/')) {
          keywords = this.pageContext.split('/').filter(keyword => keyword.trim() !== '');
        } else {
          // If no '/' found, use the entire page context as a single keyword
          keywords = [this.pageContext];
        }
      }

      const documentsResponse = await firstValueFrom(this.chatbotService.searchDocumentsByKeywords(keywords, this.accessToken));

      // Remove loading message
      this.removeLoadingMessage(loadingMessageIndex);

      if (documentsResponse) {
        Logger.log('Documents search completed successfully:', documentsResponse);

        // Store the documents
        this.documents = documentsResponse;

        // Add a message to the chat with the documents data
        this.addDocumentsMessage(documentsResponse);
      }
    } catch (error) {
      Logger.error('Failed to search documents:', error);
      // Remove loading message on error too
      this.removeLoadingMessage();
    }
  }

    private handleError(error: any): void {
    this.loading = false;
    this.messages.push({
      sender: 'bot',
      text: 'Sorry, something went wrong. Please try again.',
      timestamp: new Date()
    });
    Logger.error('Chatbot Error:', error);
  }

  private addLoadingMessage(): number {
    const loadingMessage = {
      sender: 'bot' as const,
      text: 'Loading resources...',
      timestamp: new Date(),
      isLoading: true
    };

    this.messages.push(loadingMessage);
    return this.messages.length - 1; // Return the index of the loading message
  }

  private removeLoadingMessage(loadingMessageIndex?: number): void {
    if (loadingMessageIndex !== undefined && loadingMessageIndex >= 0 && loadingMessageIndex < this.messages.length) {
      // Remove the specific loading message by index
      this.messages.splice(loadingMessageIndex, 1);
    } else {
      // Remove any loading message if index not provided
      this.messages = this.messages.filter(message => !(message as any).isLoading);
    }
  }

  private addDocumentsMessage(documentsData: any): void {
    let messageText = '';

    if (Array.isArray(documentsData) && documentsData.length > 0) {
      messageText = '📄 **Documents Found:**\n\n';
      documentsData.forEach((doc: any, index: number) => {
        messageText += `**${index + 1}. ${doc.filename || doc.name || 'Untitled Document'}**\n`;
        if (doc.description) {
          messageText += `${doc.description}\n`;
        }
        if (doc.link) {
          messageText += `🔗 [View Document](${doc.link})\n`;
        }
        if (doc.tags && Array.isArray(doc.tags)) {
          messageText += `🏷️ Tags: ${doc.tags.join(', ')}\n`;
        }
        messageText += '\n';
      });
    } else if (typeof documentsData === 'object' && documentsData.documents) {
      // Handle case where response has a documents property
      const docs = documentsData.documents;
      if (Array.isArray(docs) && docs.length > 0) {
        messageText = '📄 **Documents Found:**\n\n';
        docs.forEach((doc: any, index: number) => {
          messageText += `**${index + 1}. ${doc.filename || doc.name || 'Untitled Document'}**\n`;
          if (doc.description) {
            messageText += `${doc.description}\n`;
          }
          if (doc.link) {
            messageText += `🔗 [View Document](${doc.link})\n`;
          }
          if (doc.tags && Array.isArray(doc.tags)) {
            messageText += `🏷️ Tags: ${doc.tags.join(', ')}\n`;
          }
          messageText += '\n';
        });
      } else {
        messageText = '📄 No documents found.';
      }
    } else {
      messageText = '📄 No documents found.';
    }

    // Add the message to the chat
    this.messages.push({
      sender: 'bot',
      text: messageText,
      timestamp: new Date()
    });
  }

  // ===== UTILITY METHODS =====
  getPageContext(): string | null {
    return this.pageContext;
  }

  private resetChatbotState(): void {
    // Reset chat messages to initial state
    this.messages = [
      { sender: 'bot', text: 'Welcome to DocNow! 👋 How can I help you today?', timestamp: new Date() }
    ];
    
    // Reset loading state and clear documents
    this.loading = false;
    this.documents = [];
    
    // Reset search flag to allow new search
    this.hasSearchedDocuments = false;
    
    // Reset initialization flag to re-validate with new context
    this.isInitialized = false;
    
    // Clear any pending input
    this.input = '';
    
    Logger.log('Chatbot state reset for new page context');
  }
}
