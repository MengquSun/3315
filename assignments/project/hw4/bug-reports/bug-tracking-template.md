# Bug Report Template

## Bug Information

**Bug ID**: BUG-[YYYY-MM-DD]-[###]  
**Date Reported**: [YYYY-MM-DD]  
**Reporter**: [Name]  
**Assigned To**: [Developer Name]  
**Status**: [Open/In Progress/Resolved/Closed]  

## Priority & Severity

**Priority**: [Critical/High/Medium/Low]
- **Critical**: System crash, data loss, security vulnerability
- **High**: Major functionality broken, affects multiple users
- **Medium**: Minor functionality issues, workarounds available
- **Low**: Cosmetic issues, minor inconveniences

**Severity**: [Blocker/Major/Minor/Trivial]

## Bug Details

### Summary
Brief one-line description of the issue

### Description
Detailed description of the bug

### Steps to Reproduce
1. Step one
2. Step two
3. Step three
...

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- **Browser**: [Chrome/Firefox/Safari/Edge] Version X.X
- **OS**: [Windows/macOS/Linux] Version
- **Device**: [Desktop/Mobile/Tablet]
- **Screen Resolution**: [if UI related]

### Additional Information
- **Frequency**: [Always/Sometimes/Rarely]
- **Workaround Available**: [Yes/No] - [Description if yes]
- **Related Bugs**: [List any related bug IDs]

## Attachments
- [ ] Screenshots
- [ ] Screen recordings
- [ ] Console logs
- [ ] Network requests
- [ ] Test data

## Developer Notes
[Space for developer comments and investigation notes]

## Resolution
**Resolution Date**: [YYYY-MM-DD]  
**Fixed in Version**: [Version number]  
**Resolution Description**: [How the bug was fixed]  
**Test Results**: [Post-fix testing results]  

## Verification
**Verified By**: [QA Tester Name]  
**Verification Date**: [YYYY-MM-DD]  
**Verification Status**: [Pass/Fail]  
**Comments**: [Any additional notes]  

---

## Example Bug Report

**Bug ID**: BUG-2025-01-30-001  
**Date Reported**: 2025-01-30  
**Reporter**: Mengqu Sun  
**Assigned To**: Development Team  
**Status**: Open  

**Priority**: High  
**Severity**: Major  

### Summary
Task creation fails when due date is set to today

### Description
When creating a new task and setting the due date to today's date, the form submission fails with a validation error, even though the date should be valid.

### Steps to Reproduce
1. Log into the application
2. Navigate to "Create New Task"
3. Fill in task title: "Test Task"
4. Set due date to today's date using date picker
5. Select priority: "Medium"
6. Click "Create Task" button

### Expected Behavior
Task should be created successfully and appear in the task list

### Actual Behavior
Form shows validation error: "Due date cannot be in the past" even when today's date is selected

### Environment
- **Browser**: Chrome Version 120.0
- **OS**: macOS 14.2
- **Device**: Desktop
- **Screen Resolution**: 1920x1080

### Additional Information
- **Frequency**: Always
- **Workaround Available**: Yes - Set due date to tomorrow, then edit to today
- **Related Bugs**: None

### Developer Notes
Investigation needed: Date comparison logic may have timezone issues or inclusive/exclusive boundary problems.

### Resolution
**Resolution Date**: [Pending]  
**Fixed in Version**: [Pending]  
**Resolution Description**: [Pending]  
**Test Results**: [Pending]  

### Verification
**Verified By**: [Pending]  
**Verification Date**: [Pending]  
**Verification Status**: [Pending]  
**Comments**: [Pending]  