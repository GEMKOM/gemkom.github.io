# Centralized Routing System

This document explains the new centralized routing system implemented to prevent infinite redirect loops.

## Overview

The routing system is centralized in `authService.js` and provides consistent navigation across all pages while preventing infinite redirect loops.

## Key Components

### 1. Route Constants
```javascript
export const ROUTES = {
    LOGIN: '/login/',
    RESET_PASSWORD: '/login/reset-password/',
    HOME: '/',
    ADMIN: '/admin/',
    MACHINING: '/machining/',
    MACHINING_TASKS: '/machining/tasks/',
    MAINTENANCE: '/maintenance/'
};
```

### 2. Navigation Function
```javascript
export function navigateTo(path, options = {}) {
    if (isRedirecting) return; // Prevent multiple simultaneous redirects
    
    isRedirecting = true;
    
    if (options.softReload && path === window.location.pathname) {
        // If navigating to the same page, do a soft reload instead
        softReload();
    } else {
        window.location.href = path;
    }
    
    // Reset redirecting flag after a short delay
    setTimeout(() => {
        isRedirecting = false;
    }, 100);
}
```

### 3. Soft Reload Function
```javascript
export function softReload() {
    // Dispatch a custom event that pages can listen to
    window.dispatchEvent(new CustomEvent('softReload'));
}
```

### 4. Route Guard Functions
```javascript
export function shouldBeOnLoginPage() {
    return !isLoggedIn() || (isLoggedIn() && mustResetPassword());
}

export function shouldBeOnResetPasswordPage() {
    return isLoggedIn() && mustResetPassword();
}

export function shouldBeOnMainPage() {
    return isLoggedIn() && !mustResetPassword();
}
```

### 5. Main Route Guard
```javascript
export function guardRoute() {
    const currentPath = window.location.pathname;
    
    // If we're already redirecting, don't do anything
    if (isRedirecting) {
        return false;
    }
    
    // Check if user should be on login page
    if (shouldBeOnLoginPage()) {
        if (currentPath !== ROUTES.LOGIN && currentPath !== ROUTES.RESET_PASSWORD) {
            navigateTo(ROUTES.LOGIN);
            return false;
        }
    }
    
    // Check if user should be on reset password page
    if (shouldBeOnResetPasswordPage()) {
        if (currentPath !== ROUTES.RESET_PASSWORD) {
            navigateTo(ROUTES.RESET_PASSWORD);
            return false;
        }
    }
    
    // Check if user should be on main page
    if (shouldBeOnMainPage()) {
        if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.RESET_PASSWORD) {
            navigateTo(ROUTES.HOME);
            return false;
        }
    }
    
    // If we get here, user is authenticated and on the right page
    document.body.classList.remove('pre-auth');
    return true;
}
```

## Usage

### For Regular Pages
Add this at the beginning of your page's JavaScript:

```javascript
import { guardRoute } from '../authService.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!guardRoute()) {
        return;
    }
    // Your page initialization code here
});
```

### For Login Page
```javascript
import { shouldBeOnLoginPage, navigateTo, ROUTES } from '../authService.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!shouldBeOnLoginPage()) {
        navigateTo(ROUTES.HOME);
        return;
    }
    // Login page initialization
});
```

### For Reset Password Page
```javascript
import { shouldBeOnResetPasswordPage, navigateTo, ROUTES } from '../authService.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!shouldBeOnResetPasswordPage()) {
        navigateTo(ROUTES.HOME);
        return;
    }
    // Reset password page initialization
});
```

### For Admin Pages
```javascript
import { guardRoute, isAdmin, navigateTo, ROUTES } from '../authService.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!guardRoute()) {
        return;
    }
    
    if (!isAdmin()) {
        navigateTo(ROUTES.HOME);
        return;
    }
    // Admin page initialization
});
```

### For Navigation Between Pages
```javascript
import { navigateTo, ROUTES } from '../authService.js';

// Navigate to machining page
navigateTo(ROUTES.MACHINING);

// Navigate to specific task
navigateTo(`${ROUTES.MACHINING_TASKS}?key=ABC-123`);

// Soft reload (refresh state without full page reload)
navigateTo(window.location.pathname, { softReload: true });
```

### For Soft Reloads
```javascript
import { softReload } from '../authService.js';

// Listen for soft reload events
window.addEventListener('softReload', () => {
    // Refresh your page data here
    loadPageData();
});

// Trigger soft reload
softReload();
```

## Benefits

1. **Prevents Infinite Redirects**: The `isRedirecting` flag prevents multiple simultaneous redirects
2. **Consistent Paths**: All routes are defined in one place with consistent trailing slashes
3. **Centralized Logic**: All routing logic is in one place, making it easier to maintain
4. **Clear Separation**: Each page type has its own guard function
5. **Better Error Handling**: Proper handling of edge cases
6. **Soft Reloads**: More elegant state updates without full page reloads
7. **Type Safety**: Centralized route constants prevent typos

## Migration Notes

- Replace all `window.location.href` calls with `navigateTo(ROUTES.PATH)`
- Replace `enforceAuth()` calls with `guardRoute()`
- Use the appropriate guard function for each page type
- Always check admin status after authentication for admin pages
- Consider using `softReload()` instead of `window.location.reload()` for better UX
- Listen for `softReload` events to refresh page data when needed 