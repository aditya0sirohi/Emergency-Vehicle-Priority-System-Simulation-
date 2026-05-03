# Emergency Vehicle Priority System Debug - Fix Admin Trip Request Popup

## Approved Plan Steps

### 1. Add Debug Logs ✅ **COMPLETE**
   - [ ] backend/server.js: connection, register (admin/driver), trip_request receive/broadcast
   - [ ] src/app/driver/page.tsx: trip_request emit
   - [ ] src/app/admin/page.tsx: register, trip_request receive

### 2. Test Flow
   - [ ] Restart backend: `node backend/server.js`
   - [ ] Open admin page (login admin first)
   - [ ] Open driver page (login ambulance)
   - [ ] Request trip from driver
   - [ ] Check logs: backend terminal, driver console, admin console

### 3. Analyze Logs & Fix Root Cause
   - [ ] Backend no log → driver emit/auth issue
   - [ ] Backend logs but no 'admins' room → admin not registered
   - [ ] Backend broadcasts but admin no log → socket/listener issue
   - [ ] All logs + popup → UI/modal bug

### 4. Cleanup & Verify
   - [ ] Remove debug logs
   - [ ] Test full flow without logs
   - [ ] Confirm popup works ✅

**Next: Add logs, test, report results**

