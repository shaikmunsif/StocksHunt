import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shimmer-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shimmer-loader.component.html',
  styleUrl: './shimmer-loader.component.scss',
})
export class ShimmerLoaderComponent implements OnChanges {
  @Input() type: 'table' | 'card' | 'text' | 'full-page' = 'card';
  @Input() rows: number = 5;
  @Input() showHeader: boolean = true;

  rowArray: number[] = [];

  ngOnChanges(): void {
    this.rowArray = Array(this.rows).fill(0);
  }
}
