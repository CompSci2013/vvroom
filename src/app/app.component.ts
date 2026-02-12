// src/app/app.component.ts
// VERSION 2 (Section 102) - Shell with navigation
// Replaces VERSION 1 from Section 101

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <header class="app-header">
      <div class="app-header-brand">
        <span class="app-header-logo">🚗</span>
        <span class="app-header-title">vvroom</span>
      </div>
      <nav class="app-header-nav">
        <a class="nav-link" routerLink="/home" routerLinkActive="active">Home</a>
        <a class="nav-link" routerLink="/discover" routerLinkActive="active">Discover</a>
      </nav>
    </header>
    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 56px;
      background-color: #1976d2;
      color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .app-header-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-header-logo {
      font-size: 1.5rem;
    }

    .app-header-title {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .app-header-nav {
      display: flex;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      text-decoration: none;
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .app-content {
      flex: 1;
      padding: 1.5rem;
    }
  `]
})
export class AppComponent {}
