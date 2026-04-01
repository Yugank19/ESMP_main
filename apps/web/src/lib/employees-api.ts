const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getEmployees = () => fetch(`${API}/employees`, { headers: h() }).then(r => r.json());
export const getMyTeam = () => fetch(`${API}/employees/my-team`, { headers: h() }).then(r => r.json());
export const getDepartments = () => fetch(`${API}/employees/departments`, { headers: h() }).then(r => r.json());

export const sendEmployeeOtp = (email: string) =>
  fetch(`${API}/employees/send-otp`, { method: 'POST', headers: h(), body: JSON.stringify({ email }) }).then(r => r.json());

export const verifyEmployeeOtp = (email: string, otp: string) =>
  fetch(`${API}/employees/verify-otp`, { method: 'POST', headers: h(), body: JSON.stringify({ email, otp }) }).then(r => r.json());

export const createEmployee = (dto: any) =>
  fetch(`${API}/employees`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());

export const updateEmployee = (id: string, dto: any) =>
  fetch(`${API}/employees/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());

export const deactivateEmployee = (id: string) =>
  fetch(`${API}/employees/${id}/deactivate`, { method: 'DELETE', headers: h() }).then(r => r.json());
