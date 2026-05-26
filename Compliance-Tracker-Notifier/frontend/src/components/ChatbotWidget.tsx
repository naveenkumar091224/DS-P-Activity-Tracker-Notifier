import { useState } from 'react';

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // IBM Curator AI URL
  const curatorAiUrl = 'https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb';

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setIframeLoaded(false);
  };

  return (
    <div
      className={`chatbot-shell ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''}`}
      data-chatbot-state={isOpen ? (isMinimized ? 'minimized' : isMaximized ? 'maximized' : 'open') : 'closed'}
    >
      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setIsOpen((current: boolean) => !current)}
        aria-expanded={isOpen}
        aria-label="Toggle IBM Curator AI assistant"
      >
        <span className="chatbot-launcher-icon">🤖</span>
        <span className="chatbot-launcher-text">{isOpen ? 'Close Assistant' : 'Ask Assistant'}</span>
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-label="IBM Curator AI assistant">
          <div className="chatbot-header">
            <div>
              <strong>IBM Curator AI Assistant</strong>
              <div className="chatbot-subtitle">Powered by IBM Curator AI</div>
            </div>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-minimize"
                onClick={() => {
                  setIsMinimized((current: boolean) => !current);
                  if (!isMinimized) setIsMaximized(false);
                }}
                aria-label={isMinimized ? 'Restore assistant' : 'Minimize assistant'}
                title={isMinimized ? 'Restore' : 'Minimize'}
              >
                −
              </button>
              <button
                type="button"
                className="chatbot-maximize"
                onClick={() => {
                  setIsMaximized((current: boolean) => !current);
                  if (!isMaximized) setIsMinimized(false);
                }}
                aria-label={isMaximized ? 'Restore assistant' : 'Maximize assistant'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? '❐' : '□'}
              </button>
              <button
                type="button"
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="chatbot-iframe-container">
                {!iframeLoaded && !iframeError && (
                  <div className="chatbot-loading">
                    <div className="chatbot-loading-spinner"></div>
                    <p>Loading IBM Curator AI...</p>
                  </div>
                )}

                {iframeError && (
                  <div className="chatbot-error">
                    <div className="chatbot-error-icon">⚠️</div>
                    <h3>Unable to Load Assistant</h3>
                    <p>The IBM Curator AI assistant could not be loaded. This may be due to:</p>
                    <ul>
                      <li>Network connectivity issues</li>
                      <li>Browser security settings blocking the iframe</li>
                      <li>IBM Curator AI service temporarily unavailable</li>
                    </ul>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setIframeError(false);
                        setIframeLoaded(false);
                      }}
                    >
                      Try Again
                    </button>
                    <a 
                      href={curatorAiUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="chatbot-external-link"
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}

                <iframe
                  src={curatorAiUrl}
                  className={`chatbot-iframe ${iframeLoaded ? 'loaded' : ''}`}
                  title="IBM Curator AI Assistant"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  allow="clipboard-write; microphone"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  style={{ display: iframeError ? 'none' : 'block' }}
                />
              </div>

              <div className="chatbot-footer">
                Powered by IBM Curator AI - Your intelligent compliance assistant
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;

// Made with Bob
