import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/Navbar';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Strategy from './pages/Strategy';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/detail/:code' element={<Detail />} />
        <Route path='/strategy' element={<Strategy />} />
      </Routes>
    </BrowserRouter>
  );
}