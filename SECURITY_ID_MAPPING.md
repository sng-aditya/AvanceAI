# Security ID Mapping Documentation

## Overview
The `Security_Id.csv` file contains the mapping between security IDs and their display names for BSE and NSE options and futures. This file is crucial for the trading platform to function properly.

## File Format
The CSV file has the following structure:

```csv
SECURITY_ID,DISPLAY_NAME
1100027,SENSEX 06 NOV 75200 PUT
1100033,SENSEX 06 NOV 75100 CALL
35000,BANKNIFTY 30 SEP 40600 CALL
35001,BANKNIFTY 30 SEP 40600 PUT
37054,NIFTY NOV FUT
51,Sensex
2,
```

## Column Descriptions

### SECURITY_ID
- Unique numeric identifier for each financial instrument
- Used by the Dhan API to identify specific options, futures, and indices
- Examples: `1100027`, `35000`, `51`

### DISPLAY_NAME
- Human-readable name of the financial instrument
- Format varies by instrument type:
  - **Options**: `INDEX EXPIRY STRIKE TYPE` (e.g., "SENSEX 06 NOV 75200 PUT")
  - **Futures**: `INDEX EXPIRY FUT` (e.g., "NIFTY NOV FUT")
  - **Indices**: Simple name (e.g., "Sensex")

## Instrument Types Included

1. **SENSEX Options**: Various strike prices and expiry dates
2. **BANKNIFTY Options**: Call and Put options with different strikes
3. **NIFTY Options**: Multiple expiry dates and strike prices
4. **Futures**: Index futures contracts
5. **Indices**: Base index values (Sensex, Nifty, etc.)

## Usage in Application

When a user clicks on a strike price in the trading interface:
1. The system looks up the corresponding `SECURITY_ID` from this CSV file
2. Uses the `SECURITY_ID` to make API calls to Dhan for real-time data
3. Displays the `DISPLAY_NAME` in the user interface

## Data Source
This data represents publicly available security identifiers from BSE and NSE exchanges and can be obtained from official exchange websites or trading API documentation.

## File Location
Place this file in the `backend/` directory of your project.

## Sample Data Structure
```csv
SECURITY_ID,DISPLAY_NAME
1100027,SENSEX 06 NOV 75200 PUT
1100033,SENSEX 06 NOV 75100 CALL
35000,BANKNIFTY 30 SEP 40600 CALL
35001,BANKNIFTY 30 SEP 40600 PUT
37054,NIFTY NOV FUT
51,Sensex
```

## Important Notes
- This file must be present for the application to function correctly
- The file contains public market data and is safe to include in version control
- Update this file periodically as new options contracts are introduced
- Ensure the CSV format is maintained (comma-separated, no extra spaces)