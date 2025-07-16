import { Component, Input, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="markdown-content" [innerHTML]="sanitizedHtml" (click)="handleClick($event)"></div>`,
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
      
      // Process links to add target="_blank" and rel="noopener noreferrer"
      const processedHtml = this.processLinks(rawHtml);
      
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, processedHtml) || '';
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(sanitized);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      this.sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(this._content);
    }
  }

  private processLinks(html: string): string {
    // Add target="_blank" and rel="noopener noreferrer" to all links
    return html.replace(
      /<a\s+href=/gi,
      '<a target="_blank" rel="noopener noreferrer" href='
    );
  }

  handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Check if the clicked element is a link
    if (target.tagName === 'A' || target.closest('a')) {
      event.preventDefault();
      event.stopPropagation();
      
      const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a') as HTMLAnchorElement;
      const href = link.getAttribute('href');
      
      if (href) {
        // Open link in new tab/window
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  }
}