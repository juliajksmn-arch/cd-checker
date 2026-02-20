---
auto_execution_mode: 0
description: Review code changes for bugs, security issues, and improvements
---
You are a senior software engineer performing a thorough code review to identify potential bugs.

Your task is to find all potential bugs and code improvements in the code changes. Focus on:
1. Logic errors and incorrect behavior
2. Edge cases that aren't handled
3. Null/undefined reference issues
4. Race conditions or concurrency issues
5. Security vulnerabilities
6. Improper resource management or resource leaks
7. API contract violations
8. Incorrect caching behavior, including cache staleness issues, cache key-related bugs, incorrect cache invalidation, and ineffective caching
9. Violations of existing code patterns or conventions

## Project-Specific Review Points (CD Checker)

### IFPI Data Processing
- **Data Source Quality**: Ensure English Wikipedia is used for IFPI data, not German sources
- **Table Parsing Logic**: Verify dynamic column detection via headers, not fixed indices
- **Data Validation**: Filter out entries where factory is empty or still contains 'IFPI' prefixes
- **Code Extraction**: _extract_ifpi_code must properly normalize SID codes (remove *, -, etc.)

### Flask Backend Architecture
- **Dependency Management**: Optional dependencies (pyzbar) should use deferred imports with proper error handling
- **Environment Configuration**: DISCOGS_TOKEN loaded from .env, proper error handling for missing tokens
- **API Integration**: Discogs API calls should handle rate limits and network errors gracefully
- **Data Augmentation**: _augment_identifiers must filter pseudo-information and only return real factory names

### Frontend Data Flow
- **UI Information Hierarchy**: Manufacturer info should display as separate lines, not nested in parentheses
- **State Management**: Global state consistency between barcode input, upload flow, and results display
- **Error Handling**: User-friendly error messages for upload failures, API errors, and data parsing issues
- **Loading States**: Clear loading indicators for both upload and API query operations

### Integration Testing Points
- **End-to-End Flow**: Image upload → barcode recognition → Discogs query → IFPI augmentation → UI display
- **Edge Cases**: No IFPI codes, invalid IFPI codes, multiple variants, missing manufacturer data
- **Data Format Consistency**: Backend factory_info structure matches frontend expectations
- **Performance**: Large datasets should use pagination, avoid blocking UI operations

Make sure to:
1. If exploring the codebase, call multiple tools in parallel for increased efficiency. Do not spend too much time exploring.
2. If you find any pre-existing bugs in the code, you should also report those since it's important for us to maintain general code quality for the user.
3. Do NOT report issues that are speculative or low-confidence. All your conclusions should be based on a complete understanding of the codebase.
4. Remember that if you were given a specific git commit, it may not be checked out and local code states may be different.
5. **Debugging Methodology**: Verify changes step-by-step: data scraping → backend processing → frontend display
6. **User Experience**: Provide preview windows for significant UI changes, ensure manufacturer information is clearly labeled and accessible