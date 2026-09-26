import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CohortProvider } from './context/CohortContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Analyse from './pages/Analyse.jsx';
import Pool from './pages/Pool.jsx';
import Community from './pages/Community.jsx';
import Admin from './pages/Admin.jsx';
import About from './pages/About.jsx';

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', element: <Explore /> },
      { path: 'analyse', element: <Analyse /> },
      { path: 'analyse/:step', element: <Analyse /> },
      { path: 'pool', element: <Pool /> },
      { path: 'community', element: <Community /> },
      { path: 'admin', element: <Admin /> },
      { path: 'about', element: <About /> },
      { path: '*', element: <Home /> },
    ],
  },
]);

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <CohortProvider>
          <RouterProvider router={router} />
        </CohortProvider>
      </AuthProvider>
    </AppProvider>
  );
}
