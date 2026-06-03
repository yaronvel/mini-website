import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import Configuration from './pages/Configuration';
import { RpcTokenProvider, RpcTokenNavButton } from './context/RpcTokenContext';
import './App.css';

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export default function App() {
  return (
    <RpcTokenProvider>
      <BrowserRouter basename={routerBasename}>
        <div className="App">
          <nav className="app-top-nav" aria-label="Main">
            <Link to="/">Home</Link>
            <Link to="/configuration">configuration</Link>
            <RpcTokenNavButton />
          </nav>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/steps" element={<Configuration />} />
          </Routes>
        </div>
      </BrowserRouter>
    </RpcTokenProvider>
  );
}
