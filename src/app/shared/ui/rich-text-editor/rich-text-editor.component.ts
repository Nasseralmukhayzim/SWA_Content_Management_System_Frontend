import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const tinymce: any;

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  template: `
    <div class="rich-text-editor-container">
      <textarea #editorArea></textarea>
    </div>
  `,
  styles: [
    `
      .rich-text-editor-container {
        width: 100%;
        margin-top: 6px;
        margin-bottom: 16px;
      }
      .tox-tinymce {
        border-radius: 8px !important;
        border: 1px solid rgba(0, 0, 0, 0.23) !important;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorArea', { static: true }) editorArea!: ElementRef<HTMLTextAreaElement>;
  @Input() height = 320;
  @Input() dir: 'ltr' | 'rtl' | 'auto' = 'auto';

  private editorInstance: any = null;
  private value = '';
  private isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.loadTinyMCEScript()
      .then(() => this.initEditor())
      .catch(() => {});
  }

  ngOnDestroy(): void {
    if (this.editorInstance) {
      try {
        this.editorInstance.destroy();
      } catch {}
      this.editorInstance = null;
    }
  }

  private loadTinyMCEScript(): Promise<void> {
    if (typeof tinymce !== 'undefined') {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('tinymce-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'tinymce-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.6.0/tinymce.min.js';
      script.referrerPolicy = 'origin';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  private initEditor(): void {
    if (typeof tinymce === 'undefined') return;

    const element = this.editorArea.nativeElement;
    const randomId = 'editor_' + Math.random().toString(36).substring(2, 9);
    element.id = randomId;

    const direction = this.dir === 'auto' ? undefined : this.dir;

    tinymce.init({
      target: element,
      height: this.height,
      menubar: false,
      directionality: direction,
      plugins: [
        'advlist',
        'autolink',
        'lists',
        'link',
        'image',
        'charmap',
        'preview',
        'anchor',
        'searchreplace',
        'visualblocks',
        'code',
        'fullscreen',
        'insertdatetime',
        'media',
        'table',
        'directionality',
        'wordcount',
      ],
      toolbar:
        'undo redo | code | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | ltr rtl | numlist bullist | table link image media | removeformat fullscreen',
      // 'wrap' instead of the default 'floating': the toolbar has too many groups to fit one row
      // at this editor's typical rendered width, and the default mode hides the overflow behind a
      // "⋯" button whose drawer can itself run out of room and clip trailing groups — burying
      // "code" (the HTML source view) behind a click that doesn't reliably reveal it. Wrapping
      // onto as many rows as needed keeps every button, including source view, always visible.
      toolbar_mode: 'wrap',
      content_style: 'body { font-family: Roboto, Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
      promotion: false,
      branding: false,
      setup: (editor: any) => {
        this.editorInstance = editor;
        editor.on('init', () => {
          if (this.value) {
            editor.setContent(this.value);
          }
          if (this.isDisabled) {
            editor.mode.set('readonly');
          }
        });
        // Deliberately NOT listening to 'SetContent' here: TinyMCE fires it internally during
        // its own bootstrap (before 'init', with an empty document), and listening to it would
        // overwrite the value buffered by writeValue() with that empty bootstrap content before
        // the 'init' handler above ever gets a chance to apply it.
        editor.on('change keyup undo redo input ExecCommand', () => {
          const content = editor.getContent();
          this.value = content;
          this.onChange(content);
        });
        editor.on('blur', () => {
          this.onTouched();
        });
        editor.on('focus click', () => {
          if (!this.isDisabled && editor.mode && editor.mode.get() !== 'design') {
            try {
              editor.mode.set('design');
            } catch {}
          }
        });
      },
    });
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.editorInstance) {
      if (this.editorInstance.initialized) {
        this.editorInstance.setContent(this.value);
      } else {
        this.editorInstance.on('init', () => {
          this.editorInstance.setContent(this.value);
        });
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (this.editorInstance && this.editorInstance.initialized) {
      try {
        this.editorInstance.mode.set(isDisabled ? 'readonly' : 'design');
      } catch {}
    }
  }
}
