import { useEffect, useRef } from 'react';
// TODO : Make a lib
// TODO : Credit, as I re-developped it myself but now this is cleaner?  https://github.com/jmlweb/isMounted/blob/master/index.js

const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(
    () => { isMounted.current = true; return () => isMounted.current = false; },
    [],
  );
  return isMounted;
};

export default useIsMounted;
