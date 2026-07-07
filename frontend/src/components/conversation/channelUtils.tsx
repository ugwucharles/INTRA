import { Customer } from '@/lib/api';

export function getCustomerDisplayName(customer?: Customer): string {
  if (!customer) return 'Unknown Customer';
  if (customer.name) return customer.name;
  switch (customer.source) {
    case 'FACEBOOK_MESSENGER':
      return 'Facebook Messenger user';
    case 'INSTAGRAM':
      return 'Instagram user';
    case 'WHATSAPP':
      return 'WhatsApp user';
    default:
      return customer.email || 'Unknown Customer';
  }
}

export function getCustomerInitial(customer?: Customer): string {
  return (customer?.name || customer?.email || '?').charAt(0).toUpperCase();
}

export function getChannelLabel(source?: Customer['source']): string | null {
  switch (source) {
    case 'FACEBOOK_MESSENGER':
      return 'Facebook';
    case 'INSTAGRAM':
      return 'Instagram';
    case 'WHATSAPP':
      return 'WhatsApp';
    default:
      return null;
  }
}

export function getChannelColor(source?: Customer['source']): string {
  switch (source) {
    case 'FACEBOOK_MESSENGER':
      return 'text-blue-600 bg-blue-50';
    case 'INSTAGRAM':
      return 'text-pink-600 bg-pink-50';
    case 'WHATSAPP':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-emerald-500';
    case 'PENDING':
      return 'bg-amber-500';
    case 'RESOLVED':
      return 'bg-blue-500';
    case 'CLOSED':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

export function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
