import { useEffect, useRef, useState } from 'react';
import { QueueColumn, Controls } from '@/components/features';
import { createInitialState, step } from '@/engine/eventLoop';
import type { LoopState } from '@/types';
import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/event-loop' as any)({
  component: EventLoopSimulator,
})
function EventLoopSimulator() {
  const [state, setState] = useState<LoopState>(() => createInitialState());
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleStep = () => setState(prev => step(prev));
  const handleReset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setState(createInitialState());
  };

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      setState(prev => step(prev));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">JavaScript Event Loop Simulator</h1>
        <p className="text-sm text-gray-600">
          Mô phỏng thứ tự thực thi: <span className="font-medium">Microtasks</span> → <span className="font-medium">Macrotask (1)</span> → <span className="font-medium">Render (1)</span> mỗi “tick”.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 flex flex-col gap-6 pb-12">
        <Controls
          state={state}
          setState={setState}
          onStep={handleStep}
          onReset={handleReset}
          playing={playing}
          setPlaying={setPlaying}
        />

        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <QueueColumn title="Call Stack" colorClass="border-stack" items={state.callStack} />
          <QueueColumn title="Microtasks queue" colorClass="border-micro" items={state.microtasks} />
          <QueueColumn title="Macrotasks queue" colorClass="border-macro" items={state.macrotasks} />
          <QueueColumn title="Render queue" colorClass="border-render" items={state.renderQueue} />
        </section>

        <section className="border rounded-lg bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Timeline</div>
            <div className="text-xs text-gray-500">tick: {state.tick}</div>
          </div>
          <div className="mt-2 max-h-64 overflow-auto text-sm">
            {state.logs.slice(-200).map((l, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-14 shrink-0 text-gray-400">#{l.tick}</div>
                <div className="font-mono">
                  <span className="uppercase mr-2 text-gray-600">{l.action}</span>
                  <span className="text-gray-800">{l.detail}</span>
                </div>
              </div>
            ))}
            {state.logs.length === 0 && <div className="text-gray-400 italic">No logs yet</div>}
          </div>
        </section>

        <section className="text-sm text-gray-600">
          <details>
            <summary className="cursor-pointer font-medium">Giải thích mô phỏng</summary>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Microtasks (ví dụ: <code>Promise.then</code>, <code>queueMicrotask</code>) được “drain” toàn bộ trước khi lấy 1 macrotask.</li>
              <li>Mỗi tick: chạy hết microtasks → chạy 1 macrotask → chạy 1 công việc render.</li>
              <li>Đây là mô phỏng có chủ đích để thấy thứ tự — không thực thi mã “thật” của trình duyệt.</li>
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
