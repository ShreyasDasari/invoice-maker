'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SHARE_PARAM, SHARE_PATH } from '@/lib/share';

/**
 * Keeps older share links working.
 *
 * Links created before the editor moved carry their payload on "/". The
 * fragment never reaches the server, so this has to happen in the browser:
 * spot a share payload on the home page and hand it to the editor unchanged.
 */
export function LegacyShareRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes(`${SHARE_PARAM}=`)) return;
    router.replace(`${SHARE_PATH}${hash}`);
  }, [router]);

  return null;
}
