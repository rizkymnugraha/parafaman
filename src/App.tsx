import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { PdfStoreProvider, InstructionsProvider, SidebarProvider, AboutProvider } from '@/store';
import { usePdfLibraries } from '@/hooks';
import { LoadingScreen } from '@/features/sign';
import { ThemeProvider } from '@/components/theme-provider';

function AppContent() {
  const { librariesLoaded } = usePdfLibraries();

  if (!librariesLoaded) {
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="parafaman-theme">
      <PdfStoreProvider>
        <InstructionsProvider>
          <SidebarProvider>
            <AboutProvider>
              <AppContent />
            </AboutProvider>
          </SidebarProvider>
        </InstructionsProvider>
      </PdfStoreProvider>
    </ThemeProvider>
  );
}
