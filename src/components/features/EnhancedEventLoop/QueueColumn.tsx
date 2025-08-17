import type { Task } from '@/types/enhancedEventLoop';

type Props = {
  title: string;
  colorClass: string;
  items: Task[] | string[];
  lastRunId?: string;
};

export default function QueueColumn({ title, colorClass, items, lastRunId }: Props) {
  return (
    <div className="flex-1 border rounded-lg p-3 bg-white">
      <div className="mb-2 font-semibold">{title}</div>
      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="text-xs text-gray-400 italic">empty</div>
        )}
        {items.map((it: any) => {
          const key = typeof it === 'string' ? it : it.id;
          const label = typeof it === 'string' ? it : it.label;
          const isLast = typeof it !== 'string' && it.id === lastRunId;
          return (
            <div
              key={key}
              className={[
                'task-chip border border-opacity-30 transition-transform duration-300',
                colorClass,
                isLast ? 'animate-pulse ring-2 ring-offset-2' : ''
              ].join(' ')}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
