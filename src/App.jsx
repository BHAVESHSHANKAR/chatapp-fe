import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Authenticate from "./pages/Authenticate";
import ProtectedRoute from "./components/ProtectedRoute";
import userActivityService from "./services/userActivity";

function App(){
  useEffect(() => {
    // Initialize user activity tracking
    userActivityService.initialize();
    
    return () => {
      userActivityService.destroy();
    };
  }, []);

  return(
    <>
    <BrowserRouter>
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Authenticate/>}/>
      <Route path="/" element={<Landing/>}/>
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home/>}/>
        {/* Add more protected routes here */}
      </Route>
    </Routes>
    </BrowserRouter>
    </>
  )
}
export default App;