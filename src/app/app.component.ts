// src/app/app.component.ts
// VERSION 3 (Appendix A01) - Dark theme with vvroom branding

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Root Application Component (AppComponent)
 *
 * Main container component for the vvroom application. Provides the global
 * application shell including navigation and router outlet for feature components.
 *
 * Features:
 * - Dark theme header with vvroom branding
 * - Navigation links for Home and Discover
 * - Pop-out window detection (hides header in pop-outs)
 * - Router outlet for feature components
 *
 * @class AppComponent
 * @selector app-root
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  /**
   * Application title identifier
   */
  title = 'vvroom';

  /**
   * Whether this window is a pop-out (detected from ?popout=panelId query param)
   * When true, the header is hidden and only the router-outlet is shown
   */
  isPopOut = false;

  constructor(private route: ActivatedRoute) {
    // Detect if this is a pop-out window by checking for ?popout query parameter
    this.route.queryParams.subscribe(params => {
      this.isPopOut = !!params['popout'];
    });
  }
}
