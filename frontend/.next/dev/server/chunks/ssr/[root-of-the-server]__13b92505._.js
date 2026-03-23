module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
async function request(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : null;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
    if (!response.ok) {
        const error = await response.json().catch(()=>({
                message: 'An error occurred'
            }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}
const api = {
    auth: {
        login: (dto)=>request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        register: (dto)=>request('/auth/register-admin', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        me: ()=>request('/auth/me'),
        updateStatus: (isOnline)=>request('/auth/status', {
                method: 'PATCH',
                body: JSON.stringify({
                    isOnline
                })
            }),
        updateProfile: (dto)=>request('/auth/me', {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        deleteOrganization: ()=>request('/auth/organization', {
                method: 'DELETE'
            }),
        onboard: (dto)=>request('/auth/onboard', {
                method: 'PATCH',
                body: JSON.stringify(dto)
            })
    },
    conversations: {
        list: ()=>request('/conversations'),
        create: (dto)=>request('/conversations', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        assign: (id, dto)=>request(`/conversations/${id}/assign`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        handoff: (id, dto)=>request(`/conversations/${id}/handoff`, {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        close: (id)=>request(`/conversations/${id}/close`, {
                method: 'PATCH'
            }),
        resolve: (id)=>request(`/conversations/${id}/resolve`, {
                method: 'PATCH'
            }),
        setStarred: (id, dto)=>request(`/conversations/${id}/star`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        updateStatus: (id, dto)=>request(`/conversations/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        listTags: (id)=>request(`/conversations/${id}/tags`),
        addTag: (id, dto)=>request(`/conversations/${id}/tags`, {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        removeTag: (id, tagId)=>request(`/conversations/${id}/tags/${tagId}`, {
                method: 'DELETE'
            }),
        listNotes: (id)=>request(`/conversations/${id}/notes`),
        createNote: (id, dto)=>request(`/conversations/${id}/notes`, {
                method: 'POST',
                body: JSON.stringify(dto)
            })
    },
    messages: {
        list: (conversationId)=>request(`/conversations/${conversationId}/messages`),
        create: (conversationId, dto)=>request(`/conversations/${conversationId}/messages`, {
                method: 'POST',
                body: JSON.stringify(dto)
            })
    },
    customers: {
        list: ()=>request('/customers'),
        create: (dto)=>request('/customers', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        get: (id)=>request(`/customers/${id}`),
        update: (id, dto)=>request(`/customers/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        getNote: (id)=>request(`/customers/${id}/note`),
        saveNote: (id, dto)=>request(`/customers/${id}/note`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        listTags: (id)=>request(`/customers/${id}/tags`),
        addTag: (id, dto)=>request(`/customers/${id}/tags`, {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        removeTag: (id, tagId)=>request(`/customers/${id}/tags/${tagId}`, {
                method: 'DELETE'
            })
    },
    staff: {
        list: ()=>request('/staff'),
        create: (dto)=>request('/staff', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        update: (id, dto)=>request(`/staff/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        deactivate: (id)=>request(`/staff/${id}/deactivate`, {
                method: 'PATCH'
            })
    },
    departments: {
        list: ()=>request('/departments'),
        create: (dto)=>request('/departments', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        update: (id, dto)=>request(`/departments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        setMembers: (id, dto)=>request(`/departments/${id}/members`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        delete: (id)=>request(`/departments/${id}`, {
                method: 'DELETE'
            })
    },
    routing: {
        getSettings: ()=>request('/routing/settings'),
        updateSettings: (dto)=>request('/routing/settings', {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        listAutoReplies: ()=>request('/routing/auto-replies'),
        createAutoReply: (dto)=>request('/routing/auto-replies', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        updateAutoReply: (id, dto)=>request(`/routing/auto-replies/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            })
    },
    meta: {
        deleteData: (dto)=>request('/meta/delete-data', {
                method: 'POST',
                body: JSON.stringify(dto)
            })
    },
    socialAccounts: {
        list: ()=>request('/social-accounts'),
        create: (dto)=>request('/social-accounts', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        update: (id, dto)=>request(`/social-accounts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        remove: (id)=>request(`/social-accounts/${id}`, {
                method: 'DELETE'
            }),
        oauthUrl: (channel)=>request(`/social-accounts/oauth/url?channel=${encodeURIComponent(channel)}`)
    },
    tags: {
        list: (type)=>request(`/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
        create: (dto)=>request('/tags', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        update: (id, dto)=>request(`/tags/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        delete: (id)=>request(`/tags/${id}`, {
                method: 'DELETE'
            })
    },
    savedReplies: {
        list: (departmentId)=>request(`/saved-replies${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ''}`),
        create: (dto)=>request('/saved-replies', {
                method: 'POST',
                body: JSON.stringify(dto)
            }),
        update: (id, dto)=>request(`/saved-replies/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(dto)
            }),
        delete: (id)=>request(`/saved-replies/${id}`, {
                method: 'DELETE'
            })
    }
};
}),
"[project]/frontend/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const idleTimeoutId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tabAwayTimeoutId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    const TAB_AWAY_TIMEOUT_MS = 90 * 1000; // 90 seconds
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const token = localStorage.getItem('token');
        if (token) {
            refreshUser().catch(()=>{
                localStorage.removeItem('token');
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);
    const refreshUser = async ()=>{
        try {
            const userData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.me();
            setUser(userData);
            setLoading(false);
        } catch (error) {
            localStorage.removeItem('token');
            setUser(null);
            setLoading(false);
            throw error;
        }
    };
    const login = async (dto)=>{
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.login(dto);
        localStorage.setItem('token', response.access_token);
        setUser(response.user);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(true);
        } catch  {
        // Ignore initial status update errors
        }
    };
    const register = async (dto)=>{
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.register(dto);
        localStorage.setItem('token', response.access_token);
        setUser(response.user);
    };
    const logout = async ()=>{
        if (user) {
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false);
            } catch  {
            // Ignore error when logging out
            }
        }
        localStorage.removeItem('token');
        setUser(null);
    };
    // Auto-logout after 15 minutes of inactivity
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!user) {
            if (idleTimeoutId.current !== null) {
                window.clearTimeout(idleTimeoutId.current);
                idleTimeoutId.current = null;
            }
            return;
        }
        const handleIdle = async ()=>{
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false);
            } catch  {
            // Ignore errors on background status update
            }
            logout();
        };
        const resetTimer = ()=>{
            if (!user) return;
            if (idleTimeoutId.current !== null) {
                window.clearTimeout(idleTimeoutId.current);
            }
            idleTimeoutId.current = window.setTimeout(handleIdle, IDLE_TIMEOUT_MS);
        };
        const events = [
            'mousemove',
            'keydown',
            'click',
            'focus'
        ];
        events.forEach((event)=>window.addEventListener(event, resetTimer));
        // Handle tab switching (visibilitychange) and closing the window
        const handleVisibilityChange = ()=>{
            if (document.hidden) {
                // Tab is hidden (user switched tabs or minimized) -> wait 90 seconds before going offline
                if (tabAwayTimeoutId.current !== null) {
                    window.clearTimeout(tabAwayTimeoutId.current);
                }
                tabAwayTimeoutId.current = window.setTimeout(()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false).catch(()=>{});
                }, TAB_AWAY_TIMEOUT_MS);
            } else {
                // Tab is active again -> cancel the 90s countdown, tell server we're online
                if (tabAwayTimeoutId.current !== null) {
                    window.clearTimeout(tabAwayTimeoutId.current);
                    tabAwayTimeoutId.current = null;
                }
                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(true).catch(()=>{});
                resetTimer();
            }
        };
        const handleBeforeUnload = ()=>{
            // User is closing the tab/window -> tell server we're offline
            // Note: We use keepalive or a synchronous-like request if possible, but fetch usually fires okay if simple
            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false).catch(()=>{});
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        resetTimer();
        return ()=>{
            events.forEach((event)=>window.removeEventListener(event, resetTimer));
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (idleTimeoutId.current !== null) {
                window.clearTimeout(idleTimeoutId.current);
                idleTimeoutId.current = null;
            }
            if (tabAwayTimeoutId.current !== null) {
                window.clearTimeout(tabAwayTimeoutId.current);
                tabAwayTimeoutId.current = null;
            }
        };
    }, [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            register,
            logout,
            refreshUser
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/contexts/AuthContext.tsx",
        lineNumber: 159,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/tty [external] (tty, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/frontend/src/components/providers/SocketProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SocketProvider",
    ()=>SocketProvider,
    "useSocket",
    ()=>useSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/socket.io-client/build/esm-debug/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const SocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    socket: null,
    isConnected: false
});
const useSocket = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(SocketContext);
const SocketProvider = ({ children })=>{
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [socket, setSocket] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }
        const token = localStorage.getItem('token'); // Matches AuthContext.tsx
        if (!token) return;
        const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        console.log('Socket: Attempting connection to', url, 'with token', token.substring(0, 10) + '...');
        const newSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2d$debug$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(url, {
            auth: {
                token
            },
            transports: [
                'websocket',
                'polling'
            ]
        });
        newSocket.on('connect', ()=>{
            setIsConnected(true);
            console.log('Socket connected:', newSocket.id);
        });
        newSocket.on('disconnect', ()=>{
            setIsConnected(false);
            console.log('Socket disconnected');
        });
        newSocket.on('conversation_updated', (data)=>{
            console.log('RECEIVED conversation_updated:', data);
            // Play a short notification beep using Web Audio API
            try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } catch  {
            // Audio not available (e.g. no user interaction yet) — silently ignore
            }
        });
        setSocket(newSocket);
        return ()=>{
            newSocket.disconnect();
        };
    }, [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SocketContext.Provider, {
        value: {
            socket,
            isConnected
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/providers/SocketProvider.tsx",
        lineNumber: 85,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__13b92505._.js.map