/**
 * Curator Chat Button Component
 * Opens IBM Curator AI in a new browser tab
 */
function CuratorChatButton() {
  const handleOpenCurator = () => {
    window.open(
      'https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <button
      onClick={handleOpenCurator}
      className="curator-chat-button"
      title="Ask IBM Curator AI"
      aria-label="Ask IBM Curator AI"
    >
      <span className="curator-chat-icon">🛡️</span>
      <span className="curator-chat-label">Ask IBM Curator</span>
    </button>
  );
}

export default CuratorChatButton;

// Made with Bob