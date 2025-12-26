//App.jsx
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail"
import {Routes, Route } from "react-router-dom"

export default function App() {
  return (
    <MainLayout>
     <Routes> 
      <Route path="/" element={<Home/>}></Route>
      <Route path="/post/:slug" element={<PostDetail/>}></Route>
      <Route path="*" element={<div className="p-6">Page Not Found</div>}></Route>
     </Routes>
    </MainLayout>
  );
}
