import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createAutomobilePickerConfigs } from '../../domain-config/automobile/configs/automobile.picker-configs';
import { DomainConfig } from '../../framework/models';
import { PickerSelectionEvent } from '../../framework/models/picker-config.interface';
import {
  PopOutMessage,
  PopOutMessageType
} from '../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../framework/services/domain-config-registry.service';
import { PickerConfigRegistry } from '../../framework/services/picker-config-registry.service';
import { PopOutContextService } from '../../framework/services/popout-context.service';
import { ResourceManagementService } from '../../framework/services/resource-management.service';
import { IS_POPOUT_TOKEN } from '../../framework/tokens/popout.token';


/**
 * Panel Popout Component
 *
 * Container component for pop-out windows.
 * Renders different panel types based on route parameters.
 *
 * Route: `/panel/:gridId/:panelId/:type` (NO query params)
 *
 * Architecture:
 * - Initializes as pop-out via PopOutContextService
 * - Receives STATE_UPDATE messages from main window via BroadcastChannel
 * - Syncs state to ResourceManagementService (no API calls)
 * - Components subscribe to ResourceManagementService observables naturally
 * - URL-First: Main window URL is source of truth, pop-out receives derived state
 *
 * State Flow:
 * 1. Main window URL changes → ResourceManagementService updates state
 * 2. Main window broadcasts STATE_UPDATE to pop-outs
 * 3. Pop-out receives STATE_UPDATE → syncs to ResourceManagementService
 * 4. Components subscribe to observables and render
 *
 * @example
 * ```
 * // URL: /panel/discover/manufacturer-model-picker/picker
 * // Renders: <app-base-picker>
 * // State comes from BroadcastChannel (synced from main window)
 * ```
 */
@Component({
    selector: 'app-panel-popout',
    templateUrl: './panel-popout.component.html',
    styleUrls: ['./panel-popout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        ResourceManagementService,
        { provide: IS_POPOUT_TOKEN, useValue: true }
    ]
})
export class PanelPopoutComponent implements OnInit, OnDestroy {
  /**
   * Grid identifier from route
   */
  gridId: string = '';

  /**
   * Panel identifier from route
   */
  panelId: string = '';

  /**
   * Panel type (determines which component to render)
   */
  panelType: string = '';

  /**
   * Domain configuration (injected)
   */
  domainConfig: DomainConfig<any, any, any>;

  /**
   * Destroy signal for subscription cleanup
   */
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private popOutContext: PopOutContextService,
    private cdr: ChangeDetectorRef,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<any, any, any>
  ) {
    this.domainConfig = domainConfig;
  }

  ngOnInit(): void {
    // Register picker configurations (needed for BasePickerComponent in pop-out)
    // TODO: Make this domain-agnostic by using domain config
    const pickerConfigs = createAutomobilePickerConfigs(this.injector);
    this.pickerRegistry.registerMultiple(pickerConfigs);

    // Extract route parameters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.gridId = params['gridId'];
      this.panelId = params['panelId'];
      this.panelType = params['type'];

      // Initialize as pop-out
      this.popOutContext.initializeAsPopOut(this.panelId);

      // Add class to body and html to hide scrollbars for all pop-outs
      document.documentElement.classList.add('popout-html');
      document.body.classList.add('popout-body');

      // Trigger change detection
      this.cdr.markForCheck();
    });

    // Subscribe to messages from main window
    this.popOutContext
      .getMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleMessage(message);
      });
  }

  /**
   * Handle messages from main window
   *
   * @param message - Message from main window
   */
  private async handleMessage(message: PopOutMessage): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.CLOSE_POPOUT:
        // Close window when requested
        window.close();
        break;

      case PopOutMessageType.STATE_UPDATE:
        // Sync full state from main window
        // Main window URL → state$ → BroadcastChannel → pop-out
        if (message.payload && message.payload.state) {
          // Sync to ResourceManagementService for services that subscribe to it
          // syncStateFromExternal() ensures zone handling and observable emissions
          // Child components (QueryControl, StatisticsPanel, etc.) can now read from resourceService.state$
          this.resourceService.syncStateFromExternal(message.payload.state);

          // Trigger change detection for this component and all children
          this.cdr.detectChanges();
        }
        break;

      case PopOutMessageType.URL_PARAMS_SYNC:
        // Pop-out windows do NOT update their router URL with parameters
        // URL-First architecture: Only main window's URL is the source of truth
        // All state synchronization happens via STATE_UPDATE messages to pop-out's ResourceManagementService
        // Pop-out URLs remain clean without query parameters
        break;

      default:
        // Unknown message type - silently ignore
        break;
    }
  }

  /**
   * Get chart data source for chart pop-outs
   * Extracts chart ID from panel ID (e.g., 'chart-manufacturer' → 'manufacturer')
   *
   * @returns Chart data source configuration
   */
  getChartDataSource(): any {
    if (this.panelId.startsWith('chart-')) {
      const chartId = this.panelId.replace('chart-', '');
      return this.domainConfig.chartDataSources?.[chartId];
    }
    return null;
  }

  /**
   * Get picker config ID based on panel ID
   *
   * @returns Picker configuration ID
   */
  getPickerConfigId(): string {
    return this.panelId;
  }

  /**
   * Handle URL parameter changes from child components
   * Sends message to main window - main window updates its URL and broadcasts STATE_UPDATE
   *
   * @param params - URL parameters from child component
   */
  onUrlParamsChange(params: any): void {
    console.log('[PanelPopout] onUrlParamsChange received', params);
    // Send URL_PARAMS_CHANGED to main window
    // Main window will update its URL, which triggers state update, which broadcasts to pop-outs
    this.popOutContext.sendMessage({
      type: PopOutMessageType.URL_PARAMS_CHANGED,
      payload: { params },
      timestamp: Date.now()
    });
    console.log('[PanelPopout] URL_PARAMS_CHANGED message sent');
  }

  /**
   * Handle clear all filters request
   * Sends message to main window to clear all URL params
   */
  onClearAllFilters(): void {
    this.popOutContext.sendMessage({
      type: PopOutMessageType.CLEAR_ALL_FILTERS,
      timestamp: Date.now()
    });
  }

  /**
   * Handle picker selection changes
   * Sends message to main window which updates URL and broadcasts STATE_UPDATE
   *
   * @param event - Picker selection event
   */
  onPickerSelectionChange(event: PickerSelectionEvent<any>): void {
    // Send picker selection event to main window
    // Main window will update its URL, which triggers state update, which broadcasts to pop-outs
    if (event.urlValue !== undefined) {
      this.popOutContext.sendMessage({
        type: PopOutMessageType.PICKER_SELECTION_CHANGE,
        payload: event,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle chart click/selection from pop-out chart
   * Sends message to main window which updates URL based on selection
   *
   * @param event - Chart click event with value and highlight mode flag
   */
  onChartClick(event: { value: string; isHighlightMode: boolean }): void {
    // Extract chart ID from panel ID (e.g., 'chart-manufacturer' → 'manufacturer')
    const chartId = this.panelId.startsWith('chart-')
      ? this.panelId.replace('chart-', '')
      : this.panelId;

    // Send chart click to main window
    this.popOutContext.sendMessage({
      type: PopOutMessageType.CHART_CLICK,
      payload: {
        chartId,
        value: event.value,
        isHighlightMode: event.isHighlightMode
      },
      timestamp: Date.now()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
