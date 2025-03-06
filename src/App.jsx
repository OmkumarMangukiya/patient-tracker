import './App.css';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/" element={<Signin/>}/>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
