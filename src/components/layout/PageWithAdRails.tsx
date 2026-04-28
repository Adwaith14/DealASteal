import type { ReactNode } from 'react';

const LAYOUT_MAX = 'max-w-[1400px]';

type Props = {
  children: ReactNode;
  /** Tailwind classes for the center column wrapper (padding, vertical rhythm). */
  className?: string;
};

/**
 * 30-40-30 layout wrapper: Left ad rail (30%), Center content (40%), Right ad rail (30%).
 */
export function PageWithAdRails({ children, className = '' }: Props) {
  return (
    <div className={`mx-auto min-w-0 max-w-full ${LAYOUT_MAX} w-full flex-1 bg-white`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[30%_40%_30%]">
        {/* Left Ad Container */}
        <aside className="hidden lg:block w-full h-full min-h-[300px] bg-slate-50 border-r border-slate-100 p-4">
          <div className="sticky top-20 w-full h-auto flex flex-col items-center text-slate-400 text-xs font-semibold tracking-wider">
            {/* Ad Placeholder */}
            <div className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
              ADVERTISEMENT
            </div>
          </div>
        </aside>

        {/* Center Main Content */}
        <div className={`min-w-0 w-full px-4 sm:px-6 lg:px-8 ${className}`}>
          {children}
        </div>

        {/* Right Ad Container */}
        <aside className="hidden lg:block w-full h-full min-h-[300px] bg-slate-50 border-l border-slate-100 p-4">
          <div className="sticky top-20 w-full h-auto flex flex-col items-center text-slate-400 text-xs font-semibold tracking-wider">
            {/* Ad Placeholder */}
            <div className="w-full aspect-[4/5] border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
              ADVERTISEMENT
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
