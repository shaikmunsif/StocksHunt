import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-base-icon',
  standalone: true,
  templateUrl: './base-icon.component.html',
  styleUrls: ['./base-icon.component.scss'],
})
export class BaseIconComponent {
  @Input() iconName: string = '';
  @Input() width: string = '24';
  @Input() height: string = '24';
  @Input() className: string = '';

  svgContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  async ngOnInit() {
    await this.loadSvg();
  }

  private async loadSvg() {
    try {
      const response = await fetch(`/assets/svg/${this.iconName}.svg`);
      const svgText = await response.text();
      this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svgText);
    } catch (error) {
      console.error(`Error loading SVG: ${this.iconName}`, error);
    }
  }
}
