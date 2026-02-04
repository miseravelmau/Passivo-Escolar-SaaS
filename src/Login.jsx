import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // O Supabase envia um "Magic Link" por email por padrão, 
    // mas aqui vamos focar no login simples (via link ou senha se configurado).
    // Para simplificar agora, usaremos o "Magic Link" (link de acesso por email)
    // pois não requer configurar senhas complexas agora.
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
      emailRedirectTo: window.location.origin // <-- Isso detecta a URL atual automaticamente
      }
    })

    if (error) {
      setMessage('Erro: ' + error.error_description || error.message)
    } else {
      setMessage('Verifique seu email para o link de login!')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '300px' }}>
        <h2>Login SaaS</h2>
        <p>Digite seu email para entrar</p>
        <form onSubmit={handleLogin}>
          <input
            className="input-field"
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <button disabled={loading} style={{ width: '100%', padding: '10px', cursor: 'pointer' }}>
            {loading ? 'Enviando...' : 'Enviar Link de Acesso'}
          </button>
        </form>
        {message && <p style={{ marginTop: '10px', color: 'blue' }}>{message}</p>}
      </div>
    </div>
  )
}