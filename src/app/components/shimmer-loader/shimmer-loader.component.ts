import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-shimmer-loader',
  standalone: true,
  imports: [],
  templateUrl: './shimmer-loader.component.html',
  styleUrl: './shimmer-loader.component.scss',
})
export class ShimmerLoaderComponent implements OnChanges {
  @Input() type: 'table' | 'card' | 'text' | 'full-page' = 'card';
  @Input() rows: number = 5;
  @Input() columns: number = 7;
  @Input() showHeader: boolean = true;

  rowArray: number[] = [];
  columnArray: number[] = [];

  ngOnChanges(): void {
    this.rowArray = Array(this.rows).fill(0);
    this.columnArray = Array(this.columns).fill(0);
  }
}
