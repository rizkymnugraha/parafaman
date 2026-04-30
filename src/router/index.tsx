import { createBrowserRouter } from 'react-router-dom';
import {
  LandingPage,
  SignPage,
  SplitPage,
  MergePage,
  CompressPage,
  OrganizePage,
  ToImagesPage,
  FromImagesPage,
  UnlockPage,
  LockPage,
  ReversePage,
  InspectPage,
  PageNumbersPage,
  WatermarkPage,
  CropPage,
  NUpPage,
  RepairPage,
  WhatsNewPage,
  PrivacyPage,
} from '@/pages';
import { Layout } from '@/components/Layout';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/sign', element: <SignPage /> },
      { path: '/editor', element: <SignPage /> }, // legacy redirect path
      { path: '/split', element: <SplitPage /> },
      { path: '/merge', element: <MergePage /> },
      { path: '/compress', element: <CompressPage /> },
      { path: '/organize', element: <OrganizePage /> },
      { path: '/to-images', element: <ToImagesPage /> },
      { path: '/from-images', element: <FromImagesPage /> },
      { path: '/unlock', element: <UnlockPage /> },
      { path: '/lock', element: <LockPage /> },
      { path: '/reverse', element: <ReversePage /> },
      { path: '/inspect', element: <InspectPage /> },
      { path: '/page-numbers', element: <PageNumbersPage /> },
      { path: '/watermark', element: <WatermarkPage /> },
      { path: '/crop', element: <CropPage /> },
      { path: '/n-up', element: <NUpPage /> },
      { path: '/repair', element: <RepairPage /> },
      { path: '/whats-new', element: <WhatsNewPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
    ],
  },
]);
