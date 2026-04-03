import { useEffect, useState } from 'react';

const SESSION_KEY = 'voxcite_session_id';

/**
 * Gestion de la session anonyme via localStorage.
 * Crée un UUID à la première visite.
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
  }, []);

  return { sessionId };
}
