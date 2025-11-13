import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Section({ title, children, actions }) {
  return (
    <div className="bg-white/70 backdrop-blur border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

function useAuth() {
  const [token, setToken] = useState('')
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token])

  async function seedAndLogin() {
    try {
      await fetch(`${API}/setup/seed-admin?email=admin@example.com&password=admin123`, { method: 'POST' })
    } catch {}
    const form = new URLSearchParams({ username: 'admin@example.com', password: 'admin123' })
    const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
    const data = await res.json()
    if (data.access_token) setToken(data.access_token)
  }

  return { token, headers, seedAndLogin }
}

function App() {
  const { token, headers, seedAndLogin } = useAuth()

  const [branches, setBranches] = useState([])
  const [branchName, setBranchName] = useState('Downtown')
  const [branchLocation, setBranchLocation] = useState('City Center')
  const [currency, setCurrency] = useState('USD')

  const [payments, setPayments] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      const [b, p, m, l] = await Promise.all([
        fetch(`${API}/branches`, { headers }).then(r => r.json()),
        fetch(`${API}/payments`, { headers }).then(r => r.json()),
        fetch(`${API}/maintenance`, { headers }).then(r => r.json()),
        fetch(`${API}/loyalty/members`, { headers }).then(r => r.json()),
      ])
      setBranches(b)
      setPayments(p)
      setMaintenance(m)
      setMembers(l)
    })()
  }, [token])

  async function addBranch() {
    const res = await fetch(`${API}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ name: branchName, location: branchLocation, currency })
    })
    if (res.ok) {
      const item = await res.json()
      setBranches(prev => [item, ...prev])
    }
  }

  async function addPayment() {
    if (!branches[0]) return
    const res = await fetch(`${API}/payments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ branch_id: branches[0].id, service_name: 'Spa Service', amount: 120.5, currency: currency, status: 'completed' })
    })
    if (res.ok) {
      const item = await res.json()
      setPayments(prev => [item, ...prev])
    }
  }

  async function addMaintenance() {
    if (!branches[0]) return
    const res = await fetch(`${API}/maintenance`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ branch_id: branches[0].id, title: 'HVAC Filter Replacement', priority: 'high' })
    })
    if (res.ok) {
      const item = await res.json()
      setMaintenance(prev => [item, ...prev])
    }
  }

  async function addMember() {
    const res = await fetch(`${API}/loyalty/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ member_type: 'guest', full_name: 'Alex Traveler', email: `alex${Date.now()}@mail.com` })
    })
    if (res.ok) {
      const item = await res.json()
      setMembers(prev => [item, ...prev])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hotel Operations Portal</h1>
            <p className="text-gray-600">Multi-branch admin, staff, payments, maintenance, and loyalty.</p>
          </div>
          <div>
            {!token ? (
              <button onClick={seedAndLogin} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Seed & Sign In</button>
            ) : (
              <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-700">Signed in</span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Branches" actions={
            <div className="flex gap-2">
              <input className="border rounded px-2 py-1" placeholder="Name" value={branchName} onChange={e=>setBranchName(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="Location" value={branchLocation} onChange={e=>setBranchLocation(e.target.value)} />
              <select className="border rounded px-2 py-1" value={currency} onChange={e=>setCurrency(e.target.value)}>
                <option>USD</option><option>EUR</option><option>GBP</option><option>JPY</option>
              </select>
              <button onClick={addBranch} disabled={!token} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-50">Add</button>
            </div>
          }>
            <ul className="space-y-2">
              {branches.map(b => (
                <li key={b.id} className="p-3 rounded border bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{b.name}</p>
                    <p className="text-sm text-gray-600">{b.location} • {b.currency}</p>
                  </div>
                </li>
              ))}
              {branches.length === 0 && <p className="text-sm text-gray-500">No branches yet.</p>}
            </ul>
          </Section>

          <Section title="Payments (Non-booking)" actions={
            <button onClick={addPayment} disabled={!token || branches.length===0} className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">Add Sample</button>
          }>
            <ul className="space-y-2">
              {payments.map(p => (
                <li key={p.id} className="p-3 rounded border bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{p.service_name}</p>
                    <p className="text-sm text-gray-600">{p.amount} {p.currency} • {new Date(p.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${p.status==='completed'?'bg-green-100 text-green-700':p.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{p.status}</span>
                </li>
              ))}
              {payments.length === 0 && <p className="text-sm text-gray-500">No payments yet.</p>}
            </ul>
          </Section>

          <Section title="Maintenance" actions={
            <button onClick={addMaintenance} disabled={!token || branches.length===0} className="px-3 py-1 rounded bg-amber-600 text-white disabled:opacity-50">Create</button>
          }>
            <ul className="space-y-2">
              {maintenance.map(m => (
                <li key={m.id} className="p-3 rounded border bg-white">
                  <p className="font-medium text-gray-800">{m.title} <span className="text-xs ml-2 px-2 py-0.5 rounded bg-slate-100">{m.priority}</span></p>
                  <p className="text-sm text-gray-600">{m.status} • {new Date(m.created_at).toLocaleString()}</p>
                </li>
              ))}
              {maintenance.length === 0 && <p className="text-sm text-gray-500">No maintenance yet.</p>}
            </ul>
          </Section>

          <Section title="Loyalty Members" actions={
            <button onClick={addMember} disabled={!token} className="px-3 py-1 rounded bg-fuchsia-600 text-white disabled:opacity-50">Enroll</button>
          }>
            <ul className="space-y-2">
              {members.map(m => (
                <li key={m.id} className="p-3 rounded border bg-white flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{m.full_name}</p>
                    <p className="text-sm text-gray-600">{m.email} • {m.member_type}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">{m.points_balance} pts</span>
                </li>
              ))}
              {members.length === 0 && <p className="text-sm text-gray-500">No members yet.</p>}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  )
}

export default App
