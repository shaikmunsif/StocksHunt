import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { CategoryStore } from '../../store/category.store';
import { Category } from '../../interfaces/stock-data.interface';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private databaseService = inject(DatabaseService);
  readonly categoryStore = inject(CategoryStore);

  // UI state
  isAddingCategory = signal(false);
  editingCategoryId = signal<number | null>(null);
  newCategoryName = signal('');
  editCategoryName = signal('');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async ngOnInit() {
    await this.loadCategories();
  }

  async loadCategories() {
    try {
      this.isLoading.set(true);
      this.categoryStore.setLoading(true);
      const categories = await this.databaseService.getCategories();
      this.categoryStore.setCategories(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.errorMessage.set('Failed to load categories');
      this.categoryStore.setError('Failed to load categories');
    } finally {
      this.isLoading.set(false);
      this.categoryStore.setLoading(false);
    }
  }

  startAddCategory() {
    this.isAddingCategory.set(true);
    this.newCategoryName.set('');
    this.errorMessage.set(null);
  }

  cancelAddCategory() {
    this.isAddingCategory.set(false);
    this.newCategoryName.set('');
  }

  async addCategory() {
    const name = this.newCategoryName().trim();
    if (!name) {
      this.errorMessage.set('Category name cannot be empty');
      return;
    }

    try {
      const category = await this.databaseService.getOrCreateDefaultCategory(name);
      this.categoryStore.addCategory(category);
      this.isAddingCategory.set(false);
      this.newCategoryName.set('');
      this.showSuccess('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      this.errorMessage.set('Failed to add category');
    }
  }

  startEditCategory(category: Category) {
    this.editingCategoryId.set(category.id);
    this.editCategoryName.set(category.name);
    this.errorMessage.set(null);
  }

  cancelEditCategory() {
    this.editingCategoryId.set(null);
    this.editCategoryName.set('');
  }

  async updateCategory(category: Category) {
    const newName = this.editCategoryName().trim();
    if (!newName) {
      this.errorMessage.set('Category name cannot be empty');
      return;
    }

    if (newName === category.name) {
      this.cancelEditCategory();
      return;
    }

    try {
      await this.databaseService.updateCategory(category.id, { name: newName });
      this.categoryStore.updateCategory(category.id, { name: newName });
      this.editingCategoryId.set(null);
      this.showSuccess('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      this.errorMessage.set('Failed to update category');
    }
  }

  async deleteCategory(category: Category) {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await this.databaseService.deleteCategory(category.id);
      this.categoryStore.removeCategory(category.id);
      this.showSuccess('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      this.errorMessage.set('Failed to delete category. It may be in use by companies.');
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(null), 3000);
  }
}
