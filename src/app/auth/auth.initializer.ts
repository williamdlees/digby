import {AuthService} from "./auth.service";


export function appInitializer(authService: AuthService) {
    return () => new Promise<void>(resolve => {
        // attempt to refresh token on app start up to auto authenticate
        authService.initialize()
            .subscribe({
                complete: () => resolve(undefined),
                error: () => resolve(undefined) // resolve even on error to prevent app from hanging
            });
    });
}
