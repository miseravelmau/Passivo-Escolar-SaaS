import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function SuperAdminPanel() {
  const [schools, setSchools] = useState([])
  const [newSchoolName, setNewSchoolName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSchools()
  }, [])

  async function fetchSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Erro:', error)
    else setSchools(data)
  }

  async function createSchool() {
    if (!newSchoolName) return
    setLoading(true)
    
    const { error } = await supabase
      .from('schools')
      .insert([{ name: newSchoolName, active: true }])

    if (error) {
      alert('Erro: ' + error.message)
    } else {
      alert('Escola criada com sucesso!')
      setNewSchoolName('')
      fetchSchools()
    }
    setLoading(false)
  }

  async function toggleStatus(school) {
    const { error } = await supabase
      .from('schools')
      .update({ active: !school.active })
      .eq('id', school.id)

    if (error) alert('Erro ao atualizar')
    else fetchSchools()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
      
      {/* Formulário de Criação */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', padding: '20px', background: '#f9f0ff', borderRadius: '8px' }}>
        <input 
          type="text" 
          placeholder="Nome da Nova Escola Cliente"
          value={newSchoolName}
          onChange={(e) => setNewSchoolName(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
        />
        <button 
          onClick={createSchool} 
          disabled={loading} 
          style={{ background: '#722ed1', color: 'white', border: 'none', padding: '0 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Criar Escola
        </button>
      </div>

      {/* Tabela de Escolas */}
      <h3>🏢 Clientes Ativos</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Nome da Escola</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>ID (Para vincular usuários)</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {schools.map(school => (
            <tr key={school.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{school.name}</td>
              <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#888' }}>
                {school.id}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button 
                  onClick={() => toggleStatus(school)}
                  style={{ 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    background: school.active ? '#ff4d4f' : '#52c41a',
                    color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px'
                  }}
                >
                  {school.active ? 'Bloquear Acesso' : 'Ativar Acesso'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}