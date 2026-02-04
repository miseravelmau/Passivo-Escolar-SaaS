import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function SchoolDashboard({ session }) {
  const [activeTab, setActiveTab] = useState('alunos') // 'alunos' ou 'dados'
  const [schoolId, setSchoolId] = useState(null)
  const [loading, setLoading] = useState(false)

  // Estados dos Alunos
  const [alunos, setAlunos] = useState([])
  const [studentForm, setStudentForm] = useState({
    name: '', mother_name: '', birth_date: '', cpf: '',
    box_number: '', folder_number: '', owes_transcript: false, returned_to_school: false
  })

  // Estados dos Dados da Escola
  const [schoolData, setSchoolData] = useState({
    name: '', cnpj: '', logo_url: '', address: '',
    phone: '', email_contact: '', director_name: '', responsible_staff: ''
  })

  // 1. Carregar ID da Escola e Dados Iniciais
  useEffect(() => {
    async function init() {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.school_id) {
        setSchoolId(profile.school_id)
        fetchSchoolData(profile.school_id)
        fetchStudents(profile.school_id)
      }
    }
    init()
  }, [session])

  // --- FUNÇÕES DE BUSCA ---
  async function fetchStudents(id) {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', id)
      .order('created_at', { ascending: false })
    if (data) setAlunos(data)
  }

  async function fetchSchoolData(id) {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data) {
      setSchoolData({
        name: data.name || '',
        cnpj: data.cnpj || '',
        logo_url: data.logo_url || '',
        address: data.address || '',
        phone: data.phone || '',
        email_contact: data.email_contact || '',
        director_name: data.director_name || '',
        responsible_staff: data.responsible_staff || ''
      })
    }
  }

  // --- FUNÇÕES DE SALVAMENTO ---

  // Salvar Aluno
  async function handleSaveStudent(e) {
    e.preventDefault()
    if (!schoolId) return
    setLoading(true)
    
    const { error } = await supabase.from('students').insert([{ ...studentForm, school_id: schoolId }])

    if (error) alert('Erro: ' + error.message)
    else {
      alert('Aluno cadastrado!')
      setStudentForm({
        name: '', mother_name: '', birth_date: '', cpf: '',
        box_number: '', folder_number: '', owes_transcript: false, returned_to_school: false
      })
      fetchStudents(schoolId)
    }
    setLoading(false)
  }

  // Atualizar Escola
  async function handleUpdateSchool(e) {
    e.preventDefault()
    if (!schoolId) return
    setLoading(true)

    const { error } = await supabase
      .from('schools')
      .update(schoolData)
      .eq('id', schoolId)

    if (error) alert('Erro ao atualizar: ' + error.message)
    else alert('Dados da escola atualizados com sucesso!')
    
    setLoading(false)
  }

  // Inputs handlers
  const handleStudentChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setStudentForm({ ...studentForm, [e.target.name]: val })
  }

  const handleSchoolChange = (e) => {
    setSchoolData({ ...schoolData, [e.target.name]: e.target.value })
  }

  return (
    <div style={{ padding: '20px', background: '#fff', minHeight: '80vh' }}>
      
      {/* Cabeçalho com Abas */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('alunos')}
          style={{ ...tabStyle, borderBottom: activeTab === 'alunos' ? '3px solid #1890ff' : 'none', fontWeight: activeTab === 'alunos' ? 'bold' : 'normal' }}
        >
          🎓 Ex-Alunos
        </button>
        <button 
          onClick={() => setActiveTab('dados')}
          style={{ ...tabStyle, borderBottom: activeTab === 'dados' ? '3px solid #1890ff' : 'none', fontWeight: activeTab === 'dados' ? 'bold' : 'normal' }}
        >
          🏫 Dados da Escola
        </button>
      </div>

      {/* ABA 1: ALUNOS (O código antigo veio pra cá) */}
      {activeTab === 'alunos' && (
        <div>
          {/* Formulário Resumido */}
          <form onSubmit={handleSaveStudent} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input required name="name" value={studentForm.name} onChange={handleStudentChange} placeholder="Nome do Aluno" style={inputStyle} />
            <input name="mother_name" value={studentForm.mother_name} onChange={handleStudentChange} placeholder="Nome da Mãe" style={inputStyle} />
            <input name="cpf" value={studentForm.cpf} onChange={handleStudentChange} placeholder="CPF" style={inputStyle} />
            <div style={{ display: 'flex', gap: 5 }}>
                <input required name="box_number" value={studentForm.box_number} onChange={handleStudentChange} placeholder="Nº Caixa" style={inputStyle} />
                <input required name="folder_number" value={studentForm.folder_number} onChange={handleStudentChange} placeholder="Nº Pasta" style={inputStyle} />
            </div>
            
            <div style={{gridColumn: 'span 2', display: 'flex', gap: 15, fontSize: '14px'}}>
               <label><input type="checkbox" name="owes_transcript" checked={studentForm.owes_transcript} onChange={handleStudentChange} /> Deve Histórico</label>
               <label><input type="checkbox" name="returned_to_school" checked={studentForm.returned_to_school} onChange={handleStudentChange} /> Retornou</label>
            </div>
            
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
          </form>

          {/* Lista */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#eee', textAlign: 'left' }}>
                <th style={{padding: 8}}>Nome</th>
                <th style={{padding: 8}}>Local</th>
                <th style={{padding: 8}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map(aluno => (
                <tr key={aluno.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{padding: 8}}>{aluno.name}</td>
                  <td style={{padding: 8}}>Cx:{aluno.box_number} / P:{aluno.folder_number}</td>
                  <td style={{padding: 8}}>
                    {aluno.owes_transcript && <span style={{color:'red'}}>⚠ Deve</span>}
                    {!aluno.owes_transcript && <span style={{color:'green'}}>Ok</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA 2: DADOS DA ESCOLA (Novo!) */}
      {activeTab === 'dados' && (
        <form onSubmit={handleUpdateSchool} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>Editar Informações Institucionais</h3>
          
          <label>Nome da Escola:
            <input name="name" value={schoolData.name} onChange={handleSchoolChange} style={inputStyle} />
          </label>
          
          <div style={{ display: 'flex', gap: '10px' }}>
             <label style={{flex: 1}}>CNPJ:
               <input name="cnpj" value={schoolData.cnpj} onChange={handleSchoolChange} style={inputStyle} />
             </label>
             <label style={{flex: 1}}>Telefone:
               <input name="phone" value={schoolData.phone} onChange={handleSchoolChange} style={inputStyle} />
             </label>
          </div>

          <label>Endereço Completo:
            <input name="address" value={schoolData.address} onChange={handleSchoolChange} style={inputStyle} />
          </label>

          <label>Email da Escola:
            <input name="email_contact" value={schoolData.email_contact} onChange={handleSchoolChange} style={inputStyle} />
          </label>

          <label>Diretor(a):
            <input name="director_name" value={schoolData.director_name} onChange={handleSchoolChange} style={inputStyle} />
          </label>

          <label>Funcionários Responsáveis (Sistema):
            <input name="responsible_staff" value={schoolData.responsible_staff} onChange={handleSchoolChange} placeholder="Ex: João (Sec), Maria (Coord)" style={inputStyle} />
          </label>
          
          <label>URL da Logomarca:
            <input name="logo_url" value={schoolData.logo_url} onChange={handleSchoolChange} placeholder="https://..." style={inputStyle} />
          </label>
          {schoolData.logo_url && <img src={schoolData.logo_url} alt="Logo Preview" style={{height: 50, objectFit: 'contain'}} />}

          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? 'Salvando...' : 'Atualizar Dados da Escola'}
          </button>
        </form>
      )}
    </div>
  )
}

// Estilos
const tabStyle = { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#555' }
const inputStyle = { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }
const btnPrimary = { background: '#1890ff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }