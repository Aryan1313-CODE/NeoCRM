import { useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { navigation, settingsNav } from '../components/layout/nav';
import { PermissionGate } from '../permissions/PermissionGate';

const descriptions: Record<string, string> = {
 Customers: 'A clear view of the companies and people behind every relationship.',
 Leads: 'Follow emerging opportunities from first conversation to qualification.',
 Deals: 'Keep your pipeline moving across the chemical value chain.',
 Products: 'A home for your products, grades, and technical specifications.',
 Quotes: 'Bring pricing conversations and customer proposals into focus.',
 Orders: 'A shared view of order progress and customer commitments.',
 Compliance: 'Keep regulatory documentation connected to your products and accounts.',
 Analytics: 'Understand performance across your customer relationships and pipeline.',
 Tasks: 'Keep the next customer conversation and follow-up in sight.',
 Settings: 'Shape workspace preferences for the way your team works.',
};
function CustomerActionPreview({ name }: { name: string }) {
 if (name !== 'Customers' && name !== 'Leads') return null;
 return <section className="permission-actions" aria-label={`${name} actions preview`}><div><p className="eyebrow">PERMISSION-AWARE ACTIONS</p><h2>Available actions</h2></div><div className="permission-action-list">{name === 'Customers' && <><PermissionGate permission="customers.create"><Button variant="secondary" disabled title="Available in a future phase">＋ Add customer</Button></PermissionGate><PermissionGate permission="customers.edit"><Button variant="secondary" disabled title="Available in a future phase">Edit</Button></PermissionGate><PermissionGate permission="customers.delete"><Button variant="secondary" disabled title="Available in a future phase">Delete</Button></PermissionGate></>}{name === 'Leads' && <PermissionGate permission="leads.create"><Button variant="secondary" disabled title="Available in a future phase">＋ Add lead</Button></PermissionGate>}</div><p className="permission-action-note">Actions are preview-only; CRM operations are not implemented.</p></section>;
}
export function PlaceholderPage() {
 const path = useLocation().pathname;
 const item = [...navigation.flatMap(section => section.items), settingsNav].find(entry => entry.path === path);
 const name = item?.label ?? 'Workspace';
 return <div className="page placeholder-page"><p className="eyebrow">CHEMORA GROUP <span className="heading-dot">·</span> WORKSPACE</p><div className="placeholder-heading"><div><h1>{name}</h1><p className="page-subtitle">{descriptions[name]}</p></div><span className="placeholder-symbol" aria-hidden="true">{item?.icon}</span></div><CustomerActionPreview name={name}/><div className="placeholder-content"><Card className="placeholder-card"><span className="placeholder-card-icon" aria-hidden="true">{item?.icon}</span><Badge tone="amber">Coming in a future phase</Badge><h2>{name} management</h2><p>This {name.toLowerCase()} module will connect to NeoCRM services in a later phase. This frontend preview uses no live data or backend connections.</p><span className="placeholder-divider"/><span className="placeholder-caption">DAY 1 · FRONTEND FOUNDATION</span></Card><aside className="placeholder-aside"><p className="eyebrow">DESIGNED FOR YOUR INDUSTRY</p><h2>Every detail, considered.</h2><p>A focused workspace for the people, products, and processes that keep the chemical value chain moving.</p><div className="aside-rule"/><span className="aside-signature">Chemora Group <i>·</i> NeoCRM</span></aside></div><footer className="page-footer"><span>NeoCRM <span className="footer-sep">/</span> {name.toLowerCase()}</span><span>Frontend preview · No live data</span></footer></div>;
}
