# IBM Curator AI Integration - Technical Notes

## Overview
This document provides technical details about the IBM Curator AI integration, including implementation status, discovered limitations, and recommended solutions.

## Implementation Summary

### What Was Implemented
1. **Chatbot Widget Component** (`ChatbotWidget.tsx`)
   - Replaced demo Q&A chatbot with IBM Curator AI iframe integration
   - Maintained existing UI structure (launcher button, panel, minimize/maximize)
   - Added loading states and error handling
   - Implemented iframe embedding with proper styling

2. **IBM Curator AI URL**
   - Target URL: `https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb`
   - This is the IBM Curator AI chat interface

3. **UI Components**
   - Launcher button: Blue circular button with chat icon in bottom-right corner
   - Chat panel: Slides up from bottom-right when opened
   - Header: Shows "IBM Curator AI Assistant" with minimize/maximize/close controls
   - Iframe container: Displays IBM Curator AI interface

4. **Styling Updates** (`App.css`)
   - Added `.chatbot-iframe-container` for iframe layout
   - Added `.chatbot-iframe` with smooth opacity transitions
   - Added `.chatbot-loading` with centered spinner animation
   - Added `.chatbot-error` for error state display
   - Added `.chatbot-external-link` for fallback link styling

## Discovered Limitation: Content Security Policy (CSP)

### The Issue
When testing the integration, IBM Curator AI attempts to load an authentication page from `https://login.ibm.com/`, which is **blocked by IBM's Content Security Policy (CSP)**:

```
Error: Framing 'https://login.ibm.com/' violates the following Content Security Policy directive: 
"frame-ancestors 'self' *.ibm.com *.ibm.net *.s81c.com *.ibmcloud.com marketplace.redhat.com *.ibmserviceengage.com"
```

### What This Means
- IBM's login page **cannot be embedded in an iframe** from non-IBM domains (like `localhost:3001`)
- This is a **security feature** implemented by IBM to prevent clickjacking attacks
- The CSP `frame-ancestors` directive restricts which domains can embed IBM's authentication pages

### Why This Happens
1. User clicks "Ask Assistant" button
2. ChatbotWidget loads IBM Curator AI URL in iframe
3. IBM Curator AI requires authentication
4. IBM redirects to `https://login.ibm.com/` for login
5. Browser blocks the login page due to CSP violation
6. User sees empty iframe or error message

## Recommended Solutions

### Option 1: Open in New Tab (Simplest - Recommended for MVP)
**Implementation**: Replace iframe with a button that opens IBM Curator AI in a new browser tab.

**Pros**:
- No CSP issues
- Users can authenticate normally
- Simple to implement
- Works immediately

**Cons**:
- Breaks the embedded experience
- Users leave the application

**Code Example**:
```tsx
const handleOpenCurator = () => {
  window.open(
    'https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb',
    '_blank',
    'noopener,noreferrer'
  );
};

return (
  <button onClick={handleOpenCurator} className="chatbot-launcher">
    <MessageCircle size={24} />
  </button>
);
```

### Option 2: Deploy to IBM-Approved Domain
**Implementation**: Deploy the application to a domain that's whitelisted in IBM's CSP policy.

**Pros**:
- Maintains embedded experience
- Proper authentication flow
- Professional solution

**Cons**:
- Requires deployment to specific domains
- May need IBM approval/partnership
- More complex setup

**Whitelisted Domains** (from CSP):
- `*.ibm.com`
- `*.ibm.net`
- `*.s81c.com`
- `*.ibmcloud.com`
- `marketplace.redhat.com`
- `*.ibmserviceengage.com`

### Option 3: Use IBM Curator AI API (Best Long-term Solution)
**Implementation**: Instead of embedding the UI, integrate with IBM Curator AI's API directly.

**Pros**:
- Full control over UI/UX
- No CSP issues
- Better integration with application
- Can customize responses

**Cons**:
- Requires API access/credentials
- More development effort
- Need to build custom chat UI
- May require IBM partnership

**Implementation Steps**:
1. Obtain IBM Curator AI API credentials
2. Create backend proxy endpoint for API calls
3. Build custom chat UI in React
4. Handle authentication via API tokens
5. Stream responses from API to UI

### Option 4: Hybrid Approach
**Implementation**: Show embedded iframe for authenticated users, fallback to new tab for unauthenticated.

**Pros**:
- Best of both worlds
- Graceful degradation
- Better user experience

