import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import SuperAdminPanel from './SuperAdminPanel'
import SchoolDashboard from './SchoolDashboard' // Novo componente

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null) // 'super_admin' ou 'admin'/'staff'
  const [view, setView] = useState('loading') // loading, login, choice, super_panel, school_panel

  useEffect(() => {
    // 1. Checa sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkUserRole(session.user.id)
      else setView('login')
    })

    // 2. Ouve mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkUserRole(session.user.id)
      else setView('login')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUserRole(userId) {
    setLoading(true)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    setLoading(false)
    
    if (profile) {
      setRole(profile.role)
      // Lógica de Navegação Inicial
      if (profile.role === 'super_admin') {
        setView('choice') // Super Admin vai para a escolha
      } else {
        setView('school_panel') // Admin normal vai direto para a escola
      }
    }
  }

  // --- RENDERIZAÇÃO ---

  if (view === 'loading' || loading) return <div style={{padding: 50}}>Carregando sistema...</div>

  if (view === 'login') return <Login />

  // TELA 1: ESCOLHA (Só aparece para Super Admin)
  if (view === 'choice') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <h1 style={{ color: '#333' }}>Olá, Super Admin 👑</h1>
        <p>Onde você deseja atuar agora?</p>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
          
          {/* Cartão 1: Painel Master */}
          <div 
            onClick={() => setView('super_panel')}
            style={cardStyle}
          >
            <h2 style={{ color: '#722ed1' }}>Painel Global (SaaS)</h2>
            <p style={{ color: '#666' }}>Criar escolas, bloquear acessos, gerenciar faturamento.</p>
          </div>

          {/* Cartão 2: Painel da Escola */}
          <div 
            onClick={() => setView('school_panel')}
            style={cardStyle}
          >
            <h2 style={{ color: '#1890ff' }}>Painel da Escola</h2>
            <p style={{ color: '#666' }}>Cadastrar alunos, editar dados da escola, imprimir etiquetas.</p>
          </div>

        </div>
        
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 30, background: 'transparent', border: '1px solid #ccc', padding: '5px 15px', cursor: 'pointer' }}>
          Sair do Sistema
        </button>
      </div>
    )
  }

  // TELA 2: PAINEL MASTER
  if (view === 'super_panel') {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <button onClick={() => setView('choice')} style={btnBack}>← Voltar</button>
           <h1>Painel Global</h1>
           <div style={{width: 50}}></div> {/* Espaço vazio para alinhar */}
        </div>
        <SuperAdminPanel />
      </div>
    )
  }

  // TELA 3: PAINEL DA ESCOLA
  if (view === 'school_panel') {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
           {/* Só mostra botão Voltar se for Super Admin */}
           {role === 'super_admin' ? (
             <button onClick={() => setView('choice')} style={btnBack}>← Voltar</button>
           ) : (
             <span style={{fontWeight:'bold'}}>Painel Administrativo</span>
           )}
           
           <div style={{display:'flex', alignItems: 'center', gap: 10}}>
             <span style={{fontSize: 12}}>{session.user.email}</span>
             <button onClick={() => supabase.auth.signOut()} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
               Sair
             </button>
           </div>
        </div>
        
        <SchoolDashboard session={session} />
      </div>
    )
  }
}

// Estilos simples
const cardStyle = {
  background: 'white', padding: '30px', borderRadius: '12px', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', 
  width: '250px', textAlign: 'center', transition: 'transform 0.2s',
  border: '1px solid #eee'
}

const btnBack = { background: 'none', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }