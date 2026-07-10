// src/app/app.component.ts
// VERSION 5 - Pop-outs use CDK portals (no route, no detection needed)

import { Component, OnInit } from '@angular/core';

type AppTheme = 'dark-blue' | 'white-blue' | 'dark-room';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vvroom';

  readonly themes: Array<{ value: AppTheme; label: string }> = [
    { value: 'dark-blue', label: 'Dark Blue' },
    { value: 'white-blue', label: 'White Blue' },
    { value: 'dark-room', label: 'Darkroom Red' }
  ];

  theme: AppTheme = 'dark-blue';

  ngOnInit(): void {
    const saved = localStorage.getItem('vvroom-theme') as AppTheme | null;
    const valid = this.themes.some(theme => theme.value === saved);
    this.setTheme(valid && saved ? saved : 'dark-blue');
  }

  setTheme(theme: AppTheme): void {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vvroom-theme', theme);
  }
}
