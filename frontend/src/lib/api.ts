const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterAdminDto {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  isActive: boolean;
  isOnline?: boolean;
  orgId: string;
  createdAt?: string;
  assignedCount?: number;
  profilePicture?: string;
  title?: string;
  level?: 'Junior' | 'Middle' | 'Senior';
  ratingTotal: number;
  ratingCount: number;
  stats?: {
    completed: number;
    open: number;
    pending: number;
  };
  departments?: string[];
}

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  // Optional: source channel for this customer (e.g. FACEBOOK_MESSENGER, INSTAGRAM, WHATSAPP, EMAIL)
  source?: 'FACEBOOK_MESSENGER' | 'INSTAGRAM' | 'WHATSAPP' | 'EMAIL';
  // Optional: external identifier from third-party channels (e.g. Facebook PSID)
  externalId?: string;
  // Whether this customer has been explicitly saved as a contact in the CRM
  isSaved?: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'STAFF';
  senderId?: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  orgId: string;
  customerId: string;
  assignedTo?: string;
  departmentId?: string | null;
  status: 'OPEN' | 'CLOSED' | 'PENDING' | 'RESOLVED';
  isStarred?: boolean;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  assignee?: User;
  messages?: Message[];
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: User[];
}

export type RouteTo = 'LIVE_AGENTS_ONLY' | 'OFFLINE_ALLOWED';
export type FallbackBehavior = 'NONE' | 'ASSIGN_ANY_AGENT' | 'ASSIGN_ADMIN';
export type AutoReplyTrigger =
  | 'FIRST_MESSAGE'
  | 'DEPARTMENT_SELECTION'
  | 'NO_AGENT_AVAILABLE'
  | 'AFTER_HOURS';

export interface RoutingSettings {
  id: string;
  orgId: string;
  autoRoutingEnabled: boolean;
  routeTo: RouteTo;
  fallbackBehavior: FallbackBehavior;
  afterHoursConfig?: any;
  metadata?: any;
}

export interface AutoReply {
  id: string;
  orgId: string;
  trigger: AutoReplyTrigger;
  departmentId?: string | null;
  message: string;
  isActive: boolean;
}

export interface CustomerNote {
  content: string;
}

export type TagType = 'CONVERSATION' | 'CUSTOMER';

