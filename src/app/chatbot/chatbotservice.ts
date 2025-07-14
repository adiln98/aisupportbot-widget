// chatbotservice.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger';

// Constants
const JWT_PARTS_COUNT = 3;
const JWT_PAYLOAD_INDEX = 1;
const CONVERSATION_ID_PREFIX = 'conv_';

interface ChatQueryPayload {
  query: string;
  n_results: number;
  conversation_id: string | null;
  access_token: string | null;
  page_context: string | null;
  user_id: string | null;
}

interface BotResponse {
  answer: string;
  follow_up_questions?: string[];
  conversation_id?: string;
  data_types_used?: string[];
  docs?: any;
}

interface DecodedToken {
  username?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send query to chatbot API
   * @param userQuery - The user's message
   * @param pageContext - The current page context
   * @param accessToken - The JWT access token for authentication
   * @returns Observable of bot response
   */
  queryBot(userQuery: string, pageContext: string | null = null, accessToken: string | null = null): Observable<BotResponse> {
    // Input validation
    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length === 0) {
      return throwError(() => new Error('Invalid user query provided'));
    }

    // Log token status
    if (!accessToken) {
      Logger.warn('No access token provided - proceeding without authentication');
    }

    // Log page context status
    if (!pageContext) {
      Logger.warn('No page context provided - proceeding without context');
    }

    // Generate conversation ID from token
    const conversationId = this.getConversationIdFromToken(accessToken);
    
    // Extract username from token to use as user ID
    const userId = this.getUsernameFromToken(accessToken);
    
    const payload: ChatQueryPayload = {
      query: userQuery.trim(),
      n_results: 5, // Default value
      conversation_id: conversationId,
      access_token: accessToken,
      page_context: pageContext,
      user_id: userId
    };

    Logger.log('Sending chatbot query with payload:', {
      query: payload.query,
      conversation_id: payload.conversation_id,
      page_context: payload.page_context,
      user_id: payload.user_id,
      has_token: !!payload.access_token
    });
    
    return this.http.post<BotResponse>(this.apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      retry(environment.retryAttempts),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Decode JWT token and extract payload
   * @param accessToken - The JWT token to decode
   * @returns Decoded token payload or null if invalid
   */
  private decodeToken(accessToken: string): DecodedToken | null {
    if (!accessToken || typeof accessToken !== 'string') {
      Logger.warn('Invalid access token provided');
      return null;
    }

    try {
      const parts = accessToken.split('.');
      
      if (parts.length !== JWT_PARTS_COUNT) {
        Logger.error('Invalid JWT token format: expected 3 parts');
        return null;
      }

      const payload = parts[JWT_PAYLOAD_INDEX];
      const decodedPayload = JSON.parse(atob(payload));
      
      Logger.debug('Successfully decoded token payload');
      return decodedPayload;
    } catch (error) {
      Logger.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Extract username from decoded token
   * @param decodedToken - The decoded JWT token payload
   * @returns Username string or null if not found
   */
  private extractUsername(decodedToken: DecodedToken): string | null {
    if (!decodedToken || typeof decodedToken !== 'object') {
      Logger.warn('Invalid decoded token provided');
      return null;
    }

    const username = decodedToken.username;
    
    if (!username || typeof username !== 'string') {
      Logger.warn('No valid username found in token');
      return null;
    }

    Logger.debug('Successfully extracted username:', username);
    return username;
  }

  /**
   * Generate conversation ID in format: conv_YYYYMMDD_HHMMSS_username
   * @param username - The username to include in the conversation ID
   * @returns Formatted conversation ID string
   */
  private generateConversationId(username: string): string {
    if (!username || typeof username !== 'string') {
      throw new Error('Invalid username provided for conversation ID generation');
    }

    const now = new Date();
    
    // Format: YYYYMMDD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Format: HHMMSS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}${minutes}${seconds}`;
    
    const conversationId = `${CONVERSATION_ID_PREFIX}${dateString}_${timeString}_${username}`;
    
    Logger.debug('Generated conversation ID:', conversationId);
    return conversationId;
  }

  /**
   * Get conversation ID from JWT token
   * @param accessToken - The JWT access token
   * @returns Generated conversation ID or null if token is invalid
   */
  private getConversationIdFromToken(accessToken: string | null): string | null {
    if (!accessToken) {
      Logger.debug('No access token provided for conversation ID generation');
      return null;
    }

    const decodedToken = this.decodeToken(accessToken);
    if (!decodedToken) {
      Logger.warn('Failed to decode token for conversation ID generation');
      return null;
    }

    const username = this.extractUsername(decodedToken);
    if (!username) {
      Logger.warn('No username found in token for conversation ID generation');
      return null;
    }

    try {
      return this.generateConversationId(username);
    } catch (error) {
      Logger.error('Error generating conversation ID:', error);
      return null;
    }
  }

  /**
   * Get username from JWT token
   * @param accessToken - The JWT access token
   * @returns Username string or null if token is invalid
   */
  private getUsernameFromToken(accessToken: string | null): string | null {
    if (!accessToken) {
      Logger.debug('No access token provided for username extraction');
      return null;
    }

    const decodedToken = this.decodeToken(accessToken);
    if (!decodedToken) {
      Logger.warn('Failed to decode token for username extraction');
      return null;
    }

    const username = this.extractUsername(decodedToken);
    if (!username) {
      Logger.warn('No username found in token');
      return null;
    }

    Logger.debug('Successfully extracted username:', username);
    return username;
  }

  /**
   * Validate backend connection
   * @returns Observable of validation response
   */
  validateConnection(): Observable<any> {
    const testPayload: ChatQueryPayload = {
      query: 'test',
      n_results: 1,
      conversation_id: null,
      access_token: null,
      page_context: null,
      user_id: null
    };

    Logger.log('Validating backend connection...');
    
    return this.http.post<any>(this.apiUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   * @returns Observable that throws the error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    
    Logger.error('HTTP error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
