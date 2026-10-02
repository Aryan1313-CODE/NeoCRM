import { AuthProvider } from '../auth/AuthProvider';
import { PermissionProvider } from '../permissions/PermissionProvider';
import { LoadingProvider } from './LoadingProvider';
import { FeedbackProvider } from '../feedback/FeedbackProvider';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { AppStoreProvider } from '../store/appStore';
import { AppRoutes } from '../routes/AppRoutes';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PermissionProvider>
          <AppStoreProvider>
            <LoadingProvider>
              <FeedbackProvider>
                <AppRoutes />
              </FeedbackProvider>
            </LoadingProvider>
          </AppStoreProvider>
        </PermissionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
