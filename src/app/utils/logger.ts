import { environment } from '../../environments/environment';

export class Logger {
  static log(message: string, data?: any) {
    if (environment.enableLogging) {
      console.log(`[Chatbot] ${message}`, data);
    }
  }

  static warn(message: string, data?: any) {
    if (environment.enableLogging) {
      console.warn(`[Chatbot] ${message}`, data);
    }
  }

  static error(message: string, error?: any) {
    console.error(`[Chatbot] ${message}`, error);
  }

  static debug(message: string, data?: any) {
    if (environment.enableLogging) {
      console.debug(`[Chatbot] ${message}`, data);
    }
  }
} 