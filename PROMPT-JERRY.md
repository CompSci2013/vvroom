# Task: Replace Year Range Dual-Input with PrimeNG Slider

## Objective
Replace the dual p-inputNumber year picker in the Range Filter Dialog with a single PrimeNG p-slider using [range]="true".

## Architecture Requirements (URL-First Pattern)
The app uses a URL-First state management pattern where the URL is the single source of truth:
- All filter changes must flow through URL parameters
- The component emits urlParamsChange events with {yearMin, yearMax, page: 1}
- URL params use: yearMin and yearMax (separate params, not combined)
- When slider changes, emit URL params; when URL changes, update slider

## Files to Modify

### 1. src/app/primeng.module.ts
Add SliderModule import:
- Import: import { SliderModule } from 'primeng/slider';
- Add SliderModule to the PRIMENG_MODULES array

### 2. src/app/framework/components/query-control/query-control.component.ts
Changes needed:
- Add a new property: rangeValues: number[] = [0, 0];  // [min, max] for slider binding
- In openRangeDialog(): Initialize rangeValues from rangeMin/rangeMax or availableRange
- In applyRange(): Extract values from rangeValues array instead of rangeMin/rangeMax
- Add onRangeSliderChange(event: any) method to update rangeMin/rangeMax from slider
- Keep rangeMin/rangeMax properties for backward compatibility with the Apply logic

### 3. src/app/framework/components/query-control/query-control.component.html
Replace the range-inputs section (lines ~176-208) with a p-slider:
- Use p-slider with [range]="true"
- Bind [(ngModel)]="rangeValues"
- Set [min] and [max] from availableRange
- Add (onChange) handler to sync rangeMin/rangeMax
- Display current values as labels above/below the slider
- Keep the Apply/Cancel footer buttons

Example slider markup:
```html
<div class="range-slider-container">
  <div class="range-labels">
    <span>{{ rangeValues[0] }}</span>
    <span>{{ rangeValues[1] }}</span>
  </div>
  <p-slider
    [(ngModel)]="rangeValues"
    [range]="true"
    [min]="availableRange.min"
    [max]="availableRange.max"
    [step]="getRangeStep()"
    (onChange)="onRangeSliderChange($event)">
  </p-slider>
</div>
```

## Implementation Steps
1. First, read the current files to understand the exact structure
2. Add SliderModule to primeng.module.ts
3. Update the TypeScript component with rangeValues and handler
4. Update the HTML template to use p-slider instead of p-inputNumber
5. Run 'npm run build' to verify no errors

## Important
- The [range]="true" MUST use property binding syntax (square brackets), NOT range="true" (string)
- Preserve the existing dialog structure (header, footer with Apply/Cancel)
- The slider should work within the existing Range Filter Dialog
- Test URL sync: slider values must match yearMin/yearMax URL params

---

## Reference Documents

### URL-First Pattern (from docs/URL-FIRST-AS-IMPLEMENTED.md)
- URL is single source of truth for application state
- Components emit `urlParamsChange` events, parent calls `UrlStateService.setParams()`
- `ResourceManagementService` watches URL changes and updates state observables
- Filter changes always flow: Component → URL → Service → Components

### State Management (from docs/STATE-MANAGEMENT-SPECIFICATION.md)
- `IFilterUrlMapper` handles bidirectional URL ↔ Filter serialization
- Year range uses separate `yearMin` and `yearMax` URL parameters
- Filters emit with `page: 1` to reset pagination on filter change
