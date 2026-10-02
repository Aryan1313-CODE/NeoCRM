import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) { return <div className={classNames('card', className)} {...props}>{children}</div>; }
