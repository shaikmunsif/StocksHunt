import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-circular-progress',
  templateUrl: './circular-progress.component.html',
  styleUrl: './circular-progress.component.scss',
})
export class CircularProgressComponent {
  @Input() progress: number = 0;
  @Input() message: string = '';
  
  readonly radius = 54;
  readonly circumference = 2 * Math.PI * this.radius;
  
  get strokeDashoffset(): number {
    return this.circumference - (this.circumference * this.progress / 100);
  }
}
