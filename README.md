# StocksPulse

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.10.

## Technologies Used

- **Angular 20** - Web framework
- **Angular Material** - UI component library following Material Design
- **Tailwind CSS** - Utility-first CSS framework for styling
- **TypeScript** - Type-safe JavaScript

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## UI Frameworks

### Angular Material

This project includes Angular Material components. To use them in your components:

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
// ... other imports

@NgModule({
  imports: [
    MatButtonModule,
    MatCardModule,
    // ... other modules
  ],
})
export class AppModule {}
```

For a complete list of available components, visit the [Angular Material documentation](https://material.angular.io/).

### Tailwind CSS

Tailwind CSS is configured and ready to use. You can apply utility classes directly in your HTML templates:

```html
<div class="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
  <h1 class="text-2xl font-bold">Hello Tailwind!</h1>
  <p class="mt-2">This is styled with Tailwind CSS utilities.</p>
</div>
```

The Tailwind configuration is in `tailwind.config.js` and can be customized to add your own theme, colors, and utilities.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

For Angular Material documentation, visit [material.angular.io](https://material.angular.io/).

For Tailwind CSS documentation, visit [tailwindcss.com](https://tailwindcss.com/).
