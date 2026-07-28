import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[appLanguageTab]' })
export class LanguageTabDirective {
  @Input('appLanguageTab') language!: string;

  constructor(readonly templateRef: TemplateRef<unknown>) {}
}
