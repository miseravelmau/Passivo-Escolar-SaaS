import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import SuperAdminPanel from './SuperAdminPanel' // Importamos o novo painel

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false) // Define qual tela mostrar
  
  // Dados para o painel da Escola
  const [alunos, setAlunos] = useState([])
  const [formData, setFormData] = useState({
    name: '', mother_name: '', birth_date: '', cpf: '',
    box_number: '', folder_number: '', owes_transcript: false, returned_to_school: false
  })

  // 1. Monitora Autenticação e Permissões
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checarPermissoes(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checarPermissoes(session.user.id)
      else setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. Função que decide quem é o usuário
  async function checarPermissoes(userId) {
    try {
      setLoading(true)
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, school_id')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error)
      }

      if (profile) {
        if (profile.role === 'super_admin') {
          setIsSuperAdmin(true) // É o Dono!
        } else {
          setIsSuperAdmin(false) // É cliente
          carregarAlunos(profile.school_id) // Carrega dados da escola dele
        }
      }
    } catch (error) {
      console.error('Erro geral:', error)
    } finally {
      setLoading(false)
    }
  }

  // 3. Busca alunos (Apenas para usuários de Escola)
  async function carregarAlunos(schoolId) {
    if (!schoolId) return
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
    
    if (data) setAlunos(data)
  }

  // 4. Manipula formulário (Escola)
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  // 5. Salvar Aluno (Escola)
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Busca ID da escola novamente por segurança
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('school_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.school_id) return alert('Erro: Escola não identificada.')

    const { error } = await supabase.from('students').insert([
      { ...formData, school_id: profile.school_id }
    ])

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      alert('Aluno cadastrado!')
      setFormData({
        name: '', mother_name: '', birth_date: '', cpf: '',
        box_number: '', folder_number: '', owes_transcript: false, returned_to_school: false
      })
      carregarAlunos(profile.school_id)
    }
  }

  // --- RENDERIZAÇÃO DAS TELAS ---

  if (loading) return <div style={{ padding: 20 }}>Carregando sistema...</div>

  if (!session) return <Login />

  // TELA 1: SE FOR SUPER ADMIN (O DONO)
  if (isSuperAdmin) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
           <h1 style={{ color: '#722ed1' }}>Painel Global SaaS</h1>
           <button onClick={() => supabase.auth.signOut()} style={btnSairStyle}>Sair</button>
        </div>
        <SuperAdminPanel />
      </div>
    )
  }

  // TELA 2: SE FOR ESCOLA (O CLIENTE)
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>📂 Arquivo Digital Escolar</h2>
        <div style={{display:'flex', gap: 10, alignItems: 'center'}}>
            <span style={{fontSize: 12, color: '#666'}}>{session.user.email}</span>
            <button onClick={() => supabase.auth.signOut()} style={btnSairStyle}>Sair</button>
        </div>
      </div>

      <div style={{ background: '#f0f2f5', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0 }}>Novo Cadastro</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label>Nome do Aluno:</label>
            <input required name="name" value={formData.name} onChange={handleChange} type="text" style={inputStyle} />
          </div>

          <div>
            <label>Nome da Mãe:</label>
            <input name="mother_name" value={formData.mother_name} onChange={handleChange} type="text" style={inputStyle} />
          </div>

          <div>
            <label>CPF:</label>
            <input name="cpf" value={formData.cpf} onChange={handleChange} type="text" placeholder="000.000.000-00" style={inputStyle} />
          </div>

          <div>
            <label>Data de Nascimento:</label>
            <input name="birth_date" value={formData.birth_date} onChange={handleChange} type="date" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Nº Caixa:</label>
              <input required name="box_number" value={formData.box_number} onChange={handleChange} type="text" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Nº Pasta:</label>
              <input required name="folder_number" value={formData.folder_number} onChange={handleChange} type="text" style={inputStyle} />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label style={{ cursor: 'pointer' }}>
              <input type="checkbox" name="owes_transcript" checked={formData.owes_transcript} onChange={handleChange} style={{ marginRight: 8 }} />
              ⚠️ Deve Histórico?
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input type="checkbox" name="returned_to_school" checked={formData.returned_to_school} onChange={handleChange} style={{ marginRight: 8 }} />
              🔄 Retornou?
            </label>
          </div>

          <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cadastrar Aluno
          </button>
        </form>
      </div>

      <h3>📋 Alunos Arquivados ({alunos.length})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '2px solid #ddd' }}>
            <th style={thStyle}>Nome / Mãe</th>
            <th style={thStyle}>Localização</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>
                <strong>{aluno.name}</strong><br/>
                <span style={{fontSize: '12px', color: '#666'}}>{aluno.mother_name}</span>
              </td>
              <td style={tdStyle}>Cx: {aluno.box_number} | Pasta: {aluno.folder_number}</td>
              <td style={tdStyle}>
                {aluno.owes_transcript && <span style={{ color: 'red', display: 'block', fontSize: 12 }}>⚠️ Deve Hist.</span>}
                {aluno.returned_to_school && <span style={{ color: 'green', display: 'block', fontSize: 12 }}>🔄 Retornou</span>}
                {!aluno.owes_transcript && !aluno.returned_to_school && <span style={{ color: '#ccc' }}>Ok</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Estilos CSS-in-JS
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const thStyle = { textAlign: 'left', padding: '12px 8px', color: '#666' }
const tdStyle = { padding: '12px 8px' }
const btnSairStyle = { background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }

export default App