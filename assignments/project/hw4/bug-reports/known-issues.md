# Known Issues Log

## Active Issues

### BUG-2025-01-30-001
**Status**: Open  
**Priority**: High  
**Summary**: Task creation fails when due date is set to today  
**Assigned To**: Development Team  
**Created**: 2025-01-30  
**Description**: Date validation incorrectly rejects today's date as "in the past"  
**Impact**: Users cannot create tasks with today's due date  
**Workaround**: Set due date to tomorrow, then edit to today  

### BUG-2025-01-30-002
**Status**: In Progress  
**Priority**: Medium  
**Summary**: Loading spinner doesn't show on slow API calls  
**Assigned To**: Frontend Team  
**Created**: 2025-01-30  
**Description**: Loading states not properly displayed during slow network requests  
**Impact**: Poor user experience during slow connections  
**Workaround**: None - users must wait without feedback  

### BUG-2025-01-30-003
**Status**: Open  
**Priority**: Low  
**Summary**: Task description field allows HTML injection  
**Assigned To**: Security Team  
**Created**: 2025-01-30  
**Description**: HTML tags in task descriptions are rendered as HTML instead of plain text  
**Impact**: Potential XSS vulnerability, UI formatting issues  
**Workaround**: Avoid using HTML tags in descriptions  

## Issues Under Investigation

### BUG-2025-01-30-004
**Status**: Investigating  
**Priority**: Medium  
**Summary**: Session timeout doesn't redirect to login page  
**Assigned To**: Backend Team  
**Created**: 2025-01-30  
**Description**: When JWT token expires, users receive 401 errors instead of being redirected  
**Impact**: Confusing user experience when session expires  
**Workaround**: Manual page refresh or logout/login  

### BUG-2025-01-30-005
**Status**: Investigating  
**Priority**: Low  
**Summary**: Mobile responsive design issues on iPhone SE  
**Assigned To**: Frontend Team  
**Created**: 2025-01-30  
**Description**: Task list doesn't display properly on small screens (< 375px width)  
**Impact**: Poor mobile experience on very small devices  
**Workaround**: Use larger screen or rotate to landscape  

## Deferred Issues

### BUG-2025-01-30-006
**Status**: Deferred  
**Priority**: Low  
**Summary**: Browser back button doesn't work properly in SPA  
**Assigned To**: None  
**Created**: 2025-01-30  
**Description**: Browser back button sometimes doesn't navigate correctly in single-page app  
**Impact**: Minor navigation inconvenience  
**Workaround**: Use in-app navigation  
**Deferral Reason**: Low priority, complex fix required for minimal benefit  

## Summary Statistics

| Status | Count | Percentage |
|--------|-------|------------|
| Open | 3 | 50% |
| In Progress | 1 | 17% |
| Investigating | 2 | 33% |
| Deferred | 1 | 17% |
| **Total** | **6** | **100%** |

## Priority Breakdown

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 0 | 0% |
| High | 1 | 17% |
| Medium | 2 | 33% |
| Low | 3 | 50% |
| **Total** | **6** | **100%** |

## Component Breakdown

| Component | Issues | Percentage |
|-----------|--------|------------|
| Frontend | 3 | 50% |
| Backend | 1 | 17% |
| Security | 1 | 17% |
| Mobile | 1 | 17% |
| **Total** | **6** | **100%** |

## Action Items

### Immediate (High Priority)
1. **BUG-2025-01-30-001**: Fix date validation logic for today's date
   - **Owner**: Backend Team
   - **Due Date**: 2025-01-31
   - **Effort**: 2 hours

### Short Term (Medium Priority)
2. **BUG-2025-01-30-002**: Implement proper loading states
   - **Owner**: Frontend Team
   - **Due Date**: 2025-02-01
   - **Effort**: 4 hours

3. **BUG-2025-01-30-004**: Handle session timeout gracefully
   - **Owner**: Backend Team
   - **Due Date**: 2025-02-01
   - **Effort**: 3 hours

### Long Term (Low Priority)
4. **BUG-2025-01-30-003**: Implement input sanitization
   - **Owner**: Security Team
   - **Due Date**: 2025-02-03
   - **Effort**: 6 hours

5. **BUG-2025-01-30-005**: Fix mobile responsive issues
   - **Owner**: Frontend Team
   - **Due Date**: 2025-02-05
   - **Effort**: 8 hours

## Notes

- All critical and high-priority bugs must be resolved before production deployment
- Medium-priority bugs should be addressed in the next sprint
- Low-priority bugs can be scheduled for future releases
- Regular bug triage meetings should be held weekly

**Last Updated**: 2025-01-30  
**Next Review**: 2025-01-31  
**Maintained By**: QA Team  