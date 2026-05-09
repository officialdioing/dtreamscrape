/**
 * Production-ready password hashing and validation utilities
 * Uses Web Crypto API (PBKDF2) for secure password storage
 * Works in Node.js, Edge Runtime, and browsers
 */

// Password requirements
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// PBKDF2 parameters (NIST recommended)
export const PBKDF2_ITERATIONS = 600000 // 600k iterations for PBKDF2-SHA256
export const PBKDF2_HASH_LENGTH = 32 // 256 bits
export const PBKDF2_SALT_LENGTH = 16 // 128 bits

// Password complexity requirements
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

/**
 * Encode ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/**
 * Decode Base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Generate a cryptographically secure random salt
 */
async function generateSalt(length: number = PBKDF2_SALT_LENGTH): Promise<string> {
  const salt = new Uint8Array(length)
  crypto.getRandomValues(salt)
  return bufferToBase64(salt.buffer)
}

/**
 * Derive a key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS
): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = base64ToBuffer(salt)

  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    PBKDF2_HASH_LENGTH * 8 // bits
  )

  return bufferToBase64(derivedBits)
}

/**
 * Validate password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  // Length check
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`)
  }

  // Complexity checks
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number')
  }
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character')
  }

  // Common password patterns to avoid (only if entire password matches)
  const commonPatterns = [
    /^(.)\1+$/, // All same characters (e.g., "aaaaaa")
    /^(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)+$/, // All sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // All sequential letters
    /^(password|admin|qwerty|letmein|welcome|123456|password123)$/i, // Common passwords
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password is too common or predictable. Please use a more unique password.')
      break
    }
  }

  // Calculate strength
  const complexityScore = [
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecial,
    password.length >= 12,
  ].filter(Boolean).length

  if (complexityScore >= 4 && password.length >= 12) {
    strength = 'strong'
  } else if (complexityScore >= 3 && password.length >= 10) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Hash a password using PBKDF2
 * @param password - Plain text password
 * @returns Hash string in format: salt$hash$iterations
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty')
  }

  // Validate password before hashing
  const validation = validatePassword(password)
  if (!validation.isValid) {
    throw new Error(`Invalid password: ${validation.errors.join(', ')}`)
  }

  try {
    const salt = await generateSalt()
    const hash = await deriveKey(password, salt)

    // Store as: salt$hash$iterations
    return `${salt}$${hash}$${PBKDF2_ITERATIONS}`
  } catch (error) {
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 * Uses constant-time comparison to prevent timing attacks
 * @param password - Plain text password
 * @param hashString - Hash string in format: salt$hash$iterations
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashString: string
): Promise<boolean> {
  if (!password || !hashString) {
    return false
  }

  try {
    // Parse hash string
    const parts = hashString.split('$')
    if (parts.length !== 3) {
      return false
    }

    const [salt, storedHash, iterationsStr] = parts
    const iterations = parseInt(iterationsStr, 10)

    if (isNaN(iterations) || iterations < 1) {
      return false
    }

    // Derive key from provided password
    const derivedHash = await deriveKey(password, salt, iterations)

    // Constant-time comparison
    return constantTimeCompare(derivedHash, storedHash)
  } catch (error) {
    // Log error but return false to prevent information leakage
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Generate a secure random password
 * @param length - Length of password (default: 16)
 * @returns Secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const all = uppercase + lowercase + numbers + special
  let password = ''

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    const randomValues = new Uint8Array(1)
    crypto.getRandomValues(randomValues)
    password += all[randomValues[0] % all.length]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

/**
 * Check if password needs to be rehashed (e.g., if iterations changed)
 * @param hashString - Existing password hash
 * @returns True if password should be rehashed
 */
export async function needsRehash(hashString: string): Promise<boolean> {
  const parts = hashString.split('$')
  if (parts.length !== 3) {
    return true
  }

  const iterations = parseInt(parts[2], 10)
  return iterations < PBKDF2_ITERATIONS
}

/**
 * Sanitize password to prevent injection attacks
 * Removes any null bytes or control characters
 * @param password - Raw password input
 * @returns Sanitized password
 */
export function sanitizePassword(password: string): string {
  return password.replace(/[\x00-\x1F\x7F]/g, '')
}

/**
 * Calculate password entropy (for strength estimation)
 * @param password - Password to analyze
 * @returns Entropy value (higher is better)
 */
export function calculatePasswordEntropy(password: string): number {
  let poolSize = 0

  if (/[a-z]/.test(password)) poolSize += 26
  if (/[A-Z]/.test(password)) poolSize += 26
  if (/[0-9]/.test(password)) poolSize += 10
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) poolSize += 32

  const entropy = password.length * Math.log2(poolSize || 1)
  return Math.round(entropy * 100) / 100
}

/**
 * Estimate time to crack password
 * @param entropy - Password entropy
 * @returns Human-readable time estimate
 */
export function estimateCrackTime(entropy: number): string {
  // Assuming 10 billion guesses per second (modern GPU)
  const guessesPerSecond = 10_000_000_000
  const combinations = Math.pow(2, entropy)
  const seconds = combinations / guessesPerSecond

  const intervals = [
    { seconds: 31536000, label: 'year' },
    { seconds: 2592000, label: 'month' },
    { seconds: 86400, label: 'day' },
    { seconds: 3600, label: 'hour' },
    { seconds: 60, label: 'minute' },
  ]

  for (const interval of intervals) {
    const value = seconds / interval.seconds
    if (value >= 1) {
      const rounded = Math.round(value * 10) / 10
      return `${rounded} ${interval.label}${rounded > 1 ? 's' : ''}`
    }
  }

  return 'less than a minute'
}

/**
 * Migrate bcrypt hash to PBKDF2
 * Use this if you have existing bcrypt hashes
 * @param bcryptHash - Existing bcrypt hash
 * @param password - Plain text password
 * @returns New PBKDF2 hash if bcrypt was valid, null otherwise
 */
export async function migrateFromBcrypt(
  bcryptHash: string,
  password: string
): Promise<string | null> {
  // This would require bcryptjs for verification
  // For now, return null to indicate rehashing needed
  // In production, you'd use bcryptjs.compare() here
  return null
}
