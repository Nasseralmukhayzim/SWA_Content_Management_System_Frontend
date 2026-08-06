import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../../../core/services/auth.service';
import { ContentStatus } from '../../models/content-status.model';
import { WorkflowActionsComponent } from './workflow-actions.component';

function setup(
  status: ContentStatus,
  roles: string[],
  hasAllTranslations = true,
): ComponentFixture<WorkflowActionsComponent> {
  TestBed.configureTestingModule({
    imports: [WorkflowActionsComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: AuthService,
        useValue: {
          hasRole: (role: string) => roles.includes(role),
          hasAnyRole: (...candidates: string[]) => candidates.some((role) => roles.includes(role)),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(WorkflowActionsComponent);
  fixture.componentRef.setInput('status', status);
  fixture.componentRef.setInput('hasAllTranslations', hasAllTranslations);
  fixture.componentRef.setInput('basePath', 'pages');
  fixture.componentRef.setInput('id', 'page-1');
  return fixture;
}

function buttons(fixture: ComponentFixture<WorkflowActionsComponent>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

function labels(fixture: ComponentFixture<WorkflowActionsComponent>): string[] {
  return buttons(fixture).map((b) => b.textContent!.trim());
}

describe('WorkflowActionsComponent', () => {
  it('renders exactly the actions allowed from Draft (submit, and archive — Draft is a valid archive source too)', async () => {
    const fixture = setup(ContentStatus.Draft, ['Writer']);
    await fixture.whenStable();
    expect(labels(fixture)).toEqual(['Submit for review', 'Archive']);
  });

  it('renders exactly the actions allowed from InReview', async () => {
    const fixture = setup(ContentStatus.InReview, ['Reviewer']);
    await fixture.whenStable();
    expect(labels(fixture)).toEqual(['Approve', 'Request changes']);
  });

  it('renders exactly the actions allowed from Approved (request-changes, publish, archive)', async () => {
    const fixture = setup(ContentStatus.Approved, ['Publisher', 'Reviewer']);
    await fixture.whenStable();
    expect(labels(fixture)).toEqual(['Request changes', 'Publish', 'Archive']);
  });

  it('renders exactly the actions allowed from Published', async () => {
    const fixture = setup(ContentStatus.Published, ['Publisher']);
    await fixture.whenStable();
    expect(labels(fixture)).toEqual(['Unpublish', 'Archive']);
  });

  it('renders exactly the actions allowed from Archived', async () => {
    const fixture = setup(ContentStatus.Archived, ['Publisher']);
    await fixture.whenStable();
    expect(labels(fixture)).toEqual(['Restore']);
  });

  it('disables the action button when the current user lacks the required role', async () => {
    const fixture = setup(ContentStatus.Draft, ['Reviewer']);
    await fixture.whenStable();
    expect(buttons(fixture)[0].disabled).toBe(true);
  });

  it('enables the action button when the current user has the required role', async () => {
    const fixture = setup(ContentStatus.Draft, ['Writer']);
    await fixture.whenStable();
    expect(buttons(fixture)[0].disabled).toBe(false);
  });

  it('disables only Publish (not Archive) when translations are incomplete, even for a Publisher', async () => {
    const fixture = setup(ContentStatus.Approved, ['Publisher'], false);
    await fixture.whenStable();
    const all = buttons(fixture);
    const publish = all.find((b) => b.textContent!.trim() === 'Publish')!;
    const archive = all.find((b) => b.textContent!.trim() === 'Archive')!;
    expect(publish.disabled).toBe(true);
    expect(archive.disabled).toBe(false);
  });
});
