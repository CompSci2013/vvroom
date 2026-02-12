// src/app/features/popout/popout.component.ts
// VERSION 1 (Section 103) - Placeholder component
// This will be replaced with the full popout implementation in Phase 3B

import { Component } from '@angular/core';

@Component({
  selector: 'app-popout',
  template: `
    <div class="popout-container">
      <h1>Popout Window</h1>
      <p>This component renders in a separate browser window.</p>
      <p>It will display charts and panels that communicate with the main window.</p>
    </div>
  `,
  styles: [`
    .popout-container {
      padding: 1rem;
    }

    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 0.5rem;
    }
  `]
})
export class PopoutComponent {}
