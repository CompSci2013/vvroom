# 954: Glossary

**Status:** Reference Document
**Type:** Appendix

---

## Overview

This glossary defines terms used throughout the vvroom book. Terms are organized alphabetically within categories.

---

## Angular Terms

### Change Detection
The process by which Angular checks component properties for changes and updates the DOM accordingly. Can be triggered manually via `ChangeDetectorRef.markForCheck()` or `detectChanges()`.

### Component
A building block of Angular applications consisting of a TypeScript class, HTML template, and optional CSS styles. Decorated with `@Component()`.

### Decorator
A TypeScript feature that adds metadata to classes, properties, or methods. Angular uses decorators like `@Component()`, `@Injectable()`, `@Input()`, and `@Output()`.

### Dependency Injection (DI)
A design pattern where a class receives its dependencies from external sources rather than creating them. Angular's DI system provides services to components.

### Directive
A class that modifies DOM elements or component behavior. Structural directives (`*ngIf`, `*ngFor`) change DOM structure; attribute directives modify appearance or behavior.

### Guard
A service that controls route access. Can prevent navigation (`CanActivate`), leaving (`CanDeactivate`), or loading (`CanLoad`).

### Interceptor
A service that intercepts HTTP requests and responses. Used for adding headers, handling errors, or transforming data globally.

### Lifecycle Hook
Methods that Angular calls at specific points in a component's lifecycle: `ngOnInit`, `ngOnChanges`, `ngAfterViewInit`, `ngOnDestroy`, etc.

### Module (NgModule)
A container for related components, directives, pipes, and services. Decorated with `@NgModule()`. Angular 13 uses NgModules (not standalone components).

### Observable
An RxJS type representing a stream of values over time. Components subscribe to observables to receive data. See also: RxJS Terms.

### Pipe
A function that transforms data in templates. Built-in examples: `| json`, `| async`, `| date`. Custom pipes transform domain-specific data.

### Route
A URL path mapped to a component. Defined in routing modules with path, component, and optional guards.

### Service
A class that provides functionality across components. Typically decorated with `@Injectable()` and provided at root level.

### Template
The HTML portion of a component that defines its view. Can include Angular syntax like interpolation (`{{ }}`), property binding (`[prop]`), and event binding (`(event)`).

---

## RxJS Terms

### BehaviorSubject
A Subject that requires an initial value and emits the current value to new subscribers. Used for state that always has a value.

### combineLatest
An operator that combines the latest values from multiple observables. Emits whenever any source emits (after all have emitted at least once).

### distinctUntilChanged
An operator that only emits when the current value differs from the previous value. Prevents duplicate emissions.

### filter
An operator that emits only values that pass a predicate function.

### map
An operator that transforms each emitted value using a projection function.

### Observable
A lazy push collection that can emit zero or more values over time. Must be subscribed to for values to flow.

### Operator
A function that transforms an observable stream. Applied via the `pipe()` method. Examples: `map`, `filter`, `switchMap`.

### pipe
A method that chains operators together. `source$.pipe(op1, op2, op3)` applies operators in sequence.

### ReplaySubject
A Subject that replays a specified number of previous values to new subscribers. Useful for late subscribers.

### shareReplay
An operator that multicasts an observable and replays the last N values to new subscribers. Prevents duplicate API calls.

### Subject
An observable that is also an observer. Can push values with `next()` and be subscribed to.

### subscribe
The method that activates an observable and receives its values. Returns a Subscription that should be cleaned up.

### Subscription
An object representing the execution of an observable. Call `unsubscribe()` to stop receiving values and prevent memory leaks.

### switchMap
An operator that maps to an inner observable and cancels the previous inner observable on each new emission. Ideal for search/filter operations.

### takeUntil
An operator that emits values until a notifier observable emits. Used for component cleanup with a `destroy$` subject.

### tap
An operator that performs side effects (like logging) without modifying the stream.

---

## URL-First Architecture Terms

### Adapter
A class that converts between framework types and domain-specific types. Examples: `AutomobileUrlMapper`, `AutomobileApiAdapter`.

### API Adapter
An adapter that handles API communication for a specific domain. Implements `IApiAdapter<TFilters, TData, TStatistics>`.

### Cache Key Builder
A class that generates unique cache keys from filter objects. Ensures API responses are cached correctly.

### Chart Data Source
A class that transforms domain statistics into chart-ready data (Plotly traces). Each chart type has its own data source.

### Domain
A specific area of functionality in the application. In vvroom, "automobile" is the domain. Other books might add "agriculture" or "real estate".

### Domain Config
The central configuration object for a domain. Contains adapters, UI configs, and type references. Type: `DomainConfig<TFilters, TData, TStatistics>`.

### Domain Config Registry
A service that stores and retrieves domain configurations. Allows framework code to access the active domain's config.

### Filter
A set of criteria that narrow search results. In vvroom: manufacturer, model, year, body class, etc.

