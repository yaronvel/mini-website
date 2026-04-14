import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { StepsDisplay } from './pages/StepsDisplay';
import './App.css';

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <div className="App">
        <nav className="app-top-nav" aria-label="Main">
          <Link to="/">Home</Link>
          <Link to="/steps">steps display</Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/steps" element={<StepsDisplay />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
