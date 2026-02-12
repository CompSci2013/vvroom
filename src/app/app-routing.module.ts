// src/app/app-routing.module.ts
// VERSION 2 (Pop-out fix) - Added panel route for pop-out windows

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';
import { DiscoverComponent } from './features/discover/discover.component';
import { PanelPopoutComponent } from './features/panel-popout/panel-popout.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'discover', component: DiscoverComponent },
  // Pop-out panel route: /panel/:gridId/:panelId/:type
  // Used by DiscoverComponent.popOutPanel() to open panels in separate windows
  // PanelPopoutComponent handles BroadcastChannel communication with main window
  { path: 'panel/:gridId/:panelId/:type', component: PanelPopoutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
