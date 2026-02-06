import React from 'react';
import { DayByDayActivity } from '../data/dayByDayActivities';
import mediaUrl from '@/lib/media/mediaUrl';

interface DayByDayViewProps {
  day: number;
  data: DayByDayActivity;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export function DayByDayView({ day, data, onPrevDay, onNextDay }: DayByDayViewProps) {
  return (
    <div className="grid grid-rows-2 min-h-0 h-full gap-3">
      {/* Morning activity */}
      <div className="row-span-1 h-full min-h-0 w-full bg-white/10 rounded-lg flex items-stretch overflow-hidden">
        <div className="relative w-full h-full bg-black/5 rounded overflow-hidden">
          <img
            src={mediaUrl(data.morning.media) || data.morning.media}
            alt={data.morning.title}
            className="block object-cover w-full h-full"
            style={{ borderRadius: 8 }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="bg-white/90 p-3 rounded-t-lg border-2 border-gray-300 text-center w-full">
              <h3 className="font-bold text-lg text-gray-900 mb-1">MORNING {data.morning.title}</h3>
              <p className="text-sm text-gray-700 line-clamp-2">{data.morning.text}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Afternoon activity */}
      <div className="row-span-1 h-full min-h-0 w-full bg-white/10 rounded-lg flex items-stretch overflow-hidden">
        <div className="relative w-full h-full bg-black/5 rounded overflow-hidden">
          <img
            src={mediaUrl(data.afternoon.media) || data.afternoon.media}
            alt={data.afternoon.title}
            className="block object-cover w-full h-full"
            style={{ borderRadius: 8 }}
          />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <div className="bg-white/90 p-3 rounded-t-lg border-2 border-gray-300 text-center w-full">
              <h3 className="font-bold text-lg text-gray-900 mb-1">AFTERNOON {data.afternoon.title}</h3>
              <p className="text-sm text-gray-700 line-clamp-2">{data.afternoon.text}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayByDayView;