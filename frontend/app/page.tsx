// app/page.js
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode'
function getUserRoleFromToken(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const payload: { role?: number } = jwtDecode(token);
    return payload?.role ?? null;
  } catch {
    return null;
  }
}
export default async function Home() {
  
  const cookieStore = await cookies(); // ✅ FIX
  const token = cookieStore.get('token')?.value;
  if(!token){redirect('/login')}
  const userrole = getUserRoleFromToken(token)
  if (userrole == 3) {
    redirect('/dashboard/student');
  } 
  else if (userrole == 2) {
    redirect('/dashboard/faculty');
   }  else if (userrole == 4) {
    redirect('/dashboard/hod');
   }
}