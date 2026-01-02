# Guest View Feature

## Overview
Ang sistema ay mayroon nang dalawang uri ng guest view para sa iba't ibang purposes:

### 1. Guest View para sa Future Researchers
- Ang mga future researchers ay makakapag-access ng sistema pero hindi makikita ang actual data ng respondent
- Ang view na ito ay para sa pagpapakita ng functionality ng sistema para sa research purposes
- May QR code/link na pwedeng ilagay sa Chapter 4 ng research paper
- Display lang ng system features, walang actual company data

### 2. Guest View para sa Clients
- Ang mga clients ng company ay makakapag-access ng sistema
- Makikita nila ang **actual system data** (real company information)
- Parehong may **viewer role** tulad ng researchers - same functionality at permissions
- Parehong view-only access - hindi pwedeng mag-edit, mag-add, o mag-delete
- Ang pagkakaiba lang ay ang data na makikita: researchers = sample data, clients = actual data

## Who Can Generate Special Links/QR Codes?

**Master Admin lang** ang may permission mag-generate ng special links at QR codes para sa guest access.

## How to Generate Special Link/QR Code

### Para sa Future Researchers (Demo View):
1. Login as **Master Admin**
2. Pumunta sa **System Settings**
3. Hanapin ang **Guest Access** section o **Public Links** section
4. Click **"Generate Researcher Link"** o **"Generate Demo Link"**
5. Makikita mo ang:
   - **Special Link** - Copy this link para i-share
   - **QR Code** - Download o copy ang QR code image
6. Pwedeng i-print ang QR code o i-embed sa research paper

### Para sa Clients (Actual Data View):
1. Login as **Master Admin**
2. Pumunta sa **System Settings**
3. Hanapin ang **Guest Access** section
4. Click **"Generate Client Link"**
5. Makikita mo ang:
   - **Special Link** - I-share sa clients
   - **QR Code** - Para sa easy access
6. Ang link na ito ay connected sa actual company data

## Link Format
- **Researcher/Demo Link**: `https://your-domain.com/guest/demo` o `https://your-domain.com/guest/researcher`
- **Client Link**: `https://your-domain.com/guest/client/[unique-token]` o `https://your-domain.com/guest/viewer/[unique-token]`

## Important Notes
- Ang Master Admin ay pwedeng mag-generate ng multiple links para sa iba't ibang purposes
- Pwedeng i-revoke o i-disable ang links kung kailangan
- Ang QR codes ay pwedeng i-download as PNG o SVG format
- Ang links ay may expiration date (optional) para sa security
- Parehong researchers at clients ay may **same viewer role** - ang pagkakaiba lang ay ang data visibility

## Access Control
- **Future Researchers**: Viewer role, view-only access, **sample/demo data** lang
- **Clients**: Viewer role, view-only access, **actual system data**
- Parehong may **same viewer role** at **same functionality** - view-only lang
- Parehong hindi pwedeng mag-edit, mag-add, o mag-delete ng data
- Ang pagkakaiba lang: **Researchers = sample data**, **Clients = actual data**

