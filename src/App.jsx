import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Create from './pages/Create'
import Story from './pages/Story'
import Examples from './pages/Examples'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/story" element={<Story />} />
        <Route path="/examples" element={<Examples />} />
      </Routes>
    </>
  )
}

export default App
