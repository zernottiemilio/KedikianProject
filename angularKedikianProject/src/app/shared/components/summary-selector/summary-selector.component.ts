import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummarySelectorConfig {
  columnKey: string;
  label: string;
  format: 'number' | 'currency' | 'custom';
  decimalPlaces?: number;
  suffix?: string;
  prefix?: string;
}

@Component({
  selector: 'app-summary-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-selector.component.html',
  styleUrls: ['./summary-selector.component.css']
})
export class SummarySelectorComponent<T> implements OnChanges {
  @Input() items: T[] = [];
  @Input() selectedItems: Set<any> = new Set();
  @Input() config: SummarySelectorConfig = {
    columnKey: 'value',
    label: 'Total',
    format: 'number',
    decimalPlaces: 2
  };
  @Input() idKey: string = 'id';

  @Output() selectionChanged = new EventEmitter<Set<any>>();
  @Output() clearSelection = new EventEmitter<void>();

  totalValue: number = 0;
  selectedCount: number = 0;
  allSelected: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['selectedItems']) {
      this.calculateTotal();
      this.updateAllSelectedState();
    }
  }

  calculateTotal(): void {
    this.totalValue = 0;
    this.selectedCount = this.selectedItems.size;

    this.items.forEach(item => {
      const itemId = (item as any)[this.idKey];
      if (this.selectedItems.has(itemId)) {
        const value = (item as any)[this.config.columnKey];
        if (value !== null && value !== undefined && !isNaN(Number(value))) {
          this.totalValue += Number(value);
        }
      }
    });
  }

  updateAllSelectedState(): void {
    this.allSelected = this.items.length > 0 &&
                       this.items.every(item => this.selectedItems.has((item as any)[this.idKey]));
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedItems.clear();
    } else {
      this.items.forEach(item => {
        this.selectedItems.add((item as any)[this.idKey]);
      });
    }
    this.allSelected = !this.allSelected;
    this.calculateTotal();
    this.selectionChanged.emit(this.selectedItems);
  }

  onClearSelection(): void {
    this.selectedItems.clear();
    this.allSelected = false;
    this.calculateTotal();
    this.clearSelection.emit();
    this.selectionChanged.emit(this.selectedItems);
  }

  get formattedTotal(): string {
    const value = this.totalValue;
    const decimals = this.config.decimalPlaces ?? 2;

    switch (this.config.format) {
      case 'currency':
        return `$${value.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

      case 'number':
        const formatted = value.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        const prefix = this.config.prefix || '';
        const suffix = this.config.suffix || '';
        return `${prefix}${formatted} ${suffix}`.trim();

      case 'custom':
        return `${this.config.prefix || ''}${value.toFixed(decimals)}${this.config.suffix || ''}`;

      default:
        return value.toFixed(decimals);
    }
  }

  get hasSelection(): boolean {
    return this.selectedItems.size > 0;
  }

  get hasItems(): boolean {
    return this.items.length > 0;
  }
}
