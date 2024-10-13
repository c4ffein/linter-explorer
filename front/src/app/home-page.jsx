import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import { Link, useRouter, useLocation } from "wouter";
import Header from '../components/header';
import Sidebar from '../components/sidebar';
import Icon from '../components/icon';
import Spinner from '../components/spinner';
import { formatByVersion } from '../lib/api';
import { debounce } from '../lib/helpers';
import useIsMounted from '../lib/use-is-mounted';

import Editor from '../components/editor';

export default function HomePage({ props }) {
  const router = useRouter(); // TODO : DELETEME? Check what was the purpose in the first place
  const [location, navigate] = useLocation();

  const [version, setVersion] = useState(props.version);
  const [source, setSource] = useState(props.source);
  const [isLoading, setIsLoading] = useState(props.isLoading);
  const [formatted, setFormatted] = useState(props.formatted);
  const [options, setOptions] = useState(props.options);
  const [state, setState] = useState(props.state);
  const [issueLink, setIssueLink] = useState(props.issueLink);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const inert = useMemo(() => ({source, version, options}), []);  // dirty trick
  const isMounted = useIsMounted();

  useEffect(() => {
    if (typeof window === 'undefined' || localStorage.getItem('sidebar:visible') !== 'true') return;
    setIsSidebarVisible(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') { localStorage.setItem('sidebar:visible', isSidebarVisible); }
  }, [isSidebarVisible]);

  useEffect(() => {
    navigate(`/?version=${version}&state=${state}`, { replace: true, scroll: false });  // TODO : Check scroll
  }, [router, version, state]);  // TODO : Do something with router to make it work on change?.. Just remove router?

  const formatCallback = useMemo(
    () => debounce(
      async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        const json = await formatByVersion(inert.version, {source: inert.source, options: inert.options});
        if (!isMounted.current) return;
        setIsLoading(false);
        setFormatted(json.formatted_code);
        setState(json.state);
        setIssueLink(json.issue_link);
      },
      100,
    ),
    []
  );
  useEffect(() => { Object.assign(inert, {source, version, options}); formatCallback(); }, [source, version, options]);

  const handleOptionsUpdate = async (value) => {
    if (value.version) {
      setVersion(value.version);
    } else {
      setOptions((prev) => Object.assign({}, prev, value));
    }
  };

  const handleSourceUpdate = (value) => { setSource(value); };
  const handleToggleSidebar = () => { setIsSidebarVisible((prev) => !prev); };

  const moreButtonClasses = isSidebarVisible ? 'text-black hover:text-slate-500' : 'text-slate-500 hover:text-black';
  const buttonClasses = `text-sm inline-flex items-center ${moreButtonClasses}`

  return (
    <div className="flex flex-col h-screen">
      <Header version={props.currentVersion} />

      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 min-h-0">
          <Sidebar
            version={version}
            versions={props.versions}
            options={options}
            visible={isSidebarVisible}
            onChange={handleOptionsUpdate}
          />

          <div className="flex flex-1">
            <div className="flex flex-1 relative">
              <Editor value={source} marginColumn={options.line_length} onChange={handleSourceUpdate} />
            </div>
            <div className="flex flex-1 relative">
              {isLoading ? (
                <div className="flex items-center justify-center w-full ace-tomorrow-night"><Spinner /></div>
              ) : (
                <Editor value={formatted} marginColumn={options.line_length} readOnly={true} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between content-center items-center p-4">
          <button className={buttonClasses} onClick={handleToggleSidebar}><Icon icon="cog" /></button>
          <div className="flex text-right">
            <div className="flex text-right">
              <Link
                href={issueLink}
                className="bg-transparent text-xs py-1 text-black font-bold no-underline hover:underline"
              >
                Report issue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
