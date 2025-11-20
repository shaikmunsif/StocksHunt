# SVG Components

This folder contains reusable SVG icon components for the application.

## Components

### IconsComponent (`icons/icons.component.ts`)

The main SVG icon component that renders icons inline using signal-based inputs.

**Usage:**

```html
<app-icon iconName="login" width="24" height="24" class="text-indigo-600"> </app-icon>
```

**Available Icons:**

- `login` - Login/Sign in icon
- `register` - Register/Create account icon
- `email` - Email/Message icon
- `password` - Password/Lock icon
- `user` - User/Profile icon
- `error` - Error/Warning icon
- `close` - Close/Cancel icon
- `arrow-right` - Navigation arrow
- `loading` - Spinner animation

### BaseIconComponent (`base-icon/base-icon.component.ts`)

Alternative component that loads SVGs from external files using fetch.

**Usage:**

```html
<app-base-icon iconName="login" width="24" height="24" class="text-indigo-600"> </app-base-icon>
```

## Files Structure

```
svg/
├── README.md                   # Component documentation
├── index.ts                    # Main exports
├── icons/                      # IconsComponent folder
│   ├── icons.component.ts      # Main icon component
│   ├── icons.component.html    # Icon template with @switch
│   ├── icons.component.scss    # Icon styles
│   └── index.ts                # IconsComponent export
└── base-icon/                  # BaseIconComponent folder
    ├── base-icon.component.ts  # External SVG loader
    ├── base-icon.component.html# Base icon template
    ├── base-icon.component.scss# Base icon styles
    └── index.ts                # BaseIconComponent export
```

## Features

- Signal-based inputs for reactive updates
- Modern @switch control flow for icon selection
- Standalone components (no NgModules)
- TypeScript support with proper typing
- Tailwind CSS compatible
- Performance optimized with inline SVGs
- Organized folder structure for maintainability

## Adding New Icons

1. Add the icon path to `icons/icons.component.html` in the @switch block
2. Update this README with the new icon name
3. Use the new icon with `<app-icon iconName="new-icon">`

## Import Examples

```typescript
// Import specific component
import { IconsComponent } from '../svg/icons';
import { BaseIconComponent } from '../svg/base-icon';

// Or import from main index
import { IconsComponent, BaseIconComponent } from '../svg';
```

## Benefits

- **Performance**: Inline SVGs avoid additional HTTP requests
- **Styling**: Icons inherit CSS colors and can be styled with Tailwind
- **Reusability**: Single component for all icons
- **Type Safety**: Signal-based inputs with TypeScript
- **Modern**: Uses latest Angular features (signals, @switch, standalone)
- **Organization**: Clean folder structure for better maintainability
