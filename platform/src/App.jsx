import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CommunityProvider } from './context/CommunityContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import { CohortProvider } from './context/CohortContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Explore from './pages/Explore.jsx';
import Analyse from './pages/Analyse.jsx';
import Pool from './pages/Pool.jsx';
import Research from './pages/Research.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import People from './pages/People.jsx';
import Families from './pages/Families.jsx';
import Mod from './pages/Mod.jsx';
import Account from './pages/Account.jsx';
import Rules from './pages/Rules.jsx';
import Privacy from './pages/Privacy.jsx';
import About from './pages/About.jsx';
import BrainLab from './pages/BrainLab.jsx';
import NotFound from './pages/NotFound.jsx';

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
      { path: 'research', element: <Research /> },
      { path: 'research/t/:id', element: <ThreadPage space="research" /> },
      { path: 'research/:board', element: <Research /> },
      { path: 'people', element: <People /> },
      { path: 'families', element: <Families /> },
      { path: 'families/t/:id', element: <ThreadPage space="family" /> },
      { path: 'families/:board', element: <Families /> },
      { path: 'mod', element: <Mod /> },
      { path: 'account', element: <Account /> },
      { path: 'rules', element: <Rules /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'about', element: <About /> },
      { path: 'community', element: <Research /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <CommunityProvider>
          <UIProvider>
            <CohortProvider>
              <RouterProvider router={router} />
            </CohortProvider>
          </UIProvider>
        </CommunityProvider>
      </AuthProvider>
    </AppProvider>
  );
}
