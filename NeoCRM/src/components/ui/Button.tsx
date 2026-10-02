import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; children: ReactNode };
export function Button({ variant = 'primary', className, children, ...props }: Props) { return <button className={classNames('button', `button-${variant}`, className)} {...props}>{children}</button>; }
