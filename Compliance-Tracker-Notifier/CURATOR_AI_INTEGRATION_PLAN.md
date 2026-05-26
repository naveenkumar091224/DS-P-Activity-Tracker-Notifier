# IBM Curator AI Integration Plan

## Overview
Replace the current demo ChatbotWidget with IBM Curator AI chatbot integration to provide intelligent assistance for the DS&P Activity Tracker application.

## Current State
- **Current Component**: `ChatbotWidget.tsx` - A demo assistant with hardcoded responses
- **Location**: `frontend/src/components/ChatbotWidget.tsx`
- **Features**: 
  - Basic Q&A about tasks, projects, Excel import
  - Hardcoded responses based on keyword matching
  - No real AI integration

## Target State
- **New Component**: IBM Curator AI embedded chatbot
- **Integration Method**: Embed IBM Curator AI chat interface
- **URL**: https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb

## Integration Approach

### Option 1: iFrame Embedding (Recommended for Quick Integration)
**Pros:**
- Quick to implement
- No need to manage authentication separately
- IBM handles all UI and functionality
- Automatic updates from IBM

**Cons:**
- Less customization control
- Dependent on IBM's iframe policies
- May have CORS restrictions

**Implementation:**
```tsx
<iframe
  src="https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb"
  width="100%"
  height="600px"
  frameBorder="0"
  title="IBM Curator AI Assistant"
  allow="clipboard-write"
/>
```

### Option 2: API Integration (For Custom UI)
**Pros:**
- Full control over UI/UX
- Can match application design
- Better integration with app context

**Cons:**
- Requires API credentials
- More development effort
- Need to handle authentication

**Requirements:**
- IBM Curator AI API endpoint
- Authentication tokens/API keys
- Custom UI implementation

### Option 3: Hybrid Approach
- Use iframe for initial integration
- Gradually migrate to API-based custom UI
- Maintain consistent user experience

## Implementation Steps

### Phase 1: Basic iFrame Integration (Immediate)
1. ✅ Create backup of current ChatbotWidget.tsx
2. ⬜ Update ChatbotWidget to embed IBM Curator AI iframe
3. ⬜ Adjust styling to match application theme
4. ⬜ Test iframe embedding and functionality
5. ⬜ Handle responsive design for different screen sizes

### Phase 2: Enhanced Integration (Short-term)
1. ⬜ Add context passing to chatbot (if API available)
   - Current user information
   - Active project details
   - Recent tasks
2. ⬜ Implement authentication bridge (if needed)
3. ⬜ Add error handling for iframe loading failures
4. ⬜ Implement fallback to demo assistant if IBM service unavailable

### Phase 3: Advanced Features (Long-term)
1. ⬜ Investigate IBM Curator AI API for deeper integration
2. ⬜ Build custom UI matching application design
3. ⬜ Implement context-aware suggestions
4. ⬜ Add analytics and usage tracking
5. ⬜ Enable chatbot to trigger actions in the application

## Technical Considerations

### Security
- Ensure iframe sandbox attributes are properly configured
- Validate IBM Curator AI domain for CSP policies
- Handle authentication tokens securely
- Implement proper CORS headers if using API

### Performance
- Lazy load iframe to improve initial page load
- Implement loading states
- Handle network failures gracefully
- Cache responses where appropriate

### User Experience
- Maintain consistent launcher button design
- Preserve minimize/maximize functionality
- Ensure smooth transitions
- Provide clear loading indicators

### Accessibility
- Maintain ARIA labels and roles
- Ensure keyboard navigation works
- Provide alternative text for screen readers
- Test with accessibility tools

## File Changes Required

### 1. ChatbotWidget.tsx
- Replace demo logic with IBM Curator AI iframe
- Maintain launcher button and panel structure
- Update styling for iframe container
- Add error handling and fallback

### 2. App.css
- Update chatbot styles for iframe container
- Ensure responsive design
- Maintain theme consistency

### 3. Environment Configuration
- Add IBM Curator AI URL to environment variables
- Configure API keys if using API integration
- Set up fallback URLs

## Testing Checklist

### Functional Testing
- [ ] Chatbot opens and closes correctly
- [ ] Iframe loads IBM Curator AI interface
- [ ] Minimize/maximize functionality works
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Error handling when iframe fails to load

### Integration Testing
- [ ] Chatbot works with existing authentication
- [ ] No conflicts with other components
- [ ] Performance impact is acceptable
- [ ] Works across different browsers

### User Acceptance Testing
- [ ] Users can interact with IBM Curator AI
- [ ] Responses are relevant and helpful
- [ ] UI matches application design
- [ ] Loading times are acceptable

## Rollback Plan
- Keep original ChatbotWidget.tsx as backup
- Implement feature flag to toggle between old/new chatbot
- Document rollback procedure
- Monitor error rates and user feedback

## Success Metrics
- User engagement with chatbot (open rate, messages sent)
- Response quality and relevance
- Task completion rate via chatbot assistance
- User satisfaction scores
- Performance metrics (load time, response time)

## Next Steps
1. Verify IBM Curator AI iframe embedding is allowed
2. Test iframe integration in development environment
3. Implement basic iframe embedding
4. Gather user feedback
5. Plan for API integration if needed

## Notes
- IBM Curator AI URL: https://servicesessentials.ibm.com/curatorai/apps/ui/new-chat/6a101ef9926c702551efebbb
- Current demo assistant will be replaced
- Maintain backward compatibility during transition
- Consider gradual rollout to users

## Questions to Resolve
1. Does IBM Curator AI allow iframe embedding?
2. Are there API credentials available for deeper integration?
3. What context can be passed to the chatbot?
4. Are there usage limits or quotas?
5. What is the authentication mechanism?