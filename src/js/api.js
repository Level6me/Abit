/**
 * @file api.js
 * @description API helper configuration and global AJAX interceptors
 */

// Global AJAX Interceptor for 403/401 Unauthorized
    $.ajaxSetup({
        error: function(xhr) {
            if (xhr.status === 403 || xhr.status === 401) {
                if (typeof setAuthPassed === 'function') setAuthPassed(false);
                if (typeof openLoginModal === 'function') openLoginModal(true);
            }
        }
    });
