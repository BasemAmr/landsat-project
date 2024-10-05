import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">My App</h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Home  />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
        <footer className="bg-blue-600 text-white p-4 text-center">
          <p>&copy; 2024 My App</p>
        </footer>
      </Router>
    </div>
  );
}

export default App;