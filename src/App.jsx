import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import StarField from './components/StarField'
import Home from './pages/Home'
import Create from './pages/Create'
import Story from './pages/Story'
import Examples from './pages/Examples'
import Library from './pages/Library'

function App() {
  return (
    <>
      <StarField />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/story" element={<Story />} />
        <Route path="/examples" element={<Examples />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </>
  )
}

export default App
