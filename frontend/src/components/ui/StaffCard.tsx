import React from 'react';
import Image from 'next/image';
import { User } from '@/lib/api';
import { Card } from './Card';

interface StaffCardProps {
    staff: User;
    onClick?: () => void;
}

export function StaffCard({ staff, onClick }: StaffCardProps) {
    const { name, title, stats, profilePicture, isActive, isOnline } = staff;

    return (
        <Card
            onClick={onClick}
            className="p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer bg-white border-gray-100 group relative overflow-hidden"
        >
            {/* Active/Online Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] font-medium text-gray-400">
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                        {profilePicture ? (
                            <Image
                                src={profilePicture}
                                alt={name}
                                width={80}
                                height={80}
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-gray-300">
                                {name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                        {name}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{title || 'UI/UX Designer'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-gray-50">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">
                            {staff.ratingCount > 0 
                                ? (staff.ratingTotal / staff.ratingCount).toFixed(1) 
                                : '0.0'}
                            <span className="text-sm text-yellow-400 ml-1">★</span>
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 leading-tight">Avg Rating ({staff.ratingCount})</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">{stats?.completed ?? 0}</span>
                        <span className="text-[10px] font-medium text-gray-400 leading-tight">Completed</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
