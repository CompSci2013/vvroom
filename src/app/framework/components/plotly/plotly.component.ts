import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as PlotlyJS from 'plotly.js-dist-min';

const Plotly: any = PlotlyJS;

/**
 * Local, in-place `<plotly-plot>` — replaces `@halolabs/ngx-plotly-wrapper` so Plotly lives in
 * `src/app/` with no library dependency. Revision-driven to match `base-chart` usage: a change to
 * `revision` (base-chart bumps it on every data update) re-renders via `Plotly.react`. Emits only the
 * events base-chart consumes: `plotlyClick`, `selected`, `error`.
 */
@Component({
  selector: 'plotly-plot',
  template: `<div #plotEl [ngStyle]="style"></div>`,
  styles: [':host { display: block; }'],
})
export class PlotlyComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: any[] = [];
  @Input() layout: any = {};
  @Input() config: any = {};
  @Input() revision = 0;
  @Input() useResizeHandler = false;
  @Input() style: { [key: string]: string } = { position: 'relative', display: 'block' };

  @Output() plotlyClick = new EventEmitter<any>();
  @Output() selected = new EventEmitter<any>();
  @Output() error = new EventEmitter<Error>();

  @ViewChild('plotEl', { static: true }) plotEl!: ElementRef<HTMLDivElement>;

  private created = false;
  private resizeHandler?: () => void;

  ngAfterViewInit(): void {
    this.createPlot();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.created) {
      return; // initial render happens in ngAfterViewInit
    }
    if (changes['revision'] || changes['data'] || changes['layout'] || changes['config']) {
      this.react();
    }
  }

  private createPlot(): void {
    const el = this.plotEl.nativeElement;
    Plotly.newPlot(el, this.data ?? [], this.layout ?? {}, this.config ?? {})
      .then(() => {
        this.created = true;
        const gd = el as any; // Plotly augments the element with .on() at runtime
        gd.on?.('plotly_click', (e: any) => this.plotlyClick.emit(e));
        gd.on?.('plotly_selected', (e: any) => this.selected.emit(e));
        if (this.useResizeHandler) {
          this.resizeHandler = () => Plotly.Plots.resize(el);
          window.addEventListener('resize', this.resizeHandler);
        }
      })
      .catch((err: unknown) => this.emitError(err));
  }

  private react(): void {
    const el = this.plotEl.nativeElement;
    Plotly.react(el, this.data ?? [], this.layout ?? {}, this.config ?? {}).catch((err: unknown) =>
      this.emitError(err),
    );
  }

  private emitError(err: unknown): void {
    this.error.emit(err instanceof Error ? err : new Error(String(err)));
  }

  ngOnDestroy(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    try {
      Plotly.purge(this.plotEl.nativeElement);
    } catch {
      /* element already gone */
    }
  }
}
