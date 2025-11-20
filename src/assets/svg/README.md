# SVG Icons System

This directory contains individual SVG icon files used throughout the application.

## Available Icons

- `login-icon.svg` - Login/Sign in icon
- `register-icon.svg` - Register/Create account icon
- `email-icon.svg` - Email/Message icon
- `password-icon.svg` - Password/Lock icon
- `user-icon.svg` - User/Profile icon
- `error-icon.svg` - Error/Warning icon
- `close-icon.svg` - Close/Cancel icon
- `arrow-right-icon.svg` - Right arrow icon
- `loading-spinner.svg` - Loading animation spinner

## Usage

Use the `IconsComponent` in your templates:

```html
<app-icon iconName="login" width="24" height="24" class="text-indigo-600"> </app-icon>
```

### Parameters

- `iconName`: The name of the icon (without .svg extension)
- `width`: Icon width in pixels (default: "24")
- `height`: Icon height in pixels (default: "24")
- `class`: Additional CSS classes for styling

### Available Icon Names

- `login`
- `register`
- `email`
- `password`
- `user`
- `error`
- `close`
- `arrow-right`
- `loading`

## Adding New Icons

1. Add SVG file to this directory
2. Update `IconsComponent` to include the new icon in the ngSwitch
3. Export from index.ts if needed

## Benefits

- Reusable across components
- Consistent styling
- Easy to maintain
- Reduced bundle size through component reuse
- Centralized icon management
