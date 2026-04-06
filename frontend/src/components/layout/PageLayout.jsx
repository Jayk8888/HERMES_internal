import Navbar from './Navbar'

export default function PageLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
        {children}
      </main>
    </div>
  )
}
