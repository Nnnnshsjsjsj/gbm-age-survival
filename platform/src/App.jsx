import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { CohortProvider } from './context/CohortContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Analyse from './pages/Analyse.jsx';
import Pool from './pages/Pool.jsx';
import Privacy from './pages/Privacy.jsx';
import About from './pages/About.jsx';
import BrainLab from './pages/BrainLab.jsx';
import NotFound from './pages/NotFound.jsx';
import { PageSkeleton } from './components/ui.jsx';

// The two guides carry large JSON catalogues and their own 3D scenes: load them on demand.
const Hub = lazy(() => import('./pages/Hub.jsx'));
const Patients = lazy(() => import('./pages/Patients.jsx'));
const lazyPage = (el) => <Suspense fallback={<PageSkeleton />}>{el}</Suspense>;

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'brain', element: <BrainLab /> },
      { path: 'explore', element: <Explore /> },
      { path: 'analyse', element: <Analyse /> },
      { path: 'analyse/:step', element: <Analyse /> },
      { path: 'pool', element: <Pool /> },
      { path: 'hub', element: lazyPage(<Hub />) },
      { path: 'patients', element: lazyPage(<Patients />) },
      { path: 'privacy', element: <Privacy /> },
      { path: 'about', element: <About /> },
      // v5 addresses that people may have bookmarked
      { path: 'research/*', element: <Navigate to="/hub" replace /> },
      { path: 'research', element: <Navigate to="/hub" replace /> },
      { path: 'people', element: <Navigate to="/hub" replace /> },
      { path: 'community', element: <Navigate to="/hub" replace /> },
      { path: 'families/*', element: <Navigate to="/patients" replace /> },
      { path: 'families', element: <Navigate to="/patients" replace /> },
      { path: 'rules', element: <Navigate to="/privacy" replace /> },
      { path: 'account', element: <Navigate to="/" replace /> },
      { path: 'mod', element: <Navigate to="/" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <AppProvider>
      <CohortProvider>
        <RouterProvider router={router} />
      </CohortProvider>
    </AppProvider>
  );
}
