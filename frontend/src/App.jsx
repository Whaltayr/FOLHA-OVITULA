//App.jsx
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail"
import Login from "./pages/Login"
import {Routes, Route } from "react-router-dom"
// import ProtectedRoute from './components/ProtectedRoute';


export default function App() {
  return (
    <MainLayout>
     <Routes> 
      <Route path="/" element={<Home/>}></Route>
      <Route path="/login" element={<Login />} />
      <Route path="/post/:slug" element={<PostDetail/>}></Route>
      {/* <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard/></ProtectedRoute>} /> */}
      <Route path="*" element={<div className="p-6">Page Not Found</div>}></Route>
     </Routes>
    </MainLayout>
  );
}
