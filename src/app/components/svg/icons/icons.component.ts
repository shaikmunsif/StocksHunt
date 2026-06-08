import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icons.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./icons.component.scss'],
})
export class IconsComponent {
  iconName = input<string>('');
  width = input<string>('24');
  height = input<string>('24');
  className = input<string>('');
}
