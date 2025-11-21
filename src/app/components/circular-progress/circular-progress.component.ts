import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './circular-progress.component.html',
  styleUrl: './circular-progress.component.scss',
})
export class CircularProgressComponent {
  @Input() progress: number = 0;
  @Input() message: string = '';
  
  readonly radius = 40;
  readonly svgSize = 96; // 24 * 4 (w-24 h-24 in Tailwind)
  readonly circumference = 2 * Math.PI * this.radius;
  
  get centerPosition(): number {
    return this.svgSize / 2;
  }
  
  get strokeDashoffset(): number {
    return this.circumference - (this.circumference * this.progress / 100);
  }
}
