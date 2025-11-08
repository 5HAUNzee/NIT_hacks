import { GITHUB_TOKEN } from '@env';

// Debug: Check if token is loaded (only log if it exists, don't expose the actual token)
console.log('GitHub token loaded:', GITHUB_TOKEN ? 'Yes (token present)' : 'No (using rate-limited API)');

/**
 * Extract GitHub username from various GitHub URL formats
 * @param {string} githubLink - The GitHub profile link
 * @returns {string|null} - The extracted username or null
 */
const extractGithubUsername = (githubLink) => {
  if (!githubLink) return null;
  
  try {
    // Remove trailing slashes
    const cleanUrl = githubLink.trim().replace(/\/$/, '');
    
    // Handle different URL formats
    // https://github.com/username
    // http://github.com/username
    // github.com/username
    // @username
    
    if (cleanUrl.startsWith('@')) {
      return cleanUrl.substring(1);
    }
    
    const patterns = [
      /github\.com\/([^\/\?#]+)/i,
      /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting GitHub username:', error);
    return null;
  }
};

/**
 * Fetch GitHub user profile information
 * @param {string} githubLink - The GitHub profile link or username
 * @returns {Promise<Object|null>} - GitHub user data or null if error
 */
export const fetchGithubProfile = async (githubLink) => {
  try {
    const username = extractGithubUsername(githubLink);
    
    if (!username) {
      console.log('Invalid GitHub link or username:', githubLink);
      return null;
    }
    
    // Prepare headers - token is optional
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    // Only add authorization if token exists
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers,
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('GitHub user not found:', username);
        return null;
      }
      if (response.status === 403) {
        console.log('GitHub API rate limit exceeded. Add GITHUB_TOKEN to .env for higher limits');
        return null;
      }
      console.log(`GitHub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      username: data.login,
      name: data.name,
      avatar: data.avatar_url,
      bio: data.bio,
      company: data.company,
      location: data.location,
      email: data.email,
      blog: data.blog,
      twitter: data.twitter_username,
      publicRepos: data.public_repos,
      publicGists: data.public_gists,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      profileUrl: data.html_url,
    };
  } catch (error) {
    console.error('Error fetching GitHub profile:', error);
    return null;
  }
};

/**
 * Fetch user's GitHub repositories
 * @param {string} githubLink - The GitHub profile link or username
 * @param {number} limit - Maximum number of repos to fetch (default: 10)
 * @returns {Promise<Array|null>} - Array of repositories or null if error
 */
export const fetchGithubRepos = async (githubLink, limit = 10) => {
  try {
    const username = extractGithubUsername(githubLink);
    
    if (!username) {
      console.log('Invalid GitHub link or username:', githubLink);
      return null;
    }
    
    // Prepare headers - token is optional
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    // Only add authorization if token exists
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`,
      {
        headers,
      }
    );
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('GitHub API rate limit exceeded');
      }
      console.log(`GitHub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      isPrivate: repo.private,
      isFork: repo.fork,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
    }));
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    return null;
  }
};

/**
 * Fetch user's GitHub activity/events
 * @param {string} githubLink - The GitHub profile link or username
 * @param {number} limit - Maximum number of events to fetch (default: 10)
 * @returns {Promise<Array|null>} - Array of events or null if error
 */
export const fetchGithubActivity = async (githubLink, limit = 10) => {
  try {
    const username = extractGithubUsername(githubLink);
    
    if (!username) {
      console.log('Invalid GitHub link or username:', githubLink);
      return null;
    }
    
    // Prepare headers - token is optional
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    // Only add authorization if token exists
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const response = await fetch(
      `https://api.github.com/users/${username}/events/public?per_page=${limit}`,
      {
        headers,
      }
    );
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('GitHub API rate limit exceeded');
      }
      console.log(`GitHub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return data.map(event => ({
      id: event.id,
      type: event.type,
      repo: event.repo.name,
      createdAt: event.created_at,
      payload: event.payload,
    }));
  } catch (error) {
    console.error('Error fetching GitHub activity:', error);
    return null;
  }
};

/**
 * Get GitHub contribution stats
 * @param {string} githubLink - The GitHub profile link or username
 * @returns {Promise<Object|null>} - Contribution stats or null if error
 */
export const fetchGithubStats = async (githubLink) => {
  try {
    const username = extractGithubUsername(githubLink);
    
    if (!username) {
      console.log('Invalid GitHub link or username:', githubLink);
      return null;
    }
    
    console.log('Fetching GitHub stats for:', username);
    
    // Fetch profile and repos in parallel
    const [profile, repos] = await Promise.all([
      fetchGithubProfile(githubLink),
      fetchGithubRepos(githubLink, 100), // Fetch more repos for accurate stats
    ]);
    
    if (!profile) {
      console.log('Failed to fetch GitHub profile for:', username);
      return null;
    }
    
    if (!repos) {
      console.log('Failed to fetch GitHub repos for:', username);
      return null;
    }
    
    // Calculate stats from repos
    const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks, 0);
    const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];
    const mostStarredRepo = repos.reduce((max, repo) => 
      repo.stars > (max?.stars || 0) ? repo : max, null
    );
    
    return {
      profile,
      totalRepos: profile.publicRepos,
      totalStars,
      totalForks,
      languages,
      mostStarredRepo,
      followers: profile.followers,
      following: profile.following,
    };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return null;
  }
};
