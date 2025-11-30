import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icons.component.html',
  styleUrls: ['./icons.component.scss'],
})
export class IconsComponent {
  iconName = input<string>('');
  width = input<string>('24');
  height = input<string>('24');
  className = input<string>('');
}
