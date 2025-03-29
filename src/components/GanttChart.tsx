import React from 'react';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth } from 'date-fns';

interface GanttItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  type: 'program' | 'goal' | 'milestone';
  parentId?: string;
}

interface GanttChartProps {
  items: GanttItem[];
  startDate: Date;
  endDate: Date;
}

export function GanttChart({ items, startDate, endDate }: GanttChartProps) {
  const months = React.useMemo(() => {
    const months = [];
    let currentDate = startOfMonth(startDate);
    const lastDate = endOfMonth(endDate);

    while (currentDate <= lastDate) {
      months.push({
        date: currentDate,
        label: format(currentDate, 'MMM yyyy')
      });
      currentDate = addDays(currentDate, 32);
      currentDate = startOfMonth(currentDate);
    }

    return months;
  }, [startDate, endDate]);

  const totalDays = differenceInDays(endDate, startDate);

  const getItemPosition = (item: GanttItem) => {
    const itemStart = parseISO(item.startDate);
    const itemEnd = parseISO(item.endDate);
    
    const startOffset = Math.max(0, differenceInDays(itemStart, startDate));
    const duration = differenceInDays(itemEnd, itemStart);
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <div className="min-w-full">
        {/* Header with months */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <div className="w-48 flex-shrink-0 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </div>
            <div className="flex-grow relative h-10">
              {months.map((month, index) => (
                <div
                  key={month.label}
                  className="absolute top-0 px-2 py-3 text-xs font-medium text-gray-500"
                  style={{
                    left: `${(differenceInDays(month.date, startDate) / totalDays) * 100}%`
                  }}
                >
                  {month.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gantt items */}
        <div>
          {items.map(item => (
            <div key={item.id} className="flex border-b border-gray-200">
              <div className="w-48 flex-shrink-0 px-6 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </div>
              <div className="flex-grow relative h-12">
                <div
                  className={`absolute top-2 h-8 rounded ${
                    item.type === 'program'
                      ? 'bg-blue-100'
                      : item.type === 'goal'
                      ? 'bg-green-100'
                      : 'bg-violet-100'
                  }`}
                  style={getItemPosition(item)}
                >
                  <div
                    className={`h-full rounded ${
                      item.type === 'program'
                        ? 'bg-blue-500'
                        : item.type === 'goal'
                        ? 'bg-green-500'
                        : 'bg-violet-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 