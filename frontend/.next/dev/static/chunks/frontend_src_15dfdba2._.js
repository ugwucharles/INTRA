(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
async function request(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem('token') : "TURBOPACK unreachable";
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const idleTimeoutId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tabAwayTimeoutId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    const TAB_AWAY_TIMEOUT_MS = 90 * 1000; // 90 seconds
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const token = localStorage.getItem('token');
            if (token) {
                refreshUser().catch({
                    "AuthProvider.useEffect": ()=>{
                        localStorage.removeItem('token');
                        setLoading(false);
                    }
                }["AuthProvider.useEffect"]);
            } else {
                setLoading(false);
            }
        }
    }["AuthProvider.useEffect"], []);
    const refreshUser = async ()=>{
        try {
            const userData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.me();
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
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.login(dto);
        localStorage.setItem('token', response.access_token);
        setUser(response.user);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(true);
        } catch  {
        // Ignore initial status update errors
        }
    };
    const register = async (dto)=>{
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.register(dto);
        localStorage.setItem('token', response.access_token);
        setUser(response.user);
    };
    const logout = async ()=>{
        if (user) {
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false);
            } catch  {
            // Ignore error when logging out
            }
        }
        localStorage.removeItem('token');
        setUser(null);
    };
    // Auto-logout after 15 minutes of inactivity
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            if (!user) {
                if (idleTimeoutId.current !== null) {
                    window.clearTimeout(idleTimeoutId.current);
                    idleTimeoutId.current = null;
                }
                return;
            }
            const handleIdle = {
                "AuthProvider.useEffect.handleIdle": async ()=>{
                    try {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false);
                    } catch  {
                    // Ignore errors on background status update
                    }
                    logout();
                }
            }["AuthProvider.useEffect.handleIdle"];
            const resetTimer = {
                "AuthProvider.useEffect.resetTimer": ()=>{
                    if (!user) return;
                    if (idleTimeoutId.current !== null) {
                        window.clearTimeout(idleTimeoutId.current);
                    }
                    idleTimeoutId.current = window.setTimeout(handleIdle, IDLE_TIMEOUT_MS);
                }
            }["AuthProvider.useEffect.resetTimer"];
            const events = [
                'mousemove',
                'keydown',
                'click',
                'focus'
            ];
            events.forEach({
                "AuthProvider.useEffect": (event)=>window.addEventListener(event, resetTimer)
            }["AuthProvider.useEffect"]);
            // Handle tab switching (visibilitychange) and closing the window
            const handleVisibilityChange = {
                "AuthProvider.useEffect.handleVisibilityChange": ()=>{
                    if (document.hidden) {
                        // Tab is hidden (user switched tabs or minimized) -> wait 90 seconds before going offline
                        if (tabAwayTimeoutId.current !== null) {
                            window.clearTimeout(tabAwayTimeoutId.current);
                        }
                        tabAwayTimeoutId.current = window.setTimeout({
                            "AuthProvider.useEffect.handleVisibilityChange": ()=>{
                                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false).catch({
                                    "AuthProvider.useEffect.handleVisibilityChange": ()=>{}
                                }["AuthProvider.useEffect.handleVisibilityChange"]);
                            }
                        }["AuthProvider.useEffect.handleVisibilityChange"], TAB_AWAY_TIMEOUT_MS);
                    } else {
                        // Tab is active again -> cancel the 90s countdown, tell server we're online
                        if (tabAwayTimeoutId.current !== null) {
                            window.clearTimeout(tabAwayTimeoutId.current);
                            tabAwayTimeoutId.current = null;
                        }
                        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(true).catch({
                            "AuthProvider.useEffect.handleVisibilityChange": ()=>{}
                        }["AuthProvider.useEffect.handleVisibilityChange"]);
                        resetTimer();
                    }
                }
            }["AuthProvider.useEffect.handleVisibilityChange"];
            const handleBeforeUnload = {
                "AuthProvider.useEffect.handleBeforeUnload": ()=>{
                    // User is closing the tab/window -> tell server we're offline
                    // Note: We use keepalive or a synchronous-like request if possible, but fetch usually fires okay if simple
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].auth.updateStatus(false).catch({
                        "AuthProvider.useEffect.handleBeforeUnload": ()=>{}
                    }["AuthProvider.useEffect.handleBeforeUnload"]);
                }
            }["AuthProvider.useEffect.handleBeforeUnload"];
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('beforeunload', handleBeforeUnload);
            resetTimer();
            return ({
                "AuthProvider.useEffect": ()=>{
                    events.forEach({
                        "AuthProvider.useEffect": (event)=>window.removeEventListener(event, resetTimer)
                    }["AuthProvider.useEffect"]);
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
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
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
_s(AuthProvider, "jF6GXjrANW/XhZ8f6y84Eg2aRUw=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/providers/SocketProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SocketProvider",
    ()=>SocketProvider,
    "useSocket",
    ()=>useSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/frontend/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/contexts/AuthContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const SocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    socket: null,
    isConnected: false
});
const useSocket = ()=>{
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SocketContext);
};
_s(useSocket, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
const SocketProvider = ({ children })=>{
    _s1();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [socket, setSocket] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SocketProvider.useEffect": ()=>{
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
            const url = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            console.log('Socket: Attempting connection to', url, 'with token', token.substring(0, 10) + '...');
            const newSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(url, {
                auth: {
                    token
                },
                transports: [
                    'websocket',
                    'polling'
                ]
            });
            newSocket.on('connect', {
                "SocketProvider.useEffect": ()=>{
                    setIsConnected(true);
                    console.log('Socket connected:', newSocket.id);
                }
            }["SocketProvider.useEffect"]);
            newSocket.on('disconnect', {
                "SocketProvider.useEffect": ()=>{
                    setIsConnected(false);
                    console.log('Socket disconnected');
                }
            }["SocketProvider.useEffect"]);
            newSocket.on('conversation_updated', {
                "SocketProvider.useEffect": (data)=>{
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
                }
            }["SocketProvider.useEffect"]);
            setSocket(newSocket);
            return ({
                "SocketProvider.useEffect": ()=>{
                    newSocket.disconnect();
                }
            })["SocketProvider.useEffect"];
        }
    }["SocketProvider.useEffect"], [
        user
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SocketContext.Provider, {
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
_s1(SocketProvider, "Lq2+8CNb/Js5HfPWSeCdGXPosD4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SocketProvider;
var _c;
__turbopack_context__.k.register(_c, "SocketProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_15dfdba2._.js.map