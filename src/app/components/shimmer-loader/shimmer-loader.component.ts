import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-shimmer-loader',
  standalone: true,
  imports: [],
  templateUrl: './shimmer-loader.component.html',
  styleUrl: './shimmer-loader.component.scss',
})
export class ShimmerLoaderComponent {
  type = input<'table' | 'card' | 'text' | 'full-page'>('card');
  rows = input<number>(5);
  columns = input<number>(7);
  showHeader = input<boolean>(true);

  rowArray = computed(() => Array(this.rows()).fill(0));
  columnArray = computed(() => Array(this.columns()).fill(0));
}
