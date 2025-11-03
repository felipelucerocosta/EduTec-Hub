
## Backend Changes
- [x] Update `backend/registro.ts` to enforce institutional email restrictions during registration
- [x] Extend `backend/alfred.ts` with a new endpoint for generating secure passwords
- [x] Modify `backend/login.ts` to send email notifications on successful login

## Frontend Changes
- [x] Update `src/componentes/registro.tsx` to call backend login API instead of hardcoded accounts
- [x] Add "Forgot Password" UI to `src/componentes/registro.tsx`
- [x] Integrate Alfred for password generation based on institutional email in `src/componentes/registro.tsx`
- [x] Ensure frontend handles password generation flow and forgot password functionality

## Testing
- [ ] Test backend API integration for login
- [ ] Test Alfred password generation
- [ ] Test forgot password flow
- [ ] Test email notifications for login success
- [ ] Verify institutional email restrictions in registration
