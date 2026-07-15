import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RobinhoodPage } from './pages/RobinhoodPage';
import Configuration from './pages/Configuration';
import { RpcTokenProvider, RpcTokenNavButton } from './context/RpcTokenContext';
import './App.css';

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <RpcTokenProvider>
        <div className="App">
          <nav className="app-top-nav" aria-label="Main">
            <Link to="/">Home</Link>
            <Link to="/robinhood">robinhood</Link>
            <Link to="/configuration">configuration</Link>
            <RpcTokenNavButton />
          </nav>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/robinhood" element={<RobinhoodPage />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/steps" element={<Configuration />} />
          </Routes>
        </div>
      </RpcTokenProvider>
    </BrowserRouter>
  );
}