export interface Tag {
  id: string;
  orgId: string;
  name: string;
  type: TagType;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationNote {
  id: string;
  orgId: string;
  conversationId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface SavedReply {
  id: string;
  orgId: string;
  departmentId?: string | null;
  name: string;
  shortcut?: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (dto: LoginDto) => request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    register: (dto: RegisterAdminDto) => request<AuthResponse>('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    me: () => request<User>('/auth/me'),
    updateStatus: (isOnline: boolean) =>
      request<User>('/auth/status', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline }),
      }),
    updateProfile: (dto: { name?: string; email?: string; password?: string; profilePicture?: string }) =>
      request<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
  },
  conversations: {
    list: () => request<Conversation[]>('/conversations'),
    create: (dto: { customerId: string }) => request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    assign: (id: string, dto: { assigneeId: string }) => request<Conversation>(`/conversations/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
    close: (id: string) => request<Conversation>(`/conversations/${id}/close`, {
      method: 'PATCH',
    }),
    resolve: (id: string) => request<Conversation>(`/conversations/${id}/resolve`, {
      method: 'PATCH',
    }),
    setStarred: (id: string, dto: { isStarred: boolean }) =>
      request<Conversation>(`/conversations/${id}/star`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    updateStatus: (id: string, dto: { status: 'OPEN' | 'CLOSED' | 'PENDING' | 'RESOLVED' }) =>
      request<Conversation>(`/conversations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    listTags: (id: string) => request<Tag[]>(`/conversations/${id}/tags`),
    addTag: (id: string, dto: { tagId: string }) =>
      request<Tag[]>(`/conversations/${id}/tags`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    removeTag: (id: string, tagId: string) =>
      request<Tag[]>(`/conversations/${id}/tags/${tagId}`, {
        method: 'DELETE',
      }),
    listNotes: (id: string) => request<ConversationNote[]>(`/conversations/${id}/notes`),
    createNote: (id: string, dto: { content: string }) =>
      request<ConversationNote>(`/conversations/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  messages: {
    list: (conversationId: string) => request<Message[]>(`/conversations/${conversationId}/messages`),
    create: (conversationId: string, dto: { content: string }) => request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  },
  customers: {
    list: () => request<Customer[]>('/customers'),
    create: (dto: { name?: string; email?: string; phone?: string }) => request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
    get: (id: string) => request<Customer>(`/customers/${id}`),
    update: (id: string, dto: { name?: string; email?: string; phone?: string }) =>
      request<Customer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    getNote: (id: string) => request<CustomerNote>(`/customers/${id}/note`),
    saveNote: (id: string, dto: { content: string }) =>
      request<CustomerNote>(`/customers/${id}/note`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    listTags: (id: string) => request<Tag[]>(`/customers/${id}/tags`),
    addTag: (id: string, dto: { tagId: string }) =>
      request<Tag[]>(`/customers/${id}/tags`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    removeTag: (id: string, tagId: string) =>
      request<Tag[]>(`/customers/${id}/tags/${tagId}`, {
        method: 'DELETE',
      }),
  },
  staff: {
    list: () => request<User[]>('/staff'),
    create: (dto: { name: string; email: string; password: string }) =>
      request<User>('/staff', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (
      id: string,
      dto: { name?: string; email?: string; role?: 'ADMIN' | 'AGENT'; password?: string; isActive?: boolean },
    ) =>
      request<User>(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    deactivate: (id: string) =>
      request<User>(`/staff/${id}/deactivate`, {
        method: 'PATCH',
      }),
  },
  departments: {
    list: () => request<Department[]>('/departments'),
    create: (dto: { name: string }) =>
      request<Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: { name?: string; isActive?: boolean }) =>
      request<Department>(`/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    setMembers: (id: string, dto: { userIds: string[] }) =>
      request<Department>(`/departments/${id}/members`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/departments/${id}`, {
        method: 'DELETE',
      }),
  },
  routing: {
    getSettings: () => request<RoutingSettings>('/routing/settings'),
    updateSettings: (
      dto: Partial<
        Pick<
          RoutingSettings,
          'autoRoutingEnabled' | 'routeTo' | 'fallbackBehavior' | 'afterHoursConfig' | 'metadata'
        >
      >,
    ) =>
      request<RoutingSettings>('/routing/settings', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    listAutoReplies: () => request<AutoReply[]>('/routing/auto-replies'),
    createAutoReply: (dto: { trigger: AutoReplyTrigger; departmentId?: string | null; message: string }) =>
      request<AutoReply>('/routing/auto-replies', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    updateAutoReply: (
      id: string,
      dto: { trigger?: AutoReplyTrigger; departmentId?: string | null; message?: string; isActive?: boolean },
    ) =>
      request<AutoReply>(`/routing/auto-replies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
  },
  meta: {
    deleteData: (dto: { customerId: string }) => request<{ success: boolean }>(
      '/meta/delete-data',
      {
        method: 'POST',
        body: JSON.stringify(dto),
      },
    ),
  },
  tags: {
    list: (type?: TagType) =>
      request<Tag[]>(`/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
    create: (dto: { name: string; type: TagType; color?: string }) =>
      request<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: { name?: string; color?: string | null }) =>
      request<Tag>(`/tags/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/tags/${id}`, {
        method: 'DELETE',
      }),
  },
  savedReplies: {
    list: (departmentId?: string) =>
      request<SavedReply[]>(
        `/saved-replies${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ''}`,
      ),
    create: (dto: { name: string; shortcut?: string; body: string; departmentId?: string | null }) =>
      request<SavedReply>('/saved-replies', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (
      id: string,
      dto: { name?: string; shortcut?: string | null; body?: string; departmentId?: string | null; isActive?: boolean },
    ) =>
      request<SavedReply>(`/saved-replies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/saved-replies/${id}`, {
        method: 'DELETE',
      }),
  },
};

