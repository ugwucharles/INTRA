import React from 'react';
import Image from 'next/image';
import { User } from '@/lib/api';

interface StaffCardProps {
  staff: User & {
    title?: string;
    stats?: { completed?: number; open?: number; pending?: number };
  };
  onClick?: () => void;
}

export function StaffCard({ staff, onClick }: StaffCardProps) {
  const { name, title, stats, profilePicture, isOnline, role } = staff;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-4 hover:bg-gray-50/80 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
          {profilePicture ? (
            <Image src={profilePicture} alt={name} width={44} height={44} className="object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-600">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`}
            />
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{title || staff.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {role}
            </span>
            {staff.ratingCount > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                ⭐ {(staff.ratingTotal / staff.ratingCount).toFixed(1)}/10
              </span>
            )}
            {(stats?.open ?? 0) > 0 && (
              <span className="text-[10px] text-emerald-600 font-medium">{stats?.open} open</span>
            )}
            {(stats?.completed ?? 0) > 0 && (
              <span className="text-[10px] text-gray-400">{stats?.completed} closed</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
