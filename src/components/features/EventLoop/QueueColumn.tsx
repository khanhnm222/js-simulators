import type { Task } from '@/types';

type Props = {
  title: string;
  colorClass: string;
  items: Task[] | string[];
};

export default function QueueColumn({ title, colorClass, items }: Props) {
  return (
    <div className="flex-1 border rounded-lg p-3 bg-white">
      <div className="mb-2 font-semibold">{title}</div>
      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="text-xs text-gray-400 italic">empty</div>
        )}
        {items.map((it: any) => (
          <div
            key={typeof it === 'string' ? it : it.id}
            className={`task-chip border ${colorClass} border-opacity-30`}
          >
            {typeof it === 'string' ? it : it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
