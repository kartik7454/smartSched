'use client'

import { useEffect, useState } from 'react'

export default function Header() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    
    const fetchUser = async () => {
     
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      try {
        
        // Decode the JWT payload (base64-encoded, 2nd segment)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload?.id || payload?.userId ||payload?.sub|| null;
        if (!userId) {
          setUser(null);
          return;
        }
        
        // Fetch user information
        const res = await fetch(`http://localhost:3000/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUser(data);
 
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  if (!user) return <div>Loading...</div>

  return (
    <nav>
      {/* <h3>Welcome {user.name}</h3>

      {user.role === 'admin' && <div>Admin Menu</div>}
      {user.role === 'faculty' && <div>Faculty Menu</div>}
      {user.role === 'student' && <div>Student Menu</div>} */}
    </nav>
  )
}