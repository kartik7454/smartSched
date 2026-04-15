"use server"
import { cookies } from 'next/headers'
import StudentNav from './studentNav'
import FacultyNav from './facultyNav'
import HodNav from './hodNav'
import { jwtDecode } from 'jwt-decode'
import { redirect } from 'next/navigation'

// Logout function that deletes local storage token and cookie token
export async function logout() {
  // Remove token from localStorage (browser-only)
 
   
  

  // Remove token cookie (browser)
  
    const cookieStore = await cookies();
    cookieStore.delete('token');
    redirect('/login');
    // document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax';
  

  // Server-side: You may need to set a Set-Cookie header to delete token cookie,
  // but here we only handle client-side logout.
}



function getUserRoleFromToken(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const payload: { role?: number } = jwtDecode(token);
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

export default async function Header() {
  
  const cookieStore = await cookies(); // ✅ FIX
  const token = cookieStore.get('token')?.value;
  const userrole = getUserRoleFromToken(token);

  if (!userrole) return null

  return (
    <nav className="w-full">
      {/* <h3>Welcome {user.name}</h3> */}
      {userrole === 4 && <HodNav logout={logout} />}
      {userrole === 3 && <StudentNav />}
      {userrole === 2 && <FacultyNav />}
    </nav>
  );
}