**Cons**:
- More complex logic
- Still requires authentication handling
- May confuse users

## Current Status

### ✅ Completed
- [x] Role selection during registration
- [x] Backend role field implementation
- [x] Frontend role dropdown with 4 options
- [x] IBM Curator AI iframe integration
- [x] Chatbot UI components and styling
- [x] Loading and error states
- [x] Fixed Vite proxy configuration (backend → localhost:8000)
- [x] Tested login functionality
- [x] Verified chatbot panel opens correctly

### ⚠️ Known Issues
- [ ] IBM Curator AI login blocked by CSP when embedded in iframe
- [ ] Authentication flow doesn't work in iframe from localhost

### 📋 Recommended Next Steps
1. **Immediate**: Implement Option 1 (Open in New Tab) as temporary solution
2. **Short-term**: Investigate IBM Curator AI API access
3. **Long-term**: Implement Option 3 (API Integration) for production

## Testing Results

### What Works
✅ Login page with role selection dropdown  
✅ User authentication and session management  
✅ Dashboard loads correctly  
✅ Chatbot launcher button appears  
✅ Chatbot panel opens/closes  
✅ UI styling and animations  
✅ Backend connection (after fixing proxy)  

### What Doesn't Work
❌ IBM Curator AI iframe loads but shows CSP error  
❌ Authentication within iframe is blocked  
❌ Users cannot interact with IBM Curator AI from embedded iframe  

## Technical Details

### Files Modified
1. `frontend/src/components/ChatbotWidget.tsx` - Complete rewrite for iframe integration
2. `frontend/src/App.css` - Added 100+ lines of chatbot styling
3. `frontend/src/App.tsx` - Removed unused props from ChatbotWidget
4. `frontend/src/components/Dashboard.tsx` - Removed props from ChatbotWidget
5. `frontend/vite.config.ts` - Fixed proxy target (backend → localhost:8000)
6. `backend/auth_schemas.py` - Added role field to RegisterRequest
7. `backend/auth_service.py` - Updated registration to use role from request
8. `frontend/src/types.ts` - Added role field to RegisterRequest interface
9. `frontend/src/components/RegisterPage.tsx` - Added role dropdown

### Backup Files Created
- `frontend/src/components/ChatbotWidget.backup.tsx` - Original demo chatbot

## Security Considerations

### Content Security Policy (CSP)
- IBM implements strict CSP to prevent clickjacking
- `frame-ancestors` directive controls iframe embedding
- Cannot be bypassed from client-side
- Requires server-side solution or alternative approach

### Authentication
- IBM Curator AI requires IBM ID authentication
- Authentication cookies/tokens may not work across domains
- CORS policies may also restrict API access
- Consider OAuth flow for API integration

## Deployment Considerations

### Development Environment
- Works on `localhost:3001` (frontend dev server)
- Backend runs in Docker on `localhost:8000`
- CSP issues present in development

### Production Environment
- **If deploying to non-IBM domain**: Use Option 1 (New Tab) or Option 3 (API)
- **If deploying to IBM domain**: Iframe may work if domain is whitelisted
- **If using API**: Ensure proper authentication and rate limiting

## User Experience Impact

### Current Implementation
1. User clicks "Ask Assistant" button
2. Panel opens showing "IBM Curator AI Assistant"
3. Iframe attempts to load but shows blank/error
4. User cannot interact with chatbot

### Recommended UX (Option 1)
1. User clicks "Ask Assistant" button
2. New tab opens with IBM Curator AI
3. User authenticates if needed
4. User interacts with chatbot in separate tab
5. User returns to main application when done

### Ideal UX (Option 3 - Future)
1. User clicks "Ask Assistant" button
2. Custom chat panel opens
3. User is already authenticated (via API token)
4. User types message
5. Response streams back from IBM Curator AI API
6. Full conversation history maintained

## Conclusion

The IBM Curator AI integration has been successfully implemented from a technical standpoint, but faces a **Content Security Policy limitation** that prevents iframe embedding from non-IBM domains. 

**Recommendation**: Implement Option 1 (Open in New Tab) as an immediate solution, then pursue Option 3 (API Integration) for a production-ready implementation.

## References

- IBM Curator AI URL: https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb
- Content Security Policy (CSP): https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- Frame Ancestors Directive: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors

---
*Last Updated: 2026-05-22*  
*Status: Integration Complete - CSP Limitation Identified*