### Framework Code
Domain-agnostic code that works with any domain through interfaces. Located in `src/app/framework/`.

### Highlight
A visual emphasis on data that matches specific criteria. Highlights don't filter data; they color-code matching items.

### Pop-out Window
A separate browser window displaying part of the application. Communicates with the main window via `postMessage`.

### Resource Management Service
The central service managing data fetching, caching, and state. Coordinates URL state with API calls.

### Single Source of Truth
A principle where one authoritative location stores each piece of state. In URL-First, the URL is the single source of truth for filter state.

### URL Mapper
An adapter that converts between filter objects and URL query parameters. Bidirectional: `toParams()` and `fromParams()`.

### URL State Service
A service that manages reading from and writing to URL query parameters. Provides reactive streams of URL state.

---

## TypeScript Terms

### Concrete Type
A specific, known type like `string`, `number`, or `AutomobileFilters`. Contrast with type parameters.

### Constraint
A limit on what types can be used as a type parameter. Syntax: `<T extends SomeInterface>`.

### Generic
A type or function that works with multiple types through type parameters. Provides type safety without code duplication.

### Interface
A TypeScript structure defining a contract for objects. Does not exist at runtime; only provides compile-time type checking.

### keyof
A TypeScript operator that returns a union of an object's property names as string literal types.

### Partial<T>
A utility type that makes all properties of T optional.

### Pick<T, K>
A utility type that creates a new type with only the specified properties from T.

### Record<K, V>
A utility type representing an object with keys of type K and values of type V.

### Type Guard
A function that narrows a type within a conditional block. Uses `is` return type syntax.

### Type Parameter
A placeholder type in a generic definition, filled in when the generic is used. Conventionally named `T`, `U`, or descriptively like `TFilters`.

### Union Type
A type that can be one of several types. Syntax: `string | number | null`.

### Utility Type
Built-in TypeScript types that transform other types. Examples: `Partial`, `Required`, `Pick`, `Omit`, `Record`.

---

## UI Component Terms

### Base Chart Component
A reusable Plotly.js wrapper that works with any `ChartDataSource`. Handles rendering, resizing, and click events.

### Base Picker Component
A reusable multi-select dropdown that works with any `PickerConfig`. Handles option loading and selection.

### CDK (Component Dev Kit)
Angular's set of behavior primitives for building UI components. Used for drag-drop functionality.

### Dockview
A third-party library providing tabbed, resizable, dockable panel layouts. Framework-agnostic.

### PrimeNG
The UI component library used in vvroom. Provides styled components like tables, buttons, dialogs, etc.

### Query Panel
A component displaying filter inputs for user-adjustable search criteria.

### Results Table
A component displaying paginated search results in a table format.

### Statistics Panel
A component displaying multiple charts showing data distributions.

---

## API Terms

### Base URL
The root URL for all API endpoints. Configured in `environment.ts`.

### Endpoint
A specific API URL path that accepts requests and returns responses. Example: `/api/specs/v1/search`.

### Pagination
The practice of returning data in pages rather than all at once. API returns `page`, `size`, `totalItems`, `totalPages`.

### Query Parameter
A key-value pair in a URL after the `?`. Example: `?manufacturer=Toyota&year=2022`.

### Request
An HTTP call to an API endpoint. Includes method (GET, POST), headers, and optional body.

### Response
Data returned by an API. Includes status code, headers, and body (usually JSON).

---

## Development Terms

### Barrel Export
An `index.ts` file that re-exports symbols from a directory, simplifying imports.

### Build
The process of compiling TypeScript and bundling the application for deployment. Command: `ng build`.

### Hot Module Replacement (HMR)
A development feature that updates modules without full page reload.

### Lazy Loading
Loading modules on demand rather than at startup. Improves initial load time.

### Linting
Static code analysis to catch errors and enforce style. Tool: ESLint.

### Serve
Running the application in development mode with live reload. Command: `ng serve`.

### Tree Shaking
Removing unused code during the build process. Reduces bundle size.

---

## Key Acronyms

| Acronym | Meaning |
|---------|---------|
| API | Application Programming Interface |
| CDK | Component Dev Kit |
| CLI | Command Line Interface |
| CORS | Cross-Origin Resource Sharing |
| CSS | Cascading Style Sheets |
| DI | Dependency Injection |
| DOM | Document Object Model |
| HTML | HyperText Markup Language |
| HTTP | HyperText Transfer Protocol |
| JSON | JavaScript Object Notation |
| RxJS | Reactive Extensions for JavaScript |
| SCSS | Sassy CSS (CSS preprocessor) |
| SPA | Single Page Application |
| URL | Uniform Resource Locator |
| VIN | Vehicle Identification Number |

---

## Further Reading

For deeper understanding of these terms, refer to:

- [Angular Glossary](https://angular.io/guide/glossary)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [RxJS Documentation](https://rxjs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
