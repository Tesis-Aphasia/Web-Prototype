import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ExerciseProvider } from './context/ExerciseContext.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExerciseProvider>
      <App />
    </ExerciseProvider>
  </StrictMode>,
)
