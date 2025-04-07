import React, {useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Components/Sidebar';
import Navbar from './Components/Navbar';
import Header from './Components/Header';
import Overview from './Screens/Overview';
import Solar from './Screens/Solar';
import Genset from './Screens/Genset';
import Alerts from './Screens/Alert';
import Mains from './Screens/Mains';
import ProtectedRoute from './Components/ProtectedRoute';
import './App.css';
import Excel from './Screens/Excel';

const App = () => {
  const BaseUrl = "http://13.126.205.156:5001/micro"
  //const BaseUrl = "http://localhost:5001/micro"
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const id = urlParams.get('id');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('id', id);
      //console.log('Token & Id stored in localStorage');
    }

    // Remove token from URL to avoid exposure
    const removeTokenFromUrl = () => {
      const url = new URL(window.location);
      url.searchParams.delete('token');
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url);
    };

    removeTokenFromUrl();
  }, []);

  return (
    <Router>
      <div className="flex h-screen custom-body">
        <Sidebar />
        <div className="flex flex-col flex-grow ml-12 transition-all duration-300">
          <Navbar />
          <Header />
          <div className="content flex-grow p-2  bg-gradient-to-r from-custom-green to-custom-dark">
            <Routes>
              {/* <Route path="/" element={<ProtectedRoute><Overview BaseUrl = {BaseUrl}/></ProtectedRoute>} />
              <Route path="/solar" element={<ProtectedRoute><Solar BaseUrl = {BaseUrl}/></ProtectedRoute>} />
              <Route path="/mains" element={<ProtectedRoute><Mains BaseUrl={BaseUrl} /></ProtectedRoute>} />
              <Route path="/genset" element={<ProtectedRoute><Genset BaseUrl = {BaseUrl}/></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Alerts BaseUrl = {BaseUrl}/></ProtectedRoute>} /> */}
              <Route path="/" element={<Overview BaseUrl = {BaseUrl}/>} />
              <Route path="/solar" element={<Solar BaseUrl = {BaseUrl}/>} />
              <Route path="/mains" element={<Mains BaseUrl={BaseUrl} />} />
              <Route path="/genset" element={<Genset BaseUrl = {BaseUrl}/>} />
              <Route path="/alerts" element={<Alerts BaseUrl = {BaseUrl}/>} />
              <Route path="/excel" element={<Excel BaseUrl = {BaseUrl}/>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
