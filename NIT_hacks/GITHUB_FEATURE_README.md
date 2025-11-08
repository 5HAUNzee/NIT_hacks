# GitHub Profile Integration

This document describes the GitHub profile integration feature added to the NIT_hacks application.

## Overview

Users can now add their GitHub profile link during signup, and the application will automatically fetch and display their GitHub information in their profile section.

## Features

### 1. **GitHub Link Collection During Signup**
- Added a new input field in the signup form (`Signup.js`) for users to enter their GitHub profile URL
- The GitHub link is stored in Firestore alongside other user information
- Accepts various GitHub URL formats:
  - `https://github.com/username`
  - `http://github.com/username`
  - `github.com/username`
  - `@username`

### 2. **GitHub Data Service** (`services/githubService.js`)

A comprehensive service that fetches GitHub data using the GitHub API:

#### Functions:
- **`fetchGithubProfile(githubLink)`** - Fetches user's basic GitHub profile information
- **`fetchGithubRepos(githubLink, limit)`** - Fetches user's repositories (default: 10 repos)
- **`fetchGithubActivity(githubLink, limit)`** - Fetches user's public activity/events
- **`fetchGithubStats(githubLink)`** - Calculates comprehensive GitHub statistics

#### Data Retrieved:
- Profile information (name, bio, avatar, location, company, etc.)
- Repository count, followers, following
- Total stars across all repositories
- Programming languages used
- Most starred repository
- Recent repositories with descriptions

### 3. **Profile Screen** (`user_interfaces/home/Profile.js`)

A new screen that displays:

#### User Information:
- Name, username, email
- Profile avatar (initials)
- User statistics (projects, circles, connections)

#### GitHub Section:
- **Profile Card:**
  - GitHub avatar
  - Name and username
  - Bio
  - Link to GitHub profile
  
- **GitHub Statistics:**
  - Total repositories
  - Followers count
  - Total stars across all repos
  - Following count
  
- **Additional Info:**
  - Location
  - Company
  - Personal website/blog
  
- **Top Languages:**
  - List of programming languages used in repositories
  
- **Recent Repositories:**
  - Repository name and description
  - Primary language
  - Stars and forks count
  - Direct link to each repository

#### Features:
- Pull-to-refresh functionality to reload GitHub data
- Loading states for better UX
- Error handling for failed GitHub API calls
- Clickable links to open GitHub profile and repositories in browser

## Setup Instructions

### 1. Install Dependencies

```powershell
cd NIT_hacks
npm install react-native-dotenv
```

### 2. Environment Variables

The GitHub token is already set in `.env.local`:
```
GITHUB_TOKEN=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
```

**Important:** The token is read from the environment file and used securely in the `githubService.js` without hardcoding it in the code.

### 3. Babel Configuration

The `babel.config.js` has been updated to support environment variables using `react-native-dotenv`.

### 4. Navigation

The Profile screen has been added to the navigation stack in `App.js` and can be accessed from the HomeDashboard.

## Usage

### For Users:
1. **During Signup:**
   - Enter your GitHub profile URL in the "GitHub Profile Link" field
   - The format can be `https://github.com/yourusername` or just `yourusername`

2. **Viewing Profile:**
   - Navigate to your profile from the HomeDashboard (tap the profile button in the header)
   - Your GitHub information will be automatically loaded and displayed
   - Pull down to refresh GitHub data

3. **Interacting with GitHub Data:**
   - Tap "View Profile" to open your GitHub profile in a browser
   - Tap any repository to open it in a browser

### For Developers:

#### Accessing GitHub Data:
```javascript
import { fetchGithubProfile, fetchGithubRepos, fetchGithubStats } from '../../services/githubService';

// Fetch profile
const profile = await fetchGithubProfile('https://github.com/username');

// Fetch repositories
const repos = await fetchGithubRepos('https://github.com/username', 10);

// Fetch comprehensive stats
const stats = await fetchGithubStats('https://github.com/username');
```

## File Changes

### New Files:
1. `services/githubService.js` - GitHub API service
2. `user_interfaces/home/Profile.js` - Profile screen component
3. `GITHUB_FEATURE_README.md` - This documentation

### Modified Files:
1. `user_interfaces/auth/Signup.js` - Added GitHub link input field
2. `App.js` - Added Profile screen to navigation
3. `babel.config.js` - Added react-native-dotenv plugin configuration
4. `.env.local` - GitHub token (already existed)

## Security Considerations

1. **GitHub Token:**
   - The token is stored in `.env.local` (not committed to version control)
   - The token is imported using `@env` module in the service file
   - Never hardcoded in the application code

2. **API Rate Limits:**
   - GitHub API has rate limits (5000 requests/hour for authenticated requests)
   - The token helps increase the rate limit
   - Consider implementing caching for production use

3. **User Privacy:**
   - Only public GitHub information is fetched
   - Users control what GitHub link they provide
   - GitHub link is stored securely in Firestore

## Future Enhancements

1. **Caching:** Implement caching to reduce API calls and improve performance
2. **Contribution Graph:** Display GitHub contribution calendar
3. **Pinned Repositories:** Show user's pinned repositories
4. **Edit Profile:** Allow users to update their GitHub link
5. **GitHub OAuth:** Implement GitHub OAuth for more seamless integration
6. **Private Repositories:** With user permission, show private repository stats
7. **Team Integration:** Link team projects with GitHub repositories

## Troubleshooting

### GitHub data not loading:
1. Check that the GitHub link is valid
2. Verify the GitHub token in `.env.local` is valid
3. Check internet connectivity
4. Look for API rate limit errors in console

### Environment variable not found:
1. Ensure `react-native-dotenv` is installed
2. Clear Metro bundler cache: `npx expo start -c`
3. Verify babel configuration is correct

## API Reference

### GitHub REST API v3
- Documentation: https://docs.github.com/en/rest
- Base URL: `https://api.github.com`
- Authentication: Personal Access Token

### Endpoints Used:
- `GET /users/:username` - User profile
- `GET /users/:username/repos` - User repositories
- `GET /users/:username/events/public` - User activity

## Support

For issues or questions:
1. Check the console for error messages
2. Verify GitHub token is valid
3. Ensure all dependencies are installed
4. Check GitHub API status: https://www.githubstatus.com/
