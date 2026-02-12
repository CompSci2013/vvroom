// src/app/app.component.ts
// VERSION 4 (Pop-out fix) - Detect pop-out by URL path instead of query params

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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
 * Pop-out Detection:
 * Pop-outs are detected by checking if the URL starts with '/panel/'.
 * This is more reliable than query params because:
 * 1. The route determines the component, not query params
 * 2. Matches golden-extension's approach
 * 3. Works with Angular's router navigation
 *
 * @class AppComponent
 * @selector app-root
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  /**
   * Application title identifier
   */
  title = 'vvroom';

  /**
   * Whether this window is a pop-out (detected from URL starting with /panel/)
   * When true, the header is hidden and only the router-outlet is shown
   */
  isPopOut = false;

  /**
   * Destroy signal for subscription cleanup
   */
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if current URL is a pop-out route
    this.isPopOut = this.router.url.startsWith('/panel');

    // Listen for navigation changes to detect pop-out routes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.isPopOut = event.urlAfterRedirects.startsWith('/panel');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
