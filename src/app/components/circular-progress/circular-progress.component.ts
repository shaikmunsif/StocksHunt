import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-circular-progress',
  templateUrl: './circular-progress.component.html',
  styleUrl: './circular-progress.component.scss',
})
export class CircularProgressComponent {
  @Input() progress: number = 0;
  @Input() message: string = '';
}
