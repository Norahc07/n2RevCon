# Delete Project Permissions

## Overview
Ang sistema ay mayroon nang mas mahigpit na permissions para sa pag-delete ng projects para maiwasan ang accidental deletion.

## Restriction
- **Tanging Master Admin lang** ang may permission mag-delete ng project
- Ang lahat ng iba pang roles ay walang access sa delete project feature
- Kahit ang System Administrator at Project Manager ay hindi pwedeng mag-delete ng project

## Rationale
- Para maiwasan ang accidental deletion ng important data
- Para mapanatili ang data integrity
- Para magkaroon ng centralized control sa critical operations

## Workflow
1. Tanging Master Admin ang makakakita ng Delete button
2. May confirmation dialog bago i-execute ang delete action
3. Ang deleted project ay permanent na maaalis sa sistema

## Important Reminders
- Ang pag-delete ng project ay **permanent** at **irreversible**
- Lahat ng associated data (revenue, expenses, billings, collections) ay maaalis din
- Dapat mag-ingat sa paggamit ng feature na ito

