# ReviewInn Unified Auth - Testing Guide

## 🚀 Quick Start Testing

Run these commands to test the unified authentication system:

```bash
# Start the application
npm run dev

# Or if using a different script
npm start
```

## 🧪 **Critical Test Scenarios**

### 1. **Authentication Flow Testing**

#### Login Test:
1. Open browser to `http://localhost:3000` (or your dev URL)
2. Click "Login" or access any protected feature
3. Enter valid credentials
4. **✅ Expected Result**: 
   - User should be logged in across entire app
   - Profile data should appear immediately
   - Navigation should update to show authenticated state

#### Logout Test:
1. While logged in, click "Logout"
2. **✅ Expected Result**:
   - User state cleared across entire app
   - Redirected to public view
   - No authentication data in localStorage
   - If you open multiple tabs, all should reflect logout

#### Registration Test:
1. Click "Register" 
2. Fill in registration form
3. Submit registration
4. **✅ Expected Result**:
   - User automatically logged in after registration
   - Welcome message or user data appears
   - No need to manually login after registration

### 2. **API Authentication Testing**

#### Protected API Calls:
1. Open browser dev tools (F12) → Network tab
2. Perform actions that make API calls (view profile, create review, etc.)
3. **✅ Check Network Requests**:
   - All API calls should include `Authorization: Bearer <token>` header
   - No calls should fail with 401 Unauthorized (unless intentionally testing)
   - Token should be consistent across all requests

#### Token Refresh Testing:
1. Login to the application
2. Wait for token to near expiration (or manually modify token expiry)
3. Make an API call that would trigger 401
4. **✅ Expected Result**:
   - Token should automatically refresh
   - Original request should retry and succeed
   - User should not be logged out

### 3. **Cross-Tab Synchronization**

#### Multi-Tab Test:
1. Open app in 2 browser tabs
2. Login in Tab 1
3. **✅ Tab 2 should automatically update** to show logged-in state
4. Logout in Tab 2
5. **✅ Tab 1 should automatically update** to logged-out state

### 4. **Browser Refresh Persistence**

#### Session Persistence Test:
1. Login to the application
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. **✅ Expected Result**:
   - User should remain logged in
   - User data should load correctly
   - No need to login again

### 5. **Error Handling**

#### Invalid Token Test:
1. Login to application
2. Open dev tools → Application → Local Storage
3. Manually corrupt the `reviewinn_jwt_token` value
4. Try to access a protected feature
5. **✅ Expected Result**:
   - App should detect invalid token
   - User should be prompted to login again
   - No app crashes or infinite loops

#### Network Error Test:
1. Login to application
2. Disconnect internet or block API endpoints
3. Try to perform authenticated actions
4. **✅ Expected Result**:
   - Graceful error messages
   - App doesn't crash
   - When connection restored, operations resume

## 🔍 **Debug Console Monitoring**

While testing, monitor the browser console for these log patterns:

### ✅ **Good Logs (Expected)**:
```
AuthStore: Login complete - user authenticated
🔐 HttpClient: Sending protected request with token
AuthProvider: User interactions loaded after login
useUnifiedAuth: Login successful
```

### ❌ **Bad Logs (Issues to Address)**:
```
⚠️ HttpClient: Sending protected request WITHOUT token
AuthStore: Token expired, logging out
useUnifiedAuth: Authentication required
Error: Authentication required
```

## 🎯 **Component-Specific Testing**

### Navigation/Header Component:
- [ ] Shows login/register buttons when logged out
- [ ] Shows user avatar/name when logged in  
- [ ] Logout button works correctly

### Protected Routes:
- [ ] Redirect to login when not authenticated
- [ ] Allow access when authenticated
- [ ] Show loading state during auth check

### Review Forms/Entity Creation:
- [ ] Require authentication before allowing submission
- [ ] Show auth modal when not logged in
- [ ] Submit successfully when authenticated

### Profile Pages:
- [ ] Load user data correctly
- [ ] Update user data works
- [ ] Show auth prompt when accessing other user profiles

## 🛠️ **Troubleshooting Common Issues**

### Issue: "useUnifiedAuth must be used within an AuthProvider"
**Solution**: Ensure your app is wrapped with `<AuthProvider>` in the root component.

### Issue: API calls failing with 401 Unauthorized  
**Solution**: Check that the service is using `createAuthenticatedRequestInit()` from auth utils.

### Issue: User state not updating across components
**Solution**: Verify components are using `useUnifiedAuth()` and not direct store access.

### Issue: Cross-tab sync not working
**Solution**: Check browser local storage events and ensure auth store persistence is enabled.

### Issue: Token refresh not working
**Solution**: Verify refresh token is stored and refresh endpoint is correctly configured.

## 📊 **Testing Checklist**

Before considering the unified auth system ready:

**Basic Auth Flow:**
- [ ] Login works ✅
- [ ] Logout works ✅  
- [ ] Registration + auto-login works ✅
- [ ] Session persistence after refresh works ✅

**API Integration:**
- [ ] All API calls include auth headers ✅
- [ ] Token refresh on 401 works ✅
- [ ] Error handling is graceful ✅

**UI/UX:**
- [ ] Auth state updates immediately in UI ✅
- [ ] Loading states work properly ✅
- [ ] Protected routes work correctly ✅

**Edge Cases:**
- [ ] Cross-tab synchronization works ✅
- [ ] Invalid token handling works ✅
- [ ] Network error recovery works ✅

## 🎉 **Success Criteria**

The unified auth system is working correctly when:

1. **Single interface**: All components use `useUnifiedAuth()` only
2. **Consistent behavior**: Login/logout works the same everywhere  
3. **No auth errors**: Console shows no authentication-related errors
4. **Smooth UX**: No jarring auth transitions or loading issues
5. **Data persistence**: Auth state survives browser refreshes
6. **API security**: All protected endpoints properly authenticated

---

If all tests pass, congratulations! Your unified authentication system is ready for production! 🚀