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
  readonly circumference = 2 * Math.PI * this.radius; // Calculate circumference from radius
  
  get strokeDashoffset(): number {
    return this.circumference - (this.circumference * this.progress / 100);
  }
}
