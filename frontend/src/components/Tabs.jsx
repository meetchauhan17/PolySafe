// src/components/Tabs.jsx
import React, { createContext, useContext, useId } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const TabsContext = createContext(null);

export function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be rendered inside a <Tabs> provider');
  }
  return context;
}

/**
 * Accessible Tabs with layout animation in ivory-paper with soft shadow.
 * Can be used as a compound component (<Tabs><TabList><Tab/></TabList><TabPanel/></Tabs>)
 * or with a `tabs` array prop.
 */
export default function Tabs({
  tabs,
  value,
  onChange,
  children,
  variant = 'pill', // 'pill' | 'line'
  className,
  ...props
}) {
  const generatedId = useId();
  const activeValue = value;
  const layoutId = `tabs-indicator-${generatedId}`;

  const contextValue = {
    activeValue,
    onChange,
    variant,
    layoutId,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={clsx('flex flex-col gap-4 w-full', className)} {...props}>
        {tabs ? (
          <>
            <TabList>
              {tabs.map((tab) => (
                <Tab key={tab.id || tab.value} id={tab.id || tab.value} icon={tab.icon}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>
            {tabs.map((tab) => (
              <TabPanel key={tab.id || tab.value} id={tab.id || tab.value}>
                {tab.content}
              </TabPanel>
            ))}
          </>
        ) : (
          children
        )}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, fullWidth = false }) {
  const { variant } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={clsx(
        'relative inline-flex items-center gap-1 select-none',
        variant === 'pill'
          ? 'p-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] max-w-full overflow-x-auto no-scrollbar'
          : 'border-b border-[var(--border)] gap-6 w-full overflow-x-auto no-scrollbar',
        fullWidth && 'w-full flex',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Tab({ id, children, icon, disabled = false, className }) {
  const { activeValue, onChange, variant, layoutId } = useTabsContext();
  const isSelected = String(activeValue) === String(id);

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-controls={`panel-${id}`}
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(id)}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 font-[var(--font-heading)] font-semibold transition-all duration-[120ms] ease-out select-none cursor-pointer',
        'min-h-[44px] px-4 py-2 text-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] active:scale-[0.98]',
        variant === 'pill' && 'rounded-full z-10',
        variant === 'line' && 'pb-3 pt-2 border-b-2 -mb-[1px]',
        isSelected
          ? variant === 'pill'
            ? 'text-[var(--ink)] font-bold'
            : 'text-[var(--brand-600)] border-[var(--brand-600)] font-bold'
          : variant === 'pill'
          ? 'text-[var(--ink-3)] hover:text-[var(--ink)]'
          : 'text-[var(--ink-3)] border-transparent hover:text-[var(--ink)] hover:border-[var(--border-strong)]',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {/* Sliding Ivory-Paper Pill Indicator */}
      {isSelected && variant === 'pill' && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-full bg-[var(--paper)] shadow-[var(--shadow-sm)] border border-[var(--border)] -z-10"
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 32,
            mass: 0.8,
          }}
        />
      )}

      {/* Sliding Line Indicator */}
      {isSelected && variant === 'line' && (
        <motion.div
          layoutId={layoutId}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-600)]"
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 32,
          }}
        />
      )}

      {icon && (
        <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function TabPanel({ id, children, className }) {
  const { activeValue } = useTabsContext();
  const isSelected = String(activeValue) === String(id);

  if (!isSelected) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={clsx('focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] rounded-lg', className)}
    >
      {children}
    </div>
  );
}

export { Tabs };
