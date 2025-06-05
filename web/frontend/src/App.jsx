import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/Navbar';
import Home from './pages/Home';
import Detail from './pages/Detail';
import Strategy from './pages/Strategy';
import Trade from './pages/Trade';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/detail/:code/:year' element={<Detail />} />
        <Route path='/strategy' element={<Strategy />} />
        <Route path='/trade/:code' element={<Trade />} />
      </Routes>
    </BrowserRouter>
  );
}