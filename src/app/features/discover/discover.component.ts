import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  Type
} from '@angular/core';
import { Params } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PopOutManagerService, PopOutMessageType } from '../../framework/popout';
import { createAutomobilePickerConfigs } from '../../domain-config/automobile/configs/automobile.picker-configs';
import { DomainConfig } from '../../framework/models';
import { DOMAIN_CONFIG } from '../../framework/services/domain-config-registry.service';
import { PickerConfigRegistry } from '../../framework/services/picker-config-registry.service';
import { ResourceManagementService } from '../../framework/services/resource-management.service';
import { UrlStateService } from '../../framework/services/url-state.service';
import { UserPreferencesService } from '../../framework/services/user-preferences.service';
import { BaseChartComponent, ChartDataSource } from '../../framework/components/base-chart/base-chart.component';
import { BasePickerComponent } from '../../framework/components/base-picker/base-picker.component';
import { DynamicResultsTableComponent } from '../../framework/components/dynamic-results-table/dynamic-results-table.component';
import { QueryControlComponent } from '../../framework/components/query-control/query-control.component';
import { QueryPanelComponent } from '../../framework/components/query-panel/query-panel.component';
import { ResultsTableComponent } from '../../framework/components/results-table/results-table.component';
import { StatisticsPanel2Component } from '../../framework/components/statistics-panel-2/statistics-panel-2.component';

