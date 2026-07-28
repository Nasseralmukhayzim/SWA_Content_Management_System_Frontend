import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ContentApiService } from './content-api.service';

describe('ContentApiService', () => {
  let service: ContentApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() issues a GET to /api/admin/{basePath} with page/pageSize/filter query params', () => {
    service.list('pages', { page: 2, pageSize: 10, status: 3, search: 'about' }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiBaseUrl}/api/admin/pages` && r.method === 'GET',
    );
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('status')).toBe('3');
    expect(req.request.params.get('search')).toBe('about');
    req.flush({
      items: [],
      page: 2,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it('create() posts to the base path and resolves the { id } response', () => {
    let result: { id: string } | undefined;
    service.create('pages', { slug: 'about-us' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/admin/pages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ slug: 'about-us' });
    req.flush({ id: 'new-id' });

    expect(result).toEqual({ id: 'new-id' });
  });

  it('runWorkflowAction() posts to {basePath}/{id}/{action} with an empty body', () => {
    service.runWorkflowAction('pages', 'page-1', 'publish').subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/api/admin/pages/page-1/publish`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });
});
