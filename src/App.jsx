import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alunos, setAlunos] = useState([]) // Lista de alunos
  
  // Estado do Formulário (Todos os campos do seu pedido)
  const [formData, setFormData] = useState({
    name: '',
    mother_name: '',
    birth_date: '',
    cpf: '',
    box_number: '',
    folder_number: '',
    owes_transcript: false,
    returned_to_school: false
  })

  // 1. Monitora o Login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) carregarAlunos(session.user.id) // Se logou, busca os alunos
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) carregarAlunos(session.user.id)
    })
  }, [])

  // 2. Função para buscar alunos da escola do usuário
  async function carregarAlunos(userId) {
    try {
      // Primeiro descobre a escola do usuário
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', userId)
        .single()

      if (profile) {
        // Busca os alunos dessa escola
        const { data: listaAlunos, error } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', profile.school_id) // Filtro de segurança manual (enquanto RLS tá off)
          .order('created_at', { ascending: false }) // Mais recentes primeiro

        if (listaAlunos) setAlunos(listaAlunos)
      }
    } catch (error) {
      console.error("Erro ao buscar:", error)
    }
  }

  // 3. Atualiza os campos do formulário conforme digita
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  // 4. Salvar no Banco
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Busca o ID da escola novamente para garantir
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single()

      // Insere os dados
      const { error } = await supabase.from('students').insert([
        {
          school_id: profile.school_id,
          name: formData.name,
          mother_name: formData.mother_name,
          birth_date: formData.birth_date || null, // Se vazio, manda null
          cpf: formData.cpf,
          box_number: formData.box_number,
          folder_number: formData.folder_number,
          owes_transcript: formData.owes_transcript,
          returned_to_school: formData.returned_to_school
        }
      ])

      if (error) throw error
      
      alert('Aluno cadastrado com sucesso!')
      
      // Limpa formulário e recarrega a lista
      setFormData({
        name: '', mother_name: '', birth_date: '', cpf: '',
        box_number: '', folder_number: '', owes_transcript: false, returned_to_school: false
      })
      carregarAlunos(session.user.id)

    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Se não estiver logado, mostra tela de Login
  if (!session) return <Login />

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>📂 Arquivo Digital Escolar</h2>
        <button 
          onClick={() => supabase.auth.signOut()}
          style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </div>

      {/* Formulário de Cadastro */}
      <div style={{ background: '#f0f2f5', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
        <h3 style={{ marginTop: 0 }}>Novo Cadastro</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          {/* Nome (Ocupa 2 colunas) */}
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

          {/* Caixa e Pasta */}
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

          {/* Checkboxes (Situação) */}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="owes_transcript" 
                checked={formData.owes_transcript} 
                onChange={handleChange}
                style={{ marginRight: '8px', width: '20px', height: '20px' }} 
              />
              ⚠️ Deve Histórico?
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="returned_to_school" 
                checked={formData.returned_to_school} 
                onChange={handleChange}
                style={{ marginRight: '8px', width: '20px', height: '20px' }} 
              />
              🔄 Retornou p/ Escola?
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ gridColumn: 'span 2', padding: '12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
          >
            {loading ? 'Salvando...' : 'Cadastrar Aluno'}
          </button>

        </form>
      </div>

      {/* Tabela de Listagem */}
      <h3>📋 Alunos Arquivados ({alunos.length})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '2px solid #ddd' }}>
            <th style={thStyle}>Nome</th>
            <th style={thStyle}>Mãe</th>
            <th style={thStyle}>Localização</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {alunos.map((aluno) => (
            <tr key={aluno.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{aluno.name}</td>
              <td style={tdStyle}>{aluno.mother_name || '-'}</td>
              <td style={tdStyle}>
                <strong>Cx:</strong> {aluno.box_number} <br/>
                <strong>Pasta:</strong> {aluno.folder_number}
              </td>
              <td style={tdStyle}>
                {aluno.owes_transcript && <span style={{ color: 'red', display: 'block' }}>⚠️ Deve Histórico</span>}
                {aluno.returned_to_school && <span style={{ color: 'green', display: 'block' }}>🔄 Retornou</span>}
                {!aluno.owes_transcript && !aluno.returned_to_school && <span style={{ color: '#ccc' }}>Ok</span>}
              </td>
            </tr>
          ))}
          {alunos.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                Nenhum aluno cadastrado nesta escola ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  )
}

// Estilos simples para não poluir o código principal
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const thStyle = { textAlign: 'left', padding: '12px 8px', color: '#666' }
const tdStyle = { padding: '12px 8px' }

export default App