import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

// For compatibility with shadcn patterns, create these components
const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);

const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('relative', className)}>
    {children}
  </div>
);

const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => (
  <span className="text-muted-foreground">{placeholder}</span>
);

// Simple Select component that works like a regular select
const SimpleSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </select>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SimpleSelect };