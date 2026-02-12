import { Component } from '@angular/core';

/**
 * Home Component - Landing Page
 *
 * Serves as the main entry point and domain selector for the Generic-Prime application.
 * This component provides navigation to various domain-specific modules including
 * Automobile, Physics, Agriculture, Chemistry, and Mathematics.
 *
 * The home page acts as a hub allowing users to select their desired domain of interest
 * and navigate to the corresponding feature modules for data exploration and visualization.
 *
 * @class HomeComponent
 * @since 1.0
 */
@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
}
