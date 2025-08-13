import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Authenticate from "./pages/Authenticate";
import ProtectedRoute from "./components/ProtectedRoute";

function App(){
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