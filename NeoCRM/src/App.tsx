import { AppRoutes } from './routes/AppRoutes';
import { AppStoreProvider } from './store/appStore';
import { AuthProvider } from './auth/AuthProvider';
import { PermissionProvider } from './permissions/PermissionProvider';
import { FeedbackProvider } from './feedback/FeedbackProvider';
import { ErrorBoundary } from './feedback/ErrorBoundary';
export default function App(){return <ErrorBoundary><AuthProvider><PermissionProvider><AppStoreProvider><FeedbackProvider><AppRoutes/></FeedbackProvider></AppStoreProvider></PermissionProvider></AuthProvider></ErrorBoundary>;}
