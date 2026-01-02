# Roles at Permissions

## Overview
Ang sistema ay mayroon nang role-based access control (RBAC) na nagbibigay ng iba't ibang permissions sa bawat role.

## Roles at Permissions Table

| Role | Revenue | Expenses | Billing | Collection | Close/Lock Project | View Reports | Delete Project |
|------|---------|----------|---------|------------|-------------------|--------------|----------------|
| Master Admin | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| System Administrator / Project Manager | ✖ | ✖ | ✖ | ✖ | ✔ | ✔ | ✖ |
| Revenue Officer | ✔ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ |
| Disbursing Officer | ✖ | ✔ | ✖ | ✖ | ✖ | ✔ | ✖ |
| Billing Officer | ✖ | ✖ | ✔ | ✖ | ✖ | ✔ | ✖ |
| Collecting Officer | ✖ | ✖ | ✖ | ✔ | ✖ | ✔ | ✖ |
| Viewer / Auditor / Guest | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ |

## Role Descriptions

### Master Admin
- May full access sa lahat ng features
- Tanging role na may permission mag-delete ng project
- May permission i-approve ang mga bagong accounts

### System Administrator / Project Manager
- Pwedeng mag-close/lock ng projects
- Pwedeng mag-view ng reports
- Walang access sa revenue, expenses, billing, at collection management

### Officers (Revenue, Disbursing, Billing, Collecting)
- May access lang sa kani-kanilang assigned module
- Pwedeng mag-view ng reports
- Walang access sa pag-close/lock ng projects

### Viewer / Auditor / Guest
- View-only access
- Pwedeng mag-view ng reports
- Walang access sa pag-edit o pag-delete

