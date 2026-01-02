# Due Date at Days Due Feature

## Overview
Ang sistema ay mayroon nang Due Date at Days Due tracking para sa mas mahusay na monitoring ng payment schedules.

## Features

### 1. Due Date Column
- Mayroon nang "Due Date" column sa billing at collection tables
- Pwedeng i-set ang due date kapag nag-a-add o nag-e-edit ng billing/collection entries

### 2. Days Due Column
- Mayroon nang "Days Due" column na automatically calculated
- Ang Days Due ay ang bilang ng araw mula sa due date hanggang sa current date
- Automatically nag-u-update araw-araw

## Calculation
```
Days Due = Current Date - Due Date
```

Kung ang result ay:
- **Positive number**: Overdue (lampas na sa due date)
- **Zero**: Due today
- **Negative number**: Not yet due (hindi pa due)

## Display
- Parehong ipinapakita ang Due Date at Days Due sa tables
- May color coding para sa mas madaling identification:
  - Red: Overdue
  - Yellow/Orange: Due soon
  - Green: Not yet due

