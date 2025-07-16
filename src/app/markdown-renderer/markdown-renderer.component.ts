import { Component, Input, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="markdown-content" [innerHTML]="sanitizedHtml"></div>`,
  styles: [`
    .markdown-content {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  `]
})
export class MarkdownRendererComponent {
  private _content = '';
  sanitizedHtml: SafeHtml = '';

  @Input()
  set content(value: string) {
    this._content = value || '';
    this.renderMarkdown();
  }

  constructor(private sanitizer: DomSanitizer) {
    this.configureMarked();
  }

  private configureMarked(): void {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  private renderMarkdown(): void {
    if (!this._content) {
      this.sanitizedHtml = '';
      return;
    }

    try {
      const rawHtml = marked.parse(this._content) as string;
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, rawHtml) || '';
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(this._content);
    }
  }
}