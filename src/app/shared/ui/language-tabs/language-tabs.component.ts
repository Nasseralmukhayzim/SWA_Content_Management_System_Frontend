import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChildren, QueryList, TemplateRef, input, model } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { LanguageTabDirective } from './language-tab.directive';

export interface LanguageOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-language-tabs',
  imports: [MatTabsModule, NgTemplateOutlet],
  templateUrl: './language-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageTabsComponent {
  readonly languages = input.required<LanguageOption[]>();
  readonly selectedIndex = model(0);

  @ContentChildren(LanguageTabDirective) tabs?: QueryList<LanguageTabDirective>;

  templateFor(code: string): TemplateRef<unknown> | null {
    return this.tabs?.find((tab) => tab.language === code)?.templateRef ?? null;
  }
}
