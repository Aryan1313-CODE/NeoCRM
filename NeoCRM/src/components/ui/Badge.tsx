import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';
export function Badge({ tone = 'neutral', className, children, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'green' | 'amber' | 'red'; children: ReactNode }) { return <span className={classNames('badge', `badge-${tone}`, className)} {...props}>{children}</span>; }
