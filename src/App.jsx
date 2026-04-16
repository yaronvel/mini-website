import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import './App.css';

const ConfigurationPage = lazy(() => import('./pages/Configuration'));

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

function ConfigurationRoute() {
  return (
    <Suspense
      fallback={
        <div className="steps-page">
          <div className="steps-loading">
            <div className="spinner" />
            <p>Loading configuration…</p>
          </div>
        </div>
      }
    >
      <ConfigurationPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <div className="App">
        <nav className="app-top-nav" aria-label="Main">
          <Link to="/">Home</Link>
          <Link to="/configuration">configuration</Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/configuration" element={<ConfigurationRoute />} />
          <Route path="/steps" element={<ConfigurationRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
