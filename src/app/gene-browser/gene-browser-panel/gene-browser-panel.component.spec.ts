import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { GeneTableSelectorService } from '../../gene-table-selector/gene-table-selector.service';
import { GeneBrowserPanelComponent } from './gene-browser-panel.component';

describe('genome browser panel', () => {
  const browser = { loadTrack: vi.fn() };
  const igv = { createBrowser: vi.fn(), removeBrowser: vi.fn(), setOauthToken: vi.fn() };
  let selector: GeneTableSelectorService;
  let component: GeneBrowserPanelComponent;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    browser.loadTrack.mockResolvedValue(undefined);
    igv.createBrowser.mockResolvedValue(browser);
    vi.stubGlobal('igv', igv);
    TestBed.configureTestingModule({ providers: [
      GeneTableSelectorService,
      { provide: ActivatedRoute, useValue: {} },
      { provide: AuthService, useValue: { user: new BehaviorSubject({ accessToken: 'token' }) } },
    ] });
    selector = TestBed.inject(GeneTableSelectorService);
    component = new GeneBrowserPanelComponent(selector, TestBed.inject(ActivatedRoute), TestBed.inject(AuthService));
    container = document.createElement('div');
    container.id = 'igvdiv';
    document.body.appendChild(container);
  });

  afterEach(() => {
    component.ngOnDestroy();
    container.remove();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('creates tracks for the selected assembly and removes the browser when selection is ambiguous', async () => {
    selector.selection.next({ ...selector.selection.value, species: 'Rhesus Macaque',
      datasets: ['study'], assemblies: ['assembly:description'] });
    component.ngOnInit();
    expect(igv.setOauthToken).toHaveBeenCalledWith('token', location.hostname);
    vi.advanceTimersByTime(1000);
    await vi.waitFor(() => expect(browser.loadTrack).toHaveBeenCalledTimes(3));
    const [element, options] = igv.createBrowser.mock.calls[0];
    expect(element).toBe(container);
    expect(options.reference.fastaURL).toContain('/Rhesus_Macaque/study/Rhesus_Macaque_assembly.fasta');
    expect(options.search.url).toContain('/Rhesus Macaque/study/assembly:description/$FEATURE$');
    expect(browser.loadTrack.mock.calls.map(call => call[0].name)).toEqual([
      'Reference', 'Sample Features', 'Sample genes',
    ]);
    selector.selection.next({ ...selector.selection.value, datasets: ['one', 'two'] });
    vi.advanceTimersByTime(1000);
    expect(igv.removeBrowser).toHaveBeenCalledWith(browser);
    expect(component.browser).toBeNull();
    expect(igv.createBrowser).toHaveBeenCalledTimes(1);
  });

  it('does not create a browser when the panel is not displayed', () => {
    container.remove();
    selector.selection.next({ ...selector.selection.value, datasets: ['study'] });
    component.ngOnInit();
    vi.advanceTimersByTime(1000);
    expect(igv.createBrowser).not.toHaveBeenCalled();
    expect(component.browser).toBeNull();
  });
});
