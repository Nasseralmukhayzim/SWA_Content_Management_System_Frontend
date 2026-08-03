import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ITEM_LABELS,
  PageSection,
  PageSectionItem,
  SECTION_KIND_OPTIONS,
  SectionKind,
  emptyItem,
  emptySection,
} from '../../models/page-section.model';

/**
 * Editor for a Page's ordered `sections` field. Exposes a plain `PageSection[]` via
 * ControlValueAccessor (same contract as RichTextEditorComponent) so the outer form still
 * holds one FormControl for this field — the add/remove/reorder state lives entirely inside
 * this component rather than requiring a FormArray-aware outer form.
 */
@Component({
  selector: 'app-section-list-field',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './section-list-field.component.html',
  styleUrl: './section-list-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SectionListFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionListFieldComponent implements ControlValueAccessor {
  @Input() dir: 'ltr' | 'rtl' = 'ltr';

  protected readonly sections = signal<PageSection[]>([]);
  protected readonly kindOptions = SECTION_KIND_OPTIONS;
  protected readonly newSectionKind = signal<SectionKind>('Text');

  private isDisabled = false;
  private onChange: (value: PageSection[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: PageSection[] | null): void {
    this.sections.set((value ?? []).map((section) => ({ ...section, items: [...(section.items ?? [])] })));
  }

  registerOnChange(fn: (value: PageSection[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected labelsFor(kind: SectionKind) {
    return ITEM_LABELS[kind];
  }

  protected addSection(): void {
    this.mutate((sections) => [...sections, emptySection(this.newSectionKind())]);
  }

  protected removeSection(index: number): void {
    this.mutate((sections) => sections.filter((_, i) => i !== index));
  }

  protected moveSection(index: number, offset: -1 | 1): void {
    this.mutate((sections) => moved(sections, index, offset));
  }

  protected updateSection(index: number, patch: Partial<PageSection>): void {
    this.mutate((sections) => sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  protected addItem(sectionIndex: number): void {
    this.mutate((sections) =>
      sections.map((section, i) => (i === sectionIndex ? { ...section, items: [...section.items, emptyItem()] } : section)),
    );
  }

  protected removeItem(sectionIndex: number, itemIndex: number): void {
    this.mutate((sections) =>
      sections.map((section, i) =>
        i === sectionIndex ? { ...section, items: section.items.filter((_, j) => j !== itemIndex) } : section,
      ),
    );
  }

  protected moveItem(sectionIndex: number, itemIndex: number, offset: -1 | 1): void {
    this.mutate((sections) =>
      sections.map((section, i) => (i === sectionIndex ? { ...section, items: moved(section.items, itemIndex, offset) } : section)),
    );
  }

  protected updateItem(sectionIndex: number, itemIndex: number, patch: Partial<PageSectionItem>): void {
    this.mutate((sections) =>
      sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, items: section.items.map((item, j) => (j === itemIndex ? { ...item, ...patch } : item)) }
          : section,
      ),
    );
  }

  private mutate(update: (sections: PageSection[]) => PageSection[]): void {
    if (this.isDisabled) {
      return;
    }
    const next = update(this.sections());
    this.sections.set(next);
    this.onChange(next);
    this.onTouched();
  }
}

function moved<T>(list: T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
