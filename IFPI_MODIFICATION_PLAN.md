# CD Checker - IFPI Manufacturer Display Refinement Plan

## Project Overview

The CD Checker is a Flask-based web application that helps users verify CD authenticity by querying Discogs API using barcode information. The application provides two input methods: manual barcode entry and image upload with automatic barcode recognition.

### Current Architecture

- **Backend**: Flask app (`app.py`) with Discogs API integration
- **Frontend**: HTML/CSS/JavaScript with modal-based detail display
- **Key Features**:
  - Barcode scanning from images using `pyzbar`
  - Discogs API integration for release information
  - Local IFPI database for manufacturer lookup
  - Two input methods: manual entry and image upload

### Current IFPI Integration

The application currently:
1. Scrapes IFPI data from Wikipedia into `data/ifpi_db.json`
2. Augments Discogs release data with manufacturer information
3. Displays IFPI codes and manufacturer info in parentheses in the UI

## Current Issue

The user wants to refine the IFPI manufacturer display:
- **Problem**: Manufacturer information is displayed within parentheses alongside IFPI codes
- **Requirement**: Display manufacturer information on the same level as IFPI codes, not within parentheses
- **Additional**: Ensure manufacturer data is correctly extracted in English from Discogs Wiki
- **Logic**: Verify IFPI lookup correctly handles inner and outer IFPI codes without confusion

## Modification Plan

### Phase 1: Update IFPI Data Source (Priority: High)

**Objective**: Ensure manufacturer data is extracted from English Wikipedia source

**Tasks**:
1. Modify `scripts/scraper_ifpi.py` to use English Wikipedia page for IFPI data
2. Update parsing logic to correctly extract SID codes as keys
3. Ensure proper mapping of Presswerk (factory) and Land (country) fields
4. Regenerate `data/ifpi_db.json` with English data

**Expected Outcome**: Clean English manufacturer names in the IFPI database

### Phase 2: Backend Logic Refinement (Priority: Medium)

**Objective**: Ensure proper IFPI lookup and data augmentation

**Tasks**:
1. Verify `_augment_identifiers()` function in `app.py` correctly handles inner/outer IFPI codes
2. Ensure filtering logic removes pseudo-information (entries still starting with 'IFPI')
3. Maintain existing factory_info structure but prepare for UI changes

**Expected Outcome**: Clean manufacturer data passed to frontend

### Phase 3: Frontend UI Modification (Priority: High)

**Objective**: Display manufacturer information as separate lines, not in parentheses

**Tasks**:
1. Update `static/app.js` `renderModal()` function
2. Modify `renderSidLine()` to display manufacturer info as separate line with "制造商" label
3. Update CSS styling if needed for new layout
4. Ensure both inner and outer SID codes display manufacturer info correctly

**Expected Outcome**: Manufacturer info displayed as separate labeled lines

### Phase 4: Testing and Validation (Priority: Medium)

**Objective**: Verify the complete flow works correctly

**Tasks**:
1. Test with releases containing IFPI codes
2. Verify manufacturer info displays correctly in English
3. Confirm inner/outer IFPI code logic works without confusion
4. Provide preview window for final approval

## Key Files to Modify

1. **`scripts/scraper_ifpi.py`**: Update Wikipedia source and parsing logic
2. **`data/ifpi_db.json`**: Regenerate with English data
3. **`static/app.js`**: Update `renderModal()` and `renderSidLine()` functions
4. **`static/style.css`**: Potential styling updates (if needed)

## Current Implementation Details

### Backend IFPI Processing
```python
def _augment_identifiers(identifiers):
    # Extracts IFPI codes and looks up manufacturer info
    # Filters out pseudo-information (entries starting with 'IFPI')
    # Adds factory_info to identifier objects
```

### Frontend Display Logic
```javascript
function renderSidLine(label, value, factoryInfo) {
    // Currently displays factoryInfo in parentheses
    const info = factoryInfo ? ` <span class="metaLabel">(${escHtml(factoryInfo)})</span>` : '';
    return `<li><span class="metaLabel">${label}</span>${escHtml(value)}${info}</li>`;
}
```

### IFPI Data Structure
```json
{
  "LY26": {
    "factory": "Sony DADC",
    "country": "Austria"
  }
}
```

## Success Criteria

1. ✅ Manufacturer information displays as separate lines with "制造商" label
2. ✅ Data is sourced from English Wikipedia
3. ✅ IFPI lookup correctly handles inner and outer codes
4. ✅ No pseudo-information displayed (filtered out 'IFPI...' entries)
5. ✅ Clean, professional UI layout
6. ✅ All existing functionality preserved

## Testing Strategy

1. **Unit Testing**: Verify IFPI database generation and lookup
2. **Integration Testing**: Test complete flow from barcode to display
3. **UI Testing**: Verify manufacturer info displays correctly
4. **Regression Testing**: Ensure existing features still work

## Deployment Notes

- Restart Flask service after backend changes
- Clear browser cache after frontend changes
- Test with various IFPI code patterns
- Verify both input methods (manual and upload) work correctly

## Previous Session Summary

The application has been successfully enhanced with:
- Barcode decoding from uploaded images
- Local IFPI database integration
- Discogs data augmentation with manufacturer info
- Two input methods (manual and upload)
- Modal-based detail display

Current session focuses on refining the display format of IFPI manufacturer information to improve user experience and data clarity.
