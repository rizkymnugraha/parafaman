import { createBrowserRouter } from 'react-router-dom';
import { LandingPage, EditorPage, PrivacyPage } from '@/pages';
import { Layout } from '@/components/Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      {
        path: '/editor',
        element: <EditorPage />,
      },
      {
        path: '/privacy',
        element: <PrivacyPage />,
      },
    ],
  },
]);