@Component({
    selector: 'app-discover',
    templateUrl: './discover.component.html',
    styleUrls: ['./discover.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ResourceManagementService]
})
export class DiscoverComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, OnDestroy {

  domainConfig: DomainConfig<TFilters, TData, TStatistics>;
  collapsedPanels = new Map<string, boolean>();
  panelOrder: string[] = [
    'query-control',
    'query-panel',
    'manufacturer-model-picker',
    'statistics-panel-2',
    'basic-results-table'
  ];

  private destroy$ = new Subject<void>();

  /**
   * Panel ID → component Type + @Input() data mapping.
   * Used by popOutPanel() to render the correct component in the portal.
   */
  private readonly panelComponentMap: Record<string, () => { type: Type<any>; data: Record<string, any> }> = {
    'query-control': () => ({
      type: QueryControlComponent,
      data: { domainConfig: this.domainConfig }
    }),
    'query-panel': () => ({
      type: QueryPanelComponent,
      data: { domainConfig: this.domainConfig }
    }),
    'manufacturer-model-picker': () => ({
      type: BasePickerComponent,
      data: { configId: 'manufacturer-model-picker' }
    }),
    'statistics-panel-2': () => ({
      type: StatisticsPanel2Component,
      data: { domainConfig: this.domainConfig, isRenderedInPopout: true }
    }),
    'results-table': () => ({
      type: ResultsTableComponent,
      data: { domainConfig: this.domainConfig }
    }),
    'basic-results-table': () => ({
      type: DynamicResultsTableComponent,
      data: { domainConfig: this.domainConfig }
    }),
  };

  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    private popOutManager: PopOutManagerService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private urlStateService: UrlStateService,
    private userPreferences: UserPreferencesService
  ) {
    this.domainConfig = domainConfig as DomainConfig<TFilters, TData, TStatistics>;
  }

  ngOnInit(): void {
    // Load panel preferences
    this.userPreferences.getPanelOrder()
      .pipe(takeUntil(this.destroy$))
      .subscribe(order => {
        this.panelOrder = order;
        this.cdr.markForCheck();
      });

    this.userPreferences.getCollapsedPanels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(collapsedPanels => {
        this.collapsedPanels.clear();
        collapsedPanels.forEach(panelId => {
          this.collapsedPanels.set(panelId, true);
        });
        this.cdr.markForCheck();
      });

    // Register domain-specific picker configurations
    const pickerConfigs = createAutomobilePickerConfigs(this.injector);
    this.pickerRegistry.registerMultiple(pickerConfigs);

    // Initialize portal-based PopOutManagerService with this component's injector
    // so portal-rendered components inherit component-level providers (ResourceManagementService)
    this.popOutManager.initialize(this.injector);

    // Handle messages from pop-out components (@Output() events relayed as COMPONENT_OUTPUT)
    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ popoutId, message }) => {
        this.handlePopOutMessage(popoutId, message);
      });

    // Handle pop-out window closures
    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Handle pop-up blocked notifications
    this.popOutManager.blocked$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Pop-up Blocked',
          detail: 'Please allow pop-ups for this site to use the pop-out feature',
          life: 5000
        });
      });

    // Broadcast state changes to all open pop-outs
    this.resourceService.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.popOutManager.broadcastState(state);

      // Sync @Input() properties for standalone chart popouts.
      // Service-aware components (StatisticsPanel2) read from shared ResourceManagementService
      // and only need a CD kick (handled by broadcastState). But "dumb" components
      // (BaseChartComponent in chart-* popouts) received snapshot data at creation time —
      // they need explicit input updates + ngOnChanges to re-render.
      for (const panelId of this.popOutManager.getPoppedOutPanels()) {
        if (panelId.startsWith('chart-')) {
          this.popOutManager.setPopoutInputs(panelId, {
            statistics: state.statistics,
            highlights: state.highlights || {}
          });
        }
      }
    });
  }

  isPanelPoppedOut(panelId: string): boolean {
    return this.popOutManager.isPoppedOut(panelId);
  }

  isPanelCollapsed(panelId: string): boolean {
    return this.collapsedPanels.get(panelId) ?? false;
  }

  togglePanelCollapse(panelId: string): void {
    const currentState = this.collapsedPanels.get(panelId) ?? false;
    this.collapsedPanels.set(panelId, !currentState);

    const collapsedPanels = Array.from(this.collapsedPanels.entries())
      .filter(([_, isCollapsed]) => isCollapsed)
      .map(([panelId, _]) => panelId);
    this.userPreferences.saveCollapsedPanels(collapsedPanels);

    this.cdr.markForCheck();
  }

  onPanelDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.panelOrder, event.previousIndex, event.currentIndex);
    this.userPreferences.savePanelOrder(this.panelOrder);
    this.cdr.markForCheck();
  }

  getPanelTitle(panelId: string): string {
    const titleMap: { [key: string]: string } = {
      'query-control': 'Query Control',
      'query-panel': 'Query Panel',
      'manufacturer-model-picker': 'Manufacturer-Model Picker',
      'statistics-panel-2': 'Statistics',
      'results-table': 'Results',
      'basic-results-table': 'Results Table'
    };
    return titleMap[panelId] || panelId;
  }

  /**
   * Pop out a panel to a separate window via CDK portal.
   * Resolves panel ID to component Type + @Input() data, then delegates to the library.
   */
  popOutPanel(panelId: string): void {
    // Handle chart pop-outs (dynamic panel IDs like 'chart-manufacturer')
    let resolver = this.panelComponentMap[panelId];

    if (!resolver && panelId.startsWith('chart-')) {
      const chartId = panelId.replace('chart-', '');
      const dataSource = this.domainConfig.chartDataSources?.[chartId];
      if (dataSource) {
        resolver = () => ({
          type: BaseChartComponent,
          data: {
            dataSource,
            statistics: this.resourceService.statistics,
            highlights: this.resourceService.highlights,
            selectedValue: null
          }
        });
      }
    }

    if (!resolver) {
      console.warn(`[DiscoverComponent] No component mapping for panel: ${panelId}`);
      return;
    }

    const { type, data } = resolver();
    data['title'] = this.getPanelTitle(panelId);

    const opened = this.popOutManager.openPopOut(panelId, type, data);
    if (opened) {
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle chart pop-out request from statistics panel
   */
  onChartPopOut(chartId: string): void {
    this.popOutPanel(`chart-${chartId}`);
  }

  /**
   * Handle messages from pop-out windows.
   *
   * With portal-based pop-outs, components emit @Output() events which the library
   * wraps as COMPONENT_OUTPUT messages. We route them to the same handlers used
   * by the in-window versions of those components.
   */
  private async handlePopOutMessage(panelId: string, message: any): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.POPOUT_READY:
        const currentState = this.resourceService.getCurrentState();
        this.popOutManager.broadcastState(currentState);
        break;

      case PopOutMessageType.COMPONENT_OUTPUT:
        await this.handleComponentOutput(panelId, message.payload);
        break;
    }
  }

  /**
   * Route @Output() events from portal-rendered components to existing handlers.
   * The outputName matches the @Output() property name on the component.
   */
  private async handleComponentOutput(panelId: string, payload: { outputName: string; data: any }): Promise<void> {
    const { outputName, data } = payload;

    switch (outputName) {
      case 'urlParamsChange':
        await this.onUrlParamsChange(data);
        break;

      case 'clearAllFilters':
        await this.onClearAllFilters();
        break;

      case 'selectionChange':
        await this.onPickerSelectionChangeAndUpdateUrl(data);
        break;

      case 'chartClick':
        // For chart pop-outs, resolve the dataSource from the panelId
        if (panelId.startsWith('chart-')) {
          const chartId = panelId.replace('chart-', '');
          const dataSource = this.domainConfig.chartDataSources?.[chartId];
          await this.onStandaloneChartClick(data, dataSource);
        }
        break;

      case 'chartPopOut':
        this.onChartPopOut(data);
        break;
    }
  }

  async onUrlParamsChange(params: Params): Promise<void> {
    await this.urlStateService.setParams(params);
  }

  async onClearAllFilters(): Promise<void> {
    await this.urlStateService.clearParams();
  }

  async onStandaloneChartClick(
    event: { value: string; isHighlightMode: boolean },
    dataSource: ChartDataSource | undefined
  ): Promise<void> {
    if (!dataSource) {
      return;
    }

    const newParams = dataSource.toUrlParams(event.value, event.isHighlightMode);

    if (!event.isHighlightMode) {
      newParams['page'] = 1;
    }

    if (Object.keys(newParams).length > 0) {
      await this.urlStateService.setParams(newParams);
    }
  }

  async onPickerSelectionChangeAndUpdateUrl(event: any): Promise<void> {
    const paramName = 'modelCombos'; // TODO: Get from picker config

    await this.urlStateService.setParams({
      [paramName]: event.urlValue || null,
      page: 1
